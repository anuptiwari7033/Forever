import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

const MinutesOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/order/admin/list", {
        headers: { token },
      });
      if (response.data.success) setOrders(response.data.orders);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // simple polling refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p className="mb-2 font-medium">Velora Minutes Orders</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 text-xs font-semibold text-gray-500">
          <p>Order</p>
          <p>Items</p>
          <p>Amount</p>
          <p>Status</p>
          <p>Placed</p>
        </div>
        {orders.map((order) => (
          <div
            key={order._id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 border text-sm items-center"
          >
            <p>#{order._id.slice(-6)}</p>
            <p>{order.items.length}</p>
            <p>₹{order.amount}</p>
            <p className="capitalize">{order.status.replaceAll("_", " ")}</p>
            <p>{new Date(order.date).toLocaleString()}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
      </div>
    </div>
  );
};

export default MinutesOrders;
