import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { MinutesContext } from "../context/MinutesContext";
import { fetchMinuteOrder } from "../services/minutesApi";
import MapTracker from "../components/MapTracker";

import {
  joinOrderRoom,
  leaveOrderRoom,
} from "../services/socketService.js";

const activeStatuses = [
  "accepted",
  "arrived_at_store",
  "picked_up",
  "out_for_delivery",
  "arrived_at_customer",
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const { backendUrl, token } = useContext(MinutesContext);
  const [order, setOrder] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);

  const load = () => {
    fetchMinuteOrder(backendUrl, token, orderId).then(({ data }) => {
      if (data.success) {
        setOrder(data.order);
        setCheckpoints(data.checkpoints);
      }
    });
  };

  // useEffect(() => {
  //   load();
  // }, [orderId]);

  useEffect(() => {
  if (!token || !backendUrl || !orderId) return;

  load();
}, [token, backendUrl, orderId]);

useEffect(() => {
  if (!backendUrl || !orderId) return;

  const socket = joinOrderRoom(backendUrl, orderId);

  socket.on("order-status-update", (updatedOrder) => {
    setOrder(updatedOrder);
    load();
  });

  socket.on("order-packed", (updatedOrder) => {
    setOrder(updatedOrder);
    load();
  });

  return () => {
    leaveOrderRoom(backendUrl, orderId);

    socket.off("order-status-update");
    socket.off("order-packed");
  };
}, [backendUrl, orderId]);

  if (!order) return <p className="mt-8 text-sm text-gray-400">Loading order...</p>;

  const isActive = activeStatuses.includes(order.status);

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-1">Order #{order._id.slice(-6)}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.amount}
      </p>

      {/* {isActive && order.riderId ? ( */}

      {isActive &&( order.status== "out_for_delivery" ||  order.status== "picked_up") ? (
        <MapTracker
          backendUrl={backendUrl}
          orderId={order._id}
          storeLocation={order.storeLocation}
          customerLocation={order.address.location}
          initialRiderLocation={
            order.currentRiderLocation?.lat != null ? order.currentRiderLocation : null
          }
          initialStatus={order.status}
          initialDistanceKm={order.distanceRemainingKm}
          initialEtaMinutes={order.etaMinutes}
        />
      ) : (
        <div className="border border-gray-200 rounded p-4 text-sm">
          {order.status === "placed" || order.status === "searching_rider" ? (
            <>
              <p className="font-medium text-gray-800 mb-1">
                {order.packedByStore
                  ? "📦 Packed! Searching for a nearby rider..."
                  : "📦 Your items are being packed"}
              </p>
              <p className="text-xs text-gray-500">
                {order.packedByStore
                  ? "The store has packed your order — we're matching you with a rider now."
                  : "The store has your order and is getting it ready. This usually takes just a couple of minutes."}
              </p>
            </>
          ) : order.status === "rejected" || order.status === "cancelled" ? (
            <p className="font-medium text-gray-800">Order {order.status}.</p>
          ) : (
            <p className="font-medium text-gray-800">Status: {order.status.replaceAll("_", " ")}</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Order timeline</h2>
        <div className="flex flex-col gap-2">
          {checkpoints.map((cp) => (
            <div key={cp._id} className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1">
              <span>{cp.event.replaceAll("_", " ")}</span>
              <span>{new Date(cp.date).toLocaleTimeString()}</span>
            </div>
          ))}
          {checkpoints.length === 0 && <p className="text-xs text-gray-400">No updates yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
