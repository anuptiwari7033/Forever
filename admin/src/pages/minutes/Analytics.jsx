import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

const StatCard = ({ label, value }) => (
  <div className="border rounded-lg p-4 flex-1 min-w-[140px]">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-2xl font-semibold text-gray-800">{value}</p>
  </div>
);

const Analytics = ({ token }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    onlineRiders: 0,
    totalStores: 0,
  });

  const load = async () => {
    try {
      const [ordersRes, ridersRes, storesRes] = await Promise.all([
        axios.get(backendUrl + "/api/minutes/order/admin/list", { headers: { token } }),
        axios.get(backendUrl + "/api/rider/admin/list", { headers: { token } }),
        axios.get(backendUrl + "/api/minutes/store/admin/list", { headers: { token } }),
      ]);

      const orders = ordersRes.data.success ? ordersRes.data.orders : [];
      const riders = ridersRes.data.success ? ridersRes.data.riders : [];
      const stores = storesRes.data.success ? storesRes.data.stores : [];

      const delivered = orders.filter((o) => o.status === "delivered");
      const cancelled = orders.filter((o) => o.status === "cancelled");

      setStats({
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        totalRevenue: delivered.reduce((sum, o) => sum + o.amount, 0),
        onlineRiders: riders.filter((r) => r.status !== "offline").length,
        totalStores: stores.length,
      });
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <p className="mb-4 font-medium">Velora Minutes Analytics</p>
      <div className="flex flex-wrap gap-4">
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard label="Delivered" value={stats.deliveredOrders} />
        <StatCard label="Cancelled" value={stats.cancelledOrders} />
        <StatCard label="Revenue (delivered)" value={`₹${stats.totalRevenue}`} />
        <StatCard label="Active riders" value={stats.onlineRiders} />
        <StatCard label="Stores" value={stats.totalStores} />
      </div>
    </div>
  );
};

export default Analytics;
