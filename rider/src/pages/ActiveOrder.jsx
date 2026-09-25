import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RiderContext } from "../context/RiderContext";
import RiderMap from "../components/RiderMap";
import OrderCard from "../components/OrderCard";
import { getSocket } from "../services/socket";
import {
  getAssignedOrder,
  acceptOrderRest,
  rejectOrderRest,
  arrivedAtStoreRest,
  pickupOrderRest,
  deliveredOrderRest,
} from "../services/api";

const ActiveOrder = () => {
  const { backendUrl, token, rider, loadProfile } = useContext(RiderContext);
  const [order, setOrder] = useState(null);
  const [pendingOffer, setPendingOffer] = useState(null);

  // Live pending count — socket se update hoti rehti hai
  const [pendingCount, setPendingCount] = useState(0);

  // Baseline — sirf ek baar, page load hote hi set hota hai.
  // Isse pata chalega ki order shuru hone se PEHLE bhi pending tha ya nahi.
  const [initialPendingCount, setInitialPendingCount] = useState(0);

  const [orderChecked, setOrderChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // const load = async () => {
  //   const { data } = await getAssignedOrder(backendUrl, token);
  //   console.log("getAssignedOrder response:", data);
  //   if (data.success) {
  //     setOrder(data.order || null);
  //     const count = data.pendingCount || 0;
  //     setPendingCount(count);
  //     setInitialPendingCount(count); // baseline yahin fix ho gaya
  //   }
  //   setOrderChecked(true);
  // };
  const load = async () => {
  const { data } = await getAssignedOrder(backendUrl, token);
  if (data.success) {
    setOrder(data.order || null);

    // NEW: refresh pe bhi offer wapas dikhado agar backend se mila
    if (data.offeredOrder) {
      setPendingOffer(data.offeredOrder);
    }

    const count = data.pendingCount || 0;
    setPendingCount(count);
    setInitialPendingCount(count);
  }
  setOrderChecked(true);
};

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (orderChecked && !order && !pendingOffer) {
      navigate("/");
      return;
    }
  }, [orderChecked, order, pendingOffer, navigate]);

  useEffect(() => {
    if (!rider) return;
    const socket = getSocket(backendUrl);

    const onNewOrder = (incomingOrder) => {
      if (incomingOrder.status === "searching_rider") {
        setPendingOffer(incomingOrder);
        toast.info("New ride offer received while on delivery.");
      }
    };

    const onOrderStatusUpdate = (incomingOrder) => {
      if (order && incomingOrder._id === order._id) {
        setOrder(incomingOrder);
        if (incomingOrder.status === "delivered") {
          loadProfile();
          setOrder(null);
          if (pendingOffer) {
            toast.info("Pending offer is still available after delivery.");
          }
        }
      }
      if (pendingOffer && incomingOrder._id === pendingOffer._id && incomingOrder.status !== "searching_rider") {
        setPendingOffer(null);
      }
    };

    // Dashboard jaisa hi socket event — sirf pendingCount update karta hai,
    // initialPendingCount ko yeh kabhi nahi chhuta
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
  }, [rider, backendUrl, order, pendingOffer]);

  const handleAccept = async (orderId) => {
    const { data } = await acceptOrderRest(backendUrl, token, orderId);
    if (data.success) {
      toast.success("Ride accepted");
      setPendingOffer(null);
      setOrder(data.order);
      navigate("/order");
    } else {
      toast.error(data.message);
    }
  };

  const handleReject = async (orderId) => {
    const { data } = await rejectOrderRest(backendUrl, token, orderId);
    if (data.success) {
      toast.info("Ride rejected");
      setPendingOffer(null);
    } else {
      toast.error(data.message);
    }
  };

  const runAction = async (fn, successMessage) => {
    setLoading(true);
    try {
      const { data } = await fn(backendUrl, token, order._id);
      if (data.success) {
        setOrder(data.order);
        toast.success(successMessage);
        if (data.order.status === "delivered") {
          loadProfile();
          if (!pendingOffer) {
            setTimeout(() => navigate("/"), 1200);
          } else {
            toast.info("Delivery complete. You still have a pending offer.");
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order && !pendingOffer && !orderChecked) {
    return <p className="mt-8 text-sm text-gray-400 text-center">Loading order...</p>;
  }

  if (!order && !pendingOffer && orderChecked) {
    return <p className="mt-8 text-sm text-gray-400 text-center">Returning to dashboard...</p>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6 px-4 pb-16">
      {order ? (
        <>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Order #{order._id.slice(-6)}</h1>
          <p className="text-sm text-gray-500 mb-4 capitalize">{order.status.replaceAll("_", " ")}</p>

          {/* Pending queue banner
              - initialPendingCount > 0  => order shuru hone se PEHLE hi pending tha
              - initialPendingCount === 0 but pendingCount > 0 => bich me naya order aaya */}
          {pendingCount > 0 && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
              {initialPendingCount > 0 ? (
                <>
                  <p className="text-sm font-semibold text-amber-800">
                    Orders were already pending before you started this delivery.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please complete this delivery quickly. Pending Orders: {pendingCount}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-amber-800">
                    Complete your current delivery as soon as possible.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    New orders have come in. Pending Orders: {pendingCount}
                  </p>
                </>
              )}
            </div>
          )}

          <RiderMap backendUrl={backendUrl} order={order} />

          <div className="mt-4 border border-gray-200 rounded p-3 text-sm">
            <p className="font-medium text-gray-700">Deliver to</p>
            <p className="text-gray-500">{order.address.addressLine}</p>
            <p className="font-medium text-gray-700 mt-2">Items</p>
            <ul className="text-gray-500 list-disc pl-4">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
            <p className="font-medium text-gray-700 mt-2">Payment</p>
            <p className="text-gray-500">
              {order.paymentMethod} · ₹{order.amount}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {order.status === "accepted" && (
              <button
                disabled={loading}
                onClick={() => runAction(arrivedAtStoreRest, "Marked arrived at store")}
                className="bg-blue-600 text-white rounded py-3 text-sm font-medium"
              >
                I've arrived at the store
              </button>
            )}
            {order.status === "arrived_at_store" && (
              <button
                disabled={loading}
                onClick={() => runAction(pickupOrderRest, "Order picked up")}
                className="bg-indigo-600 text-white rounded py-3 text-sm font-medium"
              >
                Confirm pickup
              </button>
            )}
            {(order.status === "out_for_delivery" || order.status === "arrived_at_customer") && (
              <button
                disabled={loading}
                onClick={() => runAction(deliveredOrderRest, "Order marked delivered")}
                className="bg-green-600 text-white rounded py-3 text-sm font-medium"
              >
                Confirm delivery
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-700">Your previous ride is complete.</p>
          <p className="text-sm text-gray-500 mt-1">Waiting for your next request.</p>
        </div>
      )}

      {pendingOffer && (
        <div className="mt-6 border border-yellow-300 bg-yellow-50 rounded p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-3">Pending offer while on delivery</p>
          <OrderCard order={pendingOffer} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleAccept(pendingOffer._id)}
              disabled={rider?.status === "on_delivery" || loading}
              className={`flex-1 rounded py-2 text-sm font-medium ${
                rider?.status === "on_delivery"
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white"
              }`}
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(pendingOffer._id)}
              disabled={loading}
              className="flex-1 bg-red-500 text-white rounded py-2 text-sm font-medium"
            >
              Reject
            </button>
          </div>
          {rider?.status === "on_delivery" && (
            <p className="text-xs text-gray-600 mt-2">You can view this offer, but acceptance is disabled until you finish the current delivery.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveOrder;