import { useContext, useEffect, useState } from "react";
import { RiderContext } from "../context/RiderContext";
import { getRiderOrderHistory } from "../services/api";
import OrderCard from "../components/OrderCard";

const OrderHistory = () => {
  const { backendUrl, token } = useContext(RiderContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getRiderOrderHistory(backendUrl, token).then(({ data }) => data.success && setOrders(data.orders));
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-6 px-4 pb-16">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Delivery history</h1>
      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} />
        ))}
        {orders.length === 0 && <p className="text-sm text-gray-400">No deliveries yet.</p>}
      </div>
    </div>
  );
};

export default OrderHistory;
