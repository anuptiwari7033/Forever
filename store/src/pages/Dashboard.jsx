import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { StoreContext } from "../context/StoreContext";
import { getStoreOrders, markOrderPacked } from "../services/api";
import { getSocket } from "../services/socket";
import OrderRow from "../components/OrderRow";

const activeStatuses = [
  "placed",
  "searching_rider",
  "accepted",
  "arrived_at_store",
  "picked_up",
  "out_for_delivery",
  "arrived_at_customer",
];

const Dashboard = () => {
  const { backendUrl, token, store } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [markingId, setMarkingId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadOrders = async () => {
    const { data } = await getStoreOrders(backendUrl, token);
    if (data.success) setOrders(data.orders);
  };

  useEffect(() => {
    if (token) loadOrders();
  }, [token]);

  // The socket room join (`store:${storeId}`) already happened in
  // StoreContext via identifyStore() right after login/profile load.
  useEffect(() => {
    if (!store) return;
    const socket = getSocket(backendUrl);

    const upsertOrder = (incoming) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === incoming._id);
        if (exists) {
          return prev.map((o) => (o._id === incoming._id ? { ...o, ...incoming } : o));
        }
        return [incoming, ...prev];
      });
    };

    const onNewOrder = (order) => {
      upsertOrder(order);
      toast.info(`New order! ${order.items?.length || ""} item(s) — please start packing.`);
    };

    const onStatusUpdate = (order) => upsertOrder(order);

    const onPendingCountUpdate = (payload) => {
      if (payload.storeId === String(store._id)) {
        setPendingCount(payload.pendingCount || 0);
      }
    };

    socket.on("new-order", onNewOrder);
    socket.on("order-status-update", onStatusUpdate);
    socket.on("store-pending-count-update", onPendingCountUpdate);

    return () => {
      socket.off("new-order", onNewOrder);
      socket.off("order-status-update", onStatusUpdate);
      socket.off("store-pending-count-update", onPendingCountUpdate);
    };
  }, [store, backendUrl]);

  const handleMarkPacked = async (orderId) => {
    setMarkingId(orderId);
    try {
      const { data } = await markOrderPacked(backendUrl, token, orderId);
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
        toast.success("Marked as packed");
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setMarkingId(null);
    }
  };

  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => !activeStatuses.includes(o.status));

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 pb-16">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">
        Active orders ({activeOrders.length})
      </h1>

      {pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">
            {pendingCount} order{pendingCount > 1 ? "s" : ""} waiting for a rider
          </p>
          <p className="text-xs text-amber-700 mt-1">
            These orders are queued and will be assigned as soon as a rider is available.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {activeOrders.map((order) => (
          <OrderRow
            key={order._id}
            order={order}
            onMarkPacked={handleMarkPacked}
            marking={markingId === order._id}
          />
        ))}
        {activeOrders.length === 0 && (
          <p className="text-sm text-gray-400">No active orders right now.</p>
        )}
      </div>

      {pastOrders.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 mt-8 mb-3">Past orders</h2>
          <div className="flex flex-col gap-3">
            {pastOrders.slice(0, 20).map((order) => (
              <OrderRow key={order._id} order={order} onMarkPacked={() => {}} marking={false} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
