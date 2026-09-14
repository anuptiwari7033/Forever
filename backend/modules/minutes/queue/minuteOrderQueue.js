// import { Queue, Worker, QueueEvents, DelayedError } from "bullmq";
// import minuteOrderModel from "../models/minuteOrderModel.js";
// import storeModel from "../models/storeModel.js";
// import riderModel from "../../rider/models/riderModel.js";
// import { getIO } from "../../../socket/ioInstance.js";
// import {
//   MINUTE_ORDER_STATUS,
//   RIDER_STATUS,
//   TRACKING_EVENTS,
// } from "../../../constants/orderStatus.js";
// import { getDistanceKm } from "../../tracking/services/geoService.js";
// import { sendNotification } from "../../notification/services/notificationService.js";
// import { redisConnection, createRedisConnection } from "../../../config/redis.js";

// // -------------------------------------------------------------------------
// // Store-scoped BullMQ rider-assignment system
// // -------------------------------------------------------------------------
// // One Queue + one Worker + one QueueEvents PER STORE:
// //   store_<storeId>_order_queue
// //
// // Design (satisfies the spec):
// //  - Every new order is added as a job (jobId = orderId → duplicate-safe).       (req 1, 12)
// //  - Each store has its own queue.                                               (req 2)
// //  - Worker concurrency = 1 per store → strict FIFO, one job at a time.          (req 3, 12)
// //  - Worker offers the order to the NEAREST online rider.                        (req 4)
// //  - If NO rider is online, the job is parked with `moveToDelayed` (BullMQ
// //    "check again later" pattern). A delayed job still lives in Redis and is
// //    counted as "pending", so the order keeps waiting instead of being
// //    rejected.                                                                   (req 5, 13)
// //  - When a rider frees up / comes online, we `promote()` the delayed jobs so
// //    the worker retries immediately.                                            (req 4, 7)
// //  - A genuine error (DB/Redis blip) throws normally → BullMQ retries with
// //    exponential backoff, then lands in the failed set (kept + logged).         (req 14)
// // -------------------------------------------------------------------------

// const RETRY_DELAY_MS = 15000; // how long a "no rider yet" order sleeps before re-checking
// const WAITING_STATES = ["waiting", "delayed", "active", "waiting-children"];

// const queueMap = new Map();
// const workerMap = new Map();
// const queueEventsMap = new Map();

// const getQueueName = (storeId) => `store_${storeId}_order_queue`;

// const defaultJobOptions = {
//   removeOnComplete: true,
//   removeOnFail: 1000, // keep last 1000 failed jobs for inspection
//   attempts: 5, // applies to *real* errors only (not the delayed "waiting" path)
//   backoff: { type: "exponential", delay: 5000 },
// };

// // ---- geo helper: nearest rider from a candidate list -------------------------
// const findNearestRider = (targetLocation, riders = []) => {
//   if (!targetLocation || !riders.length) return null;

//   let nearest = null;
//   let nearestDistance = Infinity;

//   for (const rider of riders) {
//     if (!rider.location || rider.location.lat == null) continue;
//     const distance = getDistanceKm(targetLocation, rider.location);
//     if (distance < nearestDistance) {
//       nearestDistance = distance;
//       nearest = rider;
//     }
//   }

//   return nearest ? { rider: nearest, distanceKm: nearestDistance } : null;
// };

// // ---- socket helper -----------------------------------------------------------
// const safeEmit = (room, event, payload) => {
//   try {
//     getIO().to(room).emit(event, payload);
//   } catch (e) {
//     // Socket.IO not initialized yet (e.g. one-off script) — safe to ignore.
//   }
// };

// // -------------------------------------------------------------------------
// // Core assignment logic — runs inside the Worker for a single order job.
// // Returns { offered } or parks the job as delayed (throws DelayedError).
// // -------------------------------------------------------------------------
// const processAssignment = async (job, token) => {
//   const { orderId, storeId } = job.data;

//   const order = await minuteOrderModel.findById(orderId);

//   // Order gone / already handled → nothing to do, let the job complete.
//   if (!order || order.status !== MINUTE_ORDER_STATUS.SEARCHING_RIDER) {
//     return { done: true };
//   }

//   // Already offered to a rider and awaiting their Accept/Reject → let it
//   // complete; the reject flow re-queues it if the rider declines.
//   if (order.pendingOfferRiderId) {
//     return { alreadyOffered: true };
//   }

