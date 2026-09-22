import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSocket, joinOrderRoom, leaveOrderRoom } from "../services/socketService";
import { fetchRoadRoute, roughMeters } from "../utils/osrm";

// Emoji-based divIcons so we don't depend on any external image assets
// (keeps this fully offline-friendly and avoids Leaflet's default marker
// image path issues under Vite).
const makeIcon = (emoji) =>
  L.divIcon({
    html: `<div style="font-size:26px;line-height:1;">${emoji}</div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const riderIcon = makeIcon("🛵");
const storeIcon = makeIcon("🏬");
const customerIcon = makeIcon("📍");

// Fits the map so store, customer AND the rider marker are all visible
// together — this is what makes the green route line actually visible,
// instead of only showing whatever tiny area is around the rider.
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [JSON.stringify(points)]);
  return null;
};

/**
 * Live order-tracking map.
 *
 * Props:
 * - backendUrl, orderId
 * - storeLocation: { lat, lng }
 * - customerLocation: { lat, lng }
 * - initialRiderLocation: { lat, lng } | null
 * - initialStatus, initialDistanceKm, initialEtaMinutes
 */
const MapTracker = ({
  backendUrl,
  orderId,
  storeLocation,
  customerLocation,
  initialRiderLocation = null,
  initialStatus = "accepted",
  initialDistanceKm = null,
  initialEtaMinutes = null,
}) => {
  const [riderLocation, setRiderLocation] = useState(initialRiderLocation);
  const [status, setStatus] = useState(initialStatus);
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [etaMinutes, setEtaMinutes] = useState(initialEtaMinutes);
  const [arrivedMessage, setArrivedMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = joinOrderRoom(backendUrl, orderId);
    socketRef.current = socket;

    const onLocationUpdate = (payload) => {
      if (payload.orderId !== orderId) return;
      setRiderLocation(payload.riderLocation);
      setDistanceKm(payload.distanceRemainingKm);
      setEtaMinutes(payload.etaMinutes);
      setStatus(payload.status);
    };

    const onArrived = (payload) => {
      if (payload.orderId !== orderId) return;
      setArrivedMessage(payload.message);
    };

    const onStatusUpdate = (order) => {
      if (order._id !== orderId && order.orderId !== orderId) return;
      if (order.status) setStatus(order.status);
    };

    socket.on("location-update", onLocationUpdate);
    socket.on("arrived-at-customer", onArrived);
    socket.on("order-status-update", onStatusUpdate);
    socket.on("pickup-order", onStatusUpdate);
    socket.on("delivered-order", onStatusUpdate);

    return () => {
      socket.off("location-update", onLocationUpdate);
      socket.off("arrived-at-customer", onArrived);
      socket.off("order-status-update", onStatusUpdate);
      socket.off("pickup-order", onStatusUpdate);
      socket.off("delivered-order", onStatusUpdate);
      leaveOrderRoom(backendUrl, orderId);
    };
  }, [backendUrl, orderId]);

  const center = riderLocation || storeLocation || customerLocation;

  // Rider heads to the store before pickup, then to the customer after —
  // same target logic as before, just now feeding a real road route.
  const target =
    status === "out_for_delivery" || status === "arrived_at_customer"
      ? customerLocation
      : storeLocation;

  // Road-following route, re-fetched from OSRM whenever the rider has
  // moved far enough (or switched target) that the old path is stale —
  // this is what makes the line "recentre" onto whatever road the rider
  // actually took, like Google Maps re-routing, instead of a fixed line.
  const [roadRoute, setRoadRoute] = useState(null);
  const lastRoutedFromRef = useRef(null);
  const lastTargetRef = useRef(null);

  useEffect(() => {
    if (!riderLocation) return;

    const targetChanged = lastTargetRef.current !== target;
    const movedEnough = roughMeters(lastRoutedFromRef.current, riderLocation) > 40; // ~40m before bothering to re-route

    if (!targetChanged && !movedEnough) return;

    lastRoutedFromRef.current = riderLocation;
    lastTargetRef.current = target;

    let cancelled = false;
    fetchRoadRoute(riderLocation, target).then((route) => {
      if (!cancelled) setRoadRoute(route); // null on failure -> straight-line fallback below
    });
    return () => {
      cancelled = true;
    };
  }, [riderLocation?.lat, riderLocation?.lng, target.lat, target.lng]);

  const routePoints = riderLocation
    ? roadRoute && roadRoute.length > 1
      ? roadRoute
      : [riderLocation, target] // fallback straight line if OSRM is unreachable
    : null;

  return (
    <div className="w-full">
      {arrivedMessage && (
        <div className="bg-green-100 text-green-800 text-sm rounded p-2 mb-2 font-medium">
          🛵 {arrivedMessage}
        </div>
      )}

      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Status: {status.replaceAll("_", " ")}</span>
        {distanceKm != null && <span>{distanceKm.toFixed(1)} km · {etaMinutes} min</span>}
      </div>

      <MapContainer center={[center.lat, center.lng]} zoom={15} style={{ height: "320px", width: "100%", borderRadius: "8px" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storeIcon}>
          <Popup>Store</Popup>
        </Marker>

        <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
          <Popup>Delivery address</Popup>
        </Marker>

        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>Rider</Popup>
          </Marker>
        )}

        <FitBounds
          points={[storeLocation, customerLocation, ...(riderLocation ? [riderLocation] : [])]}
        />

        {routePoints && (
          <Polyline
            positions={routePoints.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#16a34a", weight: 4, dashArray: "6 8" }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapTracker;
