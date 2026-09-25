import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RiderContext } from "../context/RiderContext";
import StatusToggle from "../components/StatusToggle";
import OrderCard from "../components/OrderCard";
import { getAssignedOrder, acceptOrderRest, rejectOrderRest } from "../services/api";
import { getSocket } from "../services/socket";

const Dashboard = () => {
  const { backendUrl, token, rider, loadProfile } = useContext(RiderContext);
  const [activeOrder, setActiveOrder] = useState(null);
  const [offerOrder, setOfferOrder] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  // const loadAssignedOrder = async () => {
  //   const { data } = await getAssignedOrder(backendUrl, token);
  //   if (data.success) {
  //     setActiveOrder(data.order);
  //     setPendingCount(data.pendingCount || 0);
  //   }
  // };
  const loadAssignedOrder = async () => {
  const { data } = await getAssignedOrder(backendUrl, token);
  if (data.success) {
    setActiveOrder(data.order);

    // NEW: refresh pe bhi offer wapas dikhado agar backend se mila
    if (data.offeredOrder) {
      setOfferOrder(data.offeredOrder);
    }

    setPendingCount(data.pendingCount || 0);
  }
};

  useEffect(() => {
    if (token) loadAssignedOrder();
  }, [token]);

  useEffect(() => {
    if (!rider) return;
    const socket = getSocket(backendUrl);

    const onNewOrder = (incomingOrder) => {
      if (incomingOrder.status === "searching_rider") {
        setOfferOrder(incomingOrder);
        toast.info("New ride offer received!");
      }
    };

    const onOrderStatusUpdate = (incomingOrder) => {
      if (activeOrder && incomingOrder._id === activeOrder._id) {
        if (["delivered", "cancelled", "rejected"].includes(incomingOrder.status)) {
          setActiveOrder(null);
        } else {
          setActiveOrder(incomingOrder);
        }
      }

      if (offerOrder && incomingOrder._id === offerOrder._id) {
        if (incomingOrder.status !== "searching_rider") {
          setOfferOrder(null);
          if (incomingOrder.riderId && incomingOrder.riderId?._id !== rider._id && incomingOrder.riderId !== rider._id) {
            toast.info("This offer was accepted by another rider.");
          }
        } else {
          setOfferOrder(incomingOrder);
        }
      }
    };

    const onPendingCountUpdate = (payload) => {
      if (!rider?.storeId) return;
      const storeId =
        typeof rider.storeId === "object" ? rider.storeId._id : rider.storeId;
      if (payload.storeId === String(storeId)) {
        setPendingCount(payload.pendingCount || 0);
      }
    };

    socket.on("new-order", onNewOrder);
    socket.on("order-status-update", onOrderStatusUpdate);
    socket.on("store-pending-count-update", onPendingCountUpdate);
    return () => {
      socket.off("new-order", onNewOrder);
      socket.off("order-status-update", onOrderStatusUpdate);
      socket.off("store-pending-count-update", onPendingCountUpdate);
    };
  }, [rider, backendUrl, activeOrder, offerOrder]);

  const handleAccept = async () => {
    if (rider?.status === "on_delivery") {
      toast.info("Finish your current ride before accepting this offer.");
      return;
    }

    const { data } = await acceptOrderRest(backendUrl, token, offerOrder._id);
    if (data.success) {
      toast.success("Order accepted");
      setOfferOrder(null);
      loadProfile();
      navigate("/order");
    } else {
      toast.error(data.message);
    }
  };

  const handleReject = async () => {
    const { data } = await rejectOrderRest(backendUrl, token, offerOrder._id);
    if (data.success) {
      toast.info("Order rejected");
      setOfferOrder(null);
      loadProfile();
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
        <StatusToggle />
      </div>

      {/* Store queue status — nudges a busy rider to finish so waiting
          orders can be handed over. (req 6) */}
      {rider?.status === "on_delivery" && pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">
            Complete your current delivery as soon as possible.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Pending Orders: {pendingCount}
          </p>
        </div>
      )}

      {rider?.status !== "on_delivery" && pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            Pending Orders waiting for a rider: {pendingCount}
          </p>
        </div>
      )}

      {offerOrder ? (
        <div className="border-2 border-green-500 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-700 mb-2">New ride offer</p>
          <OrderCard order={offerOrder} />
          <div className="text-sm text-gray-600 mt-2">
            {rider?.status === "on_delivery" ? (
              <p>You have an active ride. You can still see this offer, but acceptance is disabled until you finish your current delivery.</p>
            ) : (
              <p>This offer will be available until another rider accepts it.</p>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAccept}
              disabled={rider?.status === "on_delivery"}
              className={`flex-1 rounded py-2 text-sm font-medium ${
                rider?.status === "on_delivery"
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white"
              }`}
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500 text-white rounded py-2 text-sm font-medium"
            >
              Reject
            </button>
          </div>
        </div>
      ) : activeOrder ? (
        <div
          onClick={() => navigate("/order")}
          className="cursor-pointer border border-gray-200 rounded-lg p-4"
        >
          <p className="text-sm font-semibold text-gray-700 mb-2">Active order</p>
          <OrderCard order={activeOrder} />
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-8 text-center">
          No active orders. Go online to start receiving requests.
        </p>
      )}
    </div>
  );
};

export default Dashboard;