//   // Riders that already have a live offer for this store shouldn't get a 2nd one.
//   const busyOfferOrders = await minuteOrderModel
//     .find({
//       storeId: order.storeId,
//       status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
//       pendingOfferRiderId: { $ne: null },
//     })
//     .select("pendingOfferRiderId");
//   const ridersWithOffer = busyOfferOrders.map((o) => o.pendingOfferRiderId);

//   // Only ONLINE riders of THIS store, minus anyone who already rejected it,       (req 9)
//   // minus anyone already holding an offer.
//   const availableRiders = await riderModel.find({
//     storeId: order.storeId,
//     status: RIDER_STATUS.ONLINE,
//     _id: { $nin: [...(order.riderRejections || []), ...ridersWithOffer] },
//   });

//   const nearest = findNearestRider(order.storeLocation, availableRiders);

//   // No rider available right now → park the job (still "pending" in Redis).       (req 5, 13)
//   if (!nearest) {
//     await job.moveToDelayed(Date.now() + RETRY_DELAY_MS, token);
//     throw new DelayedError();
//   }

//   const targetRider = nearest.rider;

//   // Atomic offer — guarantees a single order is offered to a single rider even
//   // if multiple riders come online at once.                                       (req 12)
//   const updatedOrder = await minuteOrderModel.findOneAndUpdate(
//     {
//       _id: order._id,
//       status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
//       pendingOfferRiderId: null,
//       riderAccepted: false,
//       riderId: null,
//       riderRejections: { $nin: [targetRider._id] },
//     },
//     { pendingOfferRiderId: targetRider._id },
//     { new: true }
//   );

//   // Someone else grabbed it between our read and write → re-check next tick.
//   if (!updatedOrder) {
//     await job.moveToDelayed(Date.now() + 2000, token);
//     throw new DelayedError();
//   }

//   // Ride request popup to the chosen rider (manual Accept/Reject — unchanged).    (req 4, 7)
//   safeEmit(`rider:${targetRider._id.toString()}`, TRACKING_EVENTS.NEW_ORDER, updatedOrder);

//   await sendNotification({
//     recipientType: "rider",
//     recipientId: targetRider._id.toString(),
//     title: "New Forever Minutes order",
//     message:
//       targetRider.location?.lat != null
//         ? `Pickup at store, ${nearest.distanceKm.toFixed(1)} km away.`
//         : "A new nearby order is available.",
//     orderId: order._id.toString(),
//   });

//   await emitStorePendingCount(storeId);
//   return { offered: true, riderId: targetRider._id.toString() };
// };

// // -------------------------------------------------------------------------
// // Lazy per-store queue / worker / events construction
// // -------------------------------------------------------------------------
// const getStoreQueue = (storeId) => {
//   const name = getQueueName(storeId);
//   if (!queueMap.has(name)) {
//     queueMap.set(
//       name,
//       new Queue(name, { connection: redisConnection, defaultJobOptions })
//     );
//     // Spin up the worker + events alongside the queue so the store is fully live.
//     ensureStoreWorker(storeId);
//   }
//   return queueMap.get(name);
// };

// const ensureStoreWorker = (storeId) => {
//   const name = getQueueName(storeId);

//   if (!workerMap.has(name)) {
//     const worker = new Worker(name, (job, token) => processAssignment(job, token), {
//       connection: createRedisConnection(), // blocking client MUST be its own connection
//       concurrency: 1, // FIFO + no duplicate assignment
//       lockDuration: 30000,
//     });

//     worker.on("failed", (job, err) => {
//       if (err instanceof DelayedError || err?.name === "DelayedError") return; // expected "waiting" path
//       console.error(
//         `[queue] ${name} job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
//         err?.message
//       );
//     });
//     worker.on("error", (err) => {
//       console.error(`[queue] ${name} worker error:`, err?.message);
//     });

//     workerMap.set(name, worker);
//   }

//   if (!queueEventsMap.has(name)) {
//     const queueEvents = new QueueEvents(name, { connection: createRedisConnection() });
//     queueEvents.on("failed", ({ jobId, failedReason }) => {
//       if (failedReason?.includes("DelayedError")) return;
//       console.error(`[queue] ${name} job ${jobId} moved to failed:`, failedReason);
//     });
//     queueEvents.on("stalled", ({ jobId }) => {
//       console.warn(`[queue] ${name} job ${jobId} stalled — will be retried`);
//     });
//     queueEventsMap.set(name, queueEvents);
//   }

//   return workerMap.get(name);
// };

// // -------------------------------------------------------------------------
// // Pending-count broadcasting (store dashboard + rider "Pending Orders: X")
// // -------------------------------------------------------------------------
// // export const getStorePendingCount = async (storeId) => {
// //   try {
// //     const queue = getStoreQueue(storeId);
// //     const counts = await queue.getJobCounts("waiting", "delayed", "active");
// //     return (counts.waiting || 0) + (counts.delayed || 0) + (counts.active || 0);
// //   } catch (e) {
// //     console.error("[queue] getStorePendingCount failed:", e.message);
// //     return 0;
// //   }
// // };
// export const getStorePendingCount = async (storeId) => {
//   try {
//     // True "pending" = orders still waiting for a delivery to start,
//     // regardless of whether they've already been offered to a rider
//     // or not. BullMQ job counts don't capture this because a job
//     // completes (and is removed) the moment it's offered — even
//     // though the order itself is still awaiting Accept/Reject.
//     return await minuteOrderModel.countDocuments({
//       storeId,
//       status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
//     });
//   } catch (e) {
//     console.error("[queue] getStorePendingCount failed:", e.message);
//     return 0;
//   }
// };

// export const emitStorePendingCount = async (storeId) => {
//   const count = await getStorePendingCount(storeId);
//   const payload = { storeId: storeId.toString(), pendingCount: count };

//   safeEmit(`store:${storeId}`, "store-pending-count-update", payload);

//   try {
//     const riders = await riderModel
//       .find({
//         storeId,
//         status: { $in: [RIDER_STATUS.ONLINE, RIDER_STATUS.ON_DELIVERY] },
//       })
//       .select("_id");
//     riders.forEach((rider) =>
//       safeEmit(`rider:${rider._id.toString()}`, "store-pending-count-update", payload)
//     );
//   } catch (e) {
//     console.error("[queue] emitStorePendingCount rider fan-out failed:", e.message);
//   }

//   return count;
// };

// // -------------------------------------------------------------------------
// // Public API (signatures kept identical so existing callers don't change)
// // -------------------------------------------------------------------------

// // Add a new order to its store's queue.                                           (req 1)
// export const addOrderToQueue = async (orderId, storeId) => {
//   const queue = getStoreQueue(storeId);
//   try {
//     await queue.add(
//       "assign-rider",
//       { orderId: orderId.toString(), storeId: storeId.toString() },
//       { jobId: orderId.toString() } // jobId = orderId → can never be queued twice   (req 12)
//     );
//   } catch (e) {
//     if (!e.message?.includes("Job already exists")) {
//       console.error("[queue] addOrderToQueue failed:", e.message);
//     }
//   }
//   await emitStorePendingCount(storeId);
// };

// // Remove an order from the queue (rider accepted / order cancelled).
// export const removeOrderFromQueue = async (orderId, storeId) => {
//   try {
//     const queue = getStoreQueue(storeId);
//     const job = await queue.getJob(orderId.toString());
//     if (job) await job.remove().catch(() => {}); // ignore "locked/active" races
//   } catch (e) {
//     console.error("[queue] removeOrderFromQueue failed:", e.message);
//   }
//   await emitStorePendingCount(storeId);
// };

// // "Wake up" a store's waiting/delayed jobs so the worker re-checks for riders.
// // Called when a rider goes online or finishes a delivery.                         (req 4, 7)
// export const assignNextStoreOrder = async (storeId) => {
//   try {
//     const queue = getStoreQueue(storeId);
//     ensureStoreWorker(storeId);

//     const delayed = await queue.getJobs(["delayed"], 0, -1);
//     for (const job of delayed) {
//       await job.promote().catch(() => {});
//     }

//     const failed = await queue.getJobs(["failed"], 0, -1);
//     for (const job of failed) {
//       await job.retry().catch(() => {});
//     }
//   } catch (e) {
//     console.error("[queue] assignNextStoreOrder failed:", e.message);
//   }
//   await emitStorePendingCount(storeId);
//   return null;
// };

// // -------------------------------------------------------------------------
// // Startup recovery: after a backend restart, re-attach a worker for every
// // store that still has orders searching for a rider, so parked/delayed jobs
// // in Redis keep getting processed.                                               (req 13)
// // -------------------------------------------------------------------------
// export const resumePendingQueues = async () => {
//   try {
//     const storeIds = await minuteOrderModel.distinct("storeId", {
//       status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
//     });

