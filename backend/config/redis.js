import IORedis from "ioredis";

// Redis connection used by BullMQ (rider-assignment queue) + any other cache use.
//
// BullMQ REQUIRES `maxRetriesPerRequest: null` on the ioredis client, otherwise
// Workers/blocking commands throw at runtime. Missing this option is the single
// most common "BullMQ won't start" error, so it is set here for every client.
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const baseOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Keep retrying to reconnect forever (capped delay) instead of giving up,
  // so a Redis restart doesn't permanently break the queue.
  retryStrategy: (times) => Math.min(times * 200, 3000),
};

// Blocking clients (BullMQ Workers) must NOT share the same connection as the
// Queue, so we expose a factory that mints a fresh, correctly-configured client.
export const createRedisConnection = () => {
  const connection = new IORedis(redisUrl, baseOptions);
  connection.on("error", (error) => {
    console.error("[redis] connection error:", error.message);
  });
  connection.on("connect", () => {
    console.log("[redis] connected");
  });
  return connection;
};

// Shared, non-blocking client (used by Queues, cache reads, etc.).
export const redisConnection = createRedisConnection();

export default redisConnection;
