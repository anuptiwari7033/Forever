import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { RiderContext } from "../context/RiderContext";
import { toggleRiderStatus } from "../services/api";

const StatusToggle = () => {
  const { backendUrl, token, rider, setRider } = useContext(RiderContext);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    if (!navigator.geolocation) {
      toast.error("Location is required to go online");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await toggleRiderStatus(
            backendUrl,
            token,
            pos.coords.latitude,
            pos.coords.longitude
          );
          if (data.success) {
            setRider(data.rider);
            toast.success(`You are now ${data.rider.status}`);
          } else {
            toast.error(data.message);
          }
        } catch (e) {
          toast.error(e.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Could not access your location");
        setLoading(false);
      }
    );
  };

  if (!rider) return null;
  const isOnline = rider.status === "online";
  const isOnDelivery = rider.status === "on_delivery";

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isOnDelivery}
      className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
        isOnDelivery
          ? "bg-amber-100 text-amber-700 cursor-not-allowed"
          : isOnline
          ? "bg-green-600 text-white"
          : "bg-gray-200 text-gray-700"
      }`}
    >
      {isOnDelivery ? "On delivery" : isOnline ? "Online — tap to go offline" : "Offline — tap to go online"}
    </button>
  );
};

export default StatusToggle;