//     // Also cover any store that already has jobs living in Redis.
//     const allStores = await storeModel.find({}).select("_id");

//     const ids = new Set([
//       ...storeIds.map((id) => id.toString()),
//       ...allStores.map((s) => s._id.toString()),
//     ]);

//     for (const storeId of ids) {
//       getStoreQueue(storeId); // creates queue + worker + events

//       // Re-enqueue any order that is still waiting for a rider but isn't
//       // currently offered to anyone — guarantees nothing is lost across a
//       // crash/restart (jobId = orderId makes this idempotent).
//       const waitingOrders = await minuteOrderModel
//         .find({
//           storeId,
//           status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
//           pendingOfferRiderId: null,
//         })
//         .select("_id storeId");
//       for (const order of waitingOrders) {
//         await addOrderToQueue(order._id, order.storeId);
//       }

//       await assignNextStoreOrder(storeId); // promote anything already parked
//     }

//     if (ids.size) {
//       console.log(`[queue] resumed rider-assignment workers for ${ids.size} store(s)`);
//     }
//   } catch (e) {
//     console.error("[queue] resumePendingQueues failed:", e.message);
//   }
// };

// // Graceful shutdown — close workers/queues so Redis connections don't leak.
// export const closeAllQueues = async () => {
//   await Promise.allSettled([
//     ...[...workerMap.values()].map((w) => w.close()),
//     ...[...queueEventsMap.values()].map((qe) => qe.close()),
//     ...[...queueMap.values()].map((q) => q.close()),
//   ]);
// };

// export default {
//   addOrderToQueue,
//   removeOrderFromQueue,
//   getStorePendingCount,
//   emitStorePendingCount,
//   assignNextStoreOrder,
//   resumePendingQueues,
//   closeAllQueues,
// };
import minuteOrderModel from "../models/minuteOrderModel.js";
import storeModel from "../models/storeModel.js";
import riderModel from "../../rider/models/riderModel.js";
import { getIO } from "../../../socket/ioInstance.js";
import {
  MINUTE_ORDER_STATUS,
  RIDER_STATUS,
  TRACKING_EVENTS,
} from "../../../constants/orderStatus.js";
import { getDistanceKm } from "../../tracking/services/geoService.js";
import { sendNotification } from "../../notification/services/notificationService.js";

// -------------------------------------------------------------------------
// In-memory, single-instance rider-assignment queue.
// Redis + BullMQ removed — this only runs correctly on ONE backend process.
// Public API is IDENTICAL to the old file, so callers (minuteOrderService.js,
// server.js) need zero changes.
//
// One in-memory queue PER STORE:
//   storeId -> { queue: [orderId...], processing: bool, timers: Map }
//
// Behaviour parity with the old BullMQ version:
//  - jobId = orderId (dedup)                                    (req 1, 12)
//  - one queue per store                                        (req 2)
//  - processed one order at a time per store → strict FIFO      (req 3, 12)
//  - offers to nearest ONLINE rider                              (req 4)
//  - no rider available → parked, retried after RETRY_DELAY_MS   (req 5, 13)
//  - rider frees up / comes online → assignNextStoreOrder()
//    re-checks parked orders immediately                         (req 4, 7)
//  - restart-safety comes from MongoDB (order status), not Redis  (req 13)
// -------------------------------------------------------------------------

const RETRY_DELAY_MS = 15000; // "no rider yet" re-check interval
const RACE_RETRY_DELAY_MS = 2000; // quick re-check after a write race

const storeStates = new Map(); // storeId -> { queue: [], processing: false, timers: Map }

const getState = (storeId) => {
  const key = storeId.toString();
  if (!storeStates.has(key)) {
    storeStates.set(key, { queue: [], processing: false, timers: new Map() });
  }
  return storeStates.get(key);
};

// ---- geo helper: nearest rider from a candidate list -------------------------
const findNearestRider = (targetLocation, riders = []) => {
  if (!targetLocation || !riders.length) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const rider of riders) {
    if (!rider.location || rider.location.lat == null) continue;
    const distance = getDistanceKm(targetLocation, rider.location);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = rider;
    }
  }

  return nearest ? { rider: nearest, distanceKm: nearestDistance } : null;
};

