import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { MinutesContext } from "../context/MinutesContext";
import { fetchMyMinuteOrders } from "../services/minutesApi";

const statusColor = {
  delivered: "text-green-700",
  cancelled: "text-red-600",
  rejected: "text-red-600",
};

const Orders = () => {
  const { backendUrl, token } = useContext(MinutesContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchMyMinuteOrders(backendUrl, token).then(({ data }) => data.success && setOrders(data.orders));
  }, []);

  return (
    <div className="mt-4 pb-24">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Your Velora Minutes orders</h1>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/minutes/orders/${order._id}`}
            className="border border-gray-200 rounded p-3 flex justify-between items-center"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.amount}
              </p>
              <p className={`text-xs mt-1 ${statusColor[order.status] || "text-gray-500"}`}>
                {order.status.replaceAll("_", " ")}
              </p>
            </div>
            <span className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
      </div>
    </div>
  );
};

export default Orders;
