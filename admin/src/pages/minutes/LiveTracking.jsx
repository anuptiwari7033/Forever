import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

const onOrderIcon = L.divIcon({
  html: '<div style="font-size:24px;">🛵</div>',
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Idle-but-online riders (no active order yet) get a slightly muted icon so
// it's easy to tell them apart from riders who are actually out delivering.
const idleOnlineIcon = L.divIcon({
  html: '<div style="font-size:22px;opacity:0.6;">🛵</div>',
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const activeStatuses = [
  "accepted",
  "arrived_at_store",
  "picked_up",
  "out_for_delivery",
  "arrived_at_customer",
];

// Shows:
// 1) Every rider who is simply online (using their rider.location field,
//    set the moment they toggle online) — so "online but no order yet"
//    riders are visible too, and
// 2) Every currently-active order's rider (using order.currentRiderLocation),
//    updated live as `location-update` events arrive.
// If a rider has both, the order-based (more granular, updates every GPS
// tick) location wins.
const LiveTracking = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const socketRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());

  const fetchOrders = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/order/admin/list", {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.orders.filter((o) => activeStatuses.includes(o.status)));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const fetchRiders = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/rider/admin/list", {
        headers: { token },
      });
      if (response.data.success) {
        setRiders(response.data.riders.filter((r) => r.status !== "offline"));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const fetchAll = () => {
    fetchOrders();
    fetchRiders();
  };

  // One socket for the lifetime of this page.
  useEffect(() => {
    const socket = io(backendUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("location-update", (payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === payload.orderId
            ? { ...o, currentRiderLocation: payload.riderLocation, status: payload.status }
            : o
        )
      );
    });

    fetchAll();
    const interval = setInterval(fetchAll, 15000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Join any newly discovered order rooms (idempotent) so we get their
  // location-update ticks live instead of waiting for the next poll.
  useEffect(() => {
    if (!socketRef.current) return;
    orders.forEach((o) => {
      if (!joinedRoomsRef.current.has(o._id)) {
        socketRef.current.emit("join-order", { orderId: o._id });
        joinedRoomsRef.current.add(o._id);
      }
    });
  }, [orders]);

  const orderRiderIds = new Set(orders.map((o) => (o.riderId?._id || o.riderId)?.toString()));
  const ordersWithRider = orders.filter((o) => o.currentRiderLocation?.lat != null);

  // Riders who are online but NOT already shown via an active order marker.
  const idleRiders = riders.filter(
    (r) => !orderRiderIds.has(r._id.toString()) && r.location?.lat != null
  );

  const allMarkers = [
    ...ordersWithRider.map((o) => ({
      key: `order-${o._id}`,
      position: o.currentRiderLocation,
      icon: onOrderIcon,
      label: `Order #${o._id.slice(-6)} · ${o.status.replaceAll("_", " ")}`,
    })),
    ...idleRiders.map((r) => ({
      key: `rider-${r._id}`,
      position: r.location,
      icon: idleOnlineIcon,
      label: `${r.name} · online (no order yet)`,
    })),
  ];

  const center = allMarkers[0]?.position || { lat: 20.5937, lng: 78.9629 };

  return (
    <div>
      <p className="mb-2 font-medium">
        Live Rider Tracking ({ordersWithRider.length} on delivery, {idleRiders.length} online)
      </p>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={allMarkers.length ? 12 : 5}
        style={{ height: "500px", width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allMarkers.map((m) => (
          <Marker key={m.key} position={[m.position.lat, m.position.lng]} icon={m.icon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {allMarkers.length === 0 && (
        <p className="text-sm text-gray-400 mt-2">
          No riders are online right now, or an online rider hasn't shared a location yet
          (they need to allow location access when going online).
        </p>
      )}
    </div>
  );
};

export default LiveTracking;