// ---- socket helper -----------------------------------------------------------
const safeEmit = (room, event, payload) => {
  try {
    getIO().to(room).emit(event, payload);
  } catch (e) {
    // Socket.IO not initialized yet (e.g. one-off script) — safe to ignore.
  }
};

// -------------------------------------------------------------------------
// Core assignment logic — tries to offer ONE order to the nearest rider.
// Returns "offered" | "done" | "retry" (no rider yet) | "race" (lost an
// atomic update race, re-check almost immediately).
// -------------------------------------------------------------------------
const processAssignment = async (orderId, storeId) => {
  const order = await minuteOrderModel.findById(orderId);

  // Order gone / already handled → nothing to do.
  if (!order || order.status !== MINUTE_ORDER_STATUS.SEARCHING_RIDER) {
    return "done";
  }

  // Already offered to a rider and awaiting their Accept/Reject.
  if (order.pendingOfferRiderId) {
    return "done";
  }

  // Riders that already have a live offer for this store shouldn't get a 2nd one.
  const busyOfferOrders = await minuteOrderModel
    .find({
      storeId: order.storeId,
      status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
      pendingOfferRiderId: { $ne: null },
    })
    .select("pendingOfferRiderId");
  const ridersWithOffer = busyOfferOrders.map((o) => o.pendingOfferRiderId);

  // Only ONLINE riders of THIS store, minus anyone who already rejected it,      (req 9)
  // minus anyone already holding an offer.
  const availableRiders = await riderModel.find({
    storeId: order.storeId,
    status: RIDER_STATUS.ONLINE,
    _id: { $nin: [...(order.riderRejections || []), ...ridersWithOffer] },
  });

  const nearest = findNearestRider(order.storeLocation, availableRiders);

  // No rider available right now → caller will park it for a retry.             (req 5, 13)
  if (!nearest) {
    return "retry";
  }

  const targetRider = nearest.rider;

  // Atomic offer — guarantees a single order is offered to a single rider even
  // if multiple riders come online at once.                                     (req 12)
  const updatedOrder = await minuteOrderModel.findOneAndUpdate(
    {
      _id: order._id,
      status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
      pendingOfferRiderId: null,
      riderAccepted: false,
      riderId: null,
      riderRejections: { $nin: [targetRider._id] },
    },
    { pendingOfferRiderId: targetRider._id },
    { new: true }
  );

  // Someone else grabbed it between our read and write → re-check very soon.
  if (!updatedOrder) {
    return "race";
  }

  // Ride request popup to the chosen rider (manual Accept/Reject — unchanged).   (req 4, 7)
  safeEmit(`rider:${targetRider._id.toString()}`, TRACKING_EVENTS.NEW_ORDER, updatedOrder);

  await sendNotification({
    recipientType: "rider",
    recipientId: targetRider._id.toString(),
    title: "New Forever Minutes order",
    message:
      targetRider.location?.lat != null
        ? `Pickup at store, ${nearest.distanceKm.toFixed(1)} km away.`
        : "A new nearby order is available.",
    orderId: order._id.toString(),
  });

  await emitStorePendingCount(storeId);
  return "offered";
};

// -------------------------------------------------------------------------
// Drains a store's queue one order at a time (mirrors old Worker
// concurrency:1 → strict FIFO, no duplicate assignment).
// -------------------------------------------------------------------------
const drainQueue = async (storeId) => {
  const state = getState(storeId);
  if (state.processing) return; // already draining — don't run twice in parallel
  state.processing = true;

  try {
    while (state.queue.length) {
      const orderId = state.queue.shift();
      let result;
      try {
        result = await processAssignment(orderId, storeId);
      } catch (e) {
        console.error(`[queue] processAssignment failed for order ${orderId}:`, e.message);
        result = "retry"; // treat unexpected errors like a transient failure  (req 14)
      }

      if (result === "retry" || result === "race") {
        scheduleRetry(orderId, storeId, result === "race" ? RACE_RETRY_DELAY_MS : RETRY_DELAY_MS);
      }
    }
  } finally {
    state.processing = false;
  }
};

const scheduleRetry = (orderId, storeId, delay) => {
  const state = getState(storeId);
  if (state.timers.has(orderId)) return; // already scheduled, don't double-park
  const timer = setTimeout(() => {
    state.timers.delete(orderId);
    if (!state.queue.includes(orderId)) state.queue.push(orderId);
    drainQueue(storeId);
  }, delay);
  state.timers.set(orderId, timer);
};

// -------------------------------------------------------------------------
// Pending-count broadcasting (store dashboard + rider "Pending Orders: X")
// Still derived straight from MongoDB — same as before, queue state was
// never the source of truth for this.
// -------------------------------------------------------------------------
export const getStorePendingCount = async (storeId) => {
  try {
    return await minuteOrderModel.countDocuments({
      storeId,
      status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
    });
  } catch (e) {
    console.error("[queue] getStorePendingCount failed:", e.message);
    return 0;
  }
};

export const emitStorePendingCount = async (storeId) => {
  const count = await getStorePendingCount(storeId);
  const payload = { storeId: storeId.toString(), pendingCount: count };

  safeEmit(`store:${storeId}`, "store-pending-count-update", payload);

  try {
    const riders = await riderModel
      .find({
        storeId,
        status: { $in: [RIDER_STATUS.ONLINE, RIDER_STATUS.ON_DELIVERY] },
      })
      .select("_id");
    riders.forEach((rider) =>
      safeEmit(`rider:${rider._id.toString()}`, "store-pending-count-update", payload)
    );
  } catch (e) {
    console.error("[queue] emitStorePendingCount rider fan-out failed:", e.message);
  }

  return count;
};

// -------------------------------------------------------------------------
// Public API (signatures kept identical so existing callers don't change)
// -------------------------------------------------------------------------

// Add a new order to its store's queue.                                         (req 1)
export const addOrderToQueue = async (orderId, storeId) => {
  const id = orderId.toString();
  const state = getState(storeId);
  if (!state.queue.includes(id) && !state.timers.has(id)) {
    state.queue.push(id); // jobId = orderId → can never be queued twice        (req 12)
  }
  drainQueue(storeId); // fire-and-forget, same as BullMQ's async processing
  await emitStorePendingCount(storeId);
};

// Remove an order from the queue (rider accepted / order cancelled).
export const removeOrderFromQueue = async (orderId, storeId) => {
  const id = orderId.toString();
  const state = getState(storeId);
  state.queue = state.queue.filter((oid) => oid !== id);
  const timer = state.timers.get(id);
  if (timer) {
    clearTimeout(timer);
    state.timers.delete(id);
  }
  await emitStorePendingCount(storeId);
};

// "Wake up" a store's parked orders so they get re-checked for riders now.
// Called when a rider goes online or finishes a delivery.                       (req 4, 7)
export const assignNextStoreOrder = async (storeId) => {
  const state = getState(storeId);
  for (const [orderId, timer] of [...state.timers.entries()]) {
    clearTimeout(timer);
    state.timers.delete(orderId);
    if (!state.queue.includes(orderId)) state.queue.push(orderId);
  }
  drainQueue(storeId);
  await emitStorePendingCount(storeId);
  return null;
};

// -------------------------------------------------------------------------
// Startup recovery: after a backend restart, re-enqueue every order that's
// still waiting for a rider. Survival across restarts comes from MongoDB
// (order.status), not from Redis persistence — so this still works.            (req 13)
// -------------------------------------------------------------------------
export const resumePendingQueues = async () => {
  try {
    const allStores = await storeModel.find({}).select("_id");

    for (const store of allStores) {
      const storeId = store._id.toString();
      getState(storeId); // creates in-memory state

      const waitingOrders = await minuteOrderModel
        .find({
          storeId,
          status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
          pendingOfferRiderId: null,
        })
        .select("_id storeId");

      for (const order of waitingOrders) {
        await addOrderToQueue(order._id, order.storeId);
      }
    }

    if (allStores.length) {
      console.log(`[queue] resumed rider-assignment queues for ${allStores.length} store(s)`);
    }
  } catch (e) {
    console.error("[queue] resumePendingQueues failed:", e.message);
  }
};

// Graceful shutdown — just clear pending timers, nothing external to close.
export const closeAllQueues = async () => {
  for (const state of storeStates.values()) {
    for (const timer of state.timers.values()) clearTimeout(timer);
    state.timers.clear();
    state.queue = [];
  }
};

export default {
  addOrderToQueue,
  removeOrderFromQueue,
  getStorePendingCount,
  emitStorePendingCount,
  assignNextStoreOrder,
  resumePendingQueues,
  closeAllQueues,
};