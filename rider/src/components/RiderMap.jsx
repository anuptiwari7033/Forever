import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import { joinOrderRoom, leaveOrderRoom, emitLocationUpdate } from "../services/socket";
import { fetchRoadRoute, roughMeters } from "../utils/osrm";

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

// Fits the map so store, customer AND the rider are all visible together —
// this is what actually makes the green route line visible on screen.
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
 * Live navigation map for the rider app.
 * Streams navigator.geolocation.watchPosition() ticks to the backend via
 * Socket.IO (`location-update`), and renders store + customer + self markers
 * with a route line to whichever is the current target (store before
 * pickup, customer after).
 */
const RiderMap = ({ backendUrl, order }) => {
  const [selfLocation, setSelfLocation] = useState(null);
  const watchIdRef = useRef(null);

  const target =
    order.status === "out_for_delivery" || order.status === "arrived_at_customer"
      ? order.address.location
      : order.storeLocation;

  useEffect(() => {
    joinOrderRoom(backendUrl, order._id);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setSelfLocation(loc);
          emitLocationUpdate(backendUrl, order._id, order.riderId, loc.lat, loc.lng);
        },
        (err) => {
          console.log(err);
          toast.error("Location tracking failed: " + err.message + " — keep this tab open and allow location access.");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      leaveOrderRoom(backendUrl, order._id);
    };
  }, [order._id]);

  const center = selfLocation || order.storeLocation;

  // Same road-routing behaviour as the customer's MapTracker — re-fetch
  // from OSRM whenever the rider has moved enough (or the target flips
  // from store to customer after pickup) so the line follows whatever
  // road the rider is actually on, recentering itself if they take a
  // different route than originally suggested.
  const [roadRoute, setRoadRoute] = useState(null);
  const lastRoutedFromRef = useRef(null);
  const lastTargetRef = useRef(null);

  useEffect(() => {
    if (!selfLocation) return;
    const targetChanged = lastTargetRef.current !== target;
    const movedEnough = roughMeters(lastRoutedFromRef.current, selfLocation) > 40;
    if (!targetChanged && !movedEnough) return;

    lastRoutedFromRef.current = selfLocation;
    lastTargetRef.current = target;

    let cancelled = false;
    fetchRoadRoute(selfLocation, target).then((route) => {
      if (!cancelled) setRoadRoute(route);
    });
    return () => {
      cancelled = true;
    };
  }, [selfLocation?.lat, selfLocation?.lng, target.lat, target.lng]);

  const routePositions = (
    roadRoute && roadRoute.length > 1 ? roadRoute : selfLocation ? [selfLocation, target] : []
  ).map((p) => [p.lat, p.lng]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ height: "320px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[order.storeLocation.lat, order.storeLocation.lng]} icon={storeIcon}>
        <Popup>Store — pickup here</Popup>
      </Marker>

      <Marker position={[order.address.location.lat, order.address.location.lng]} icon={customerIcon}>
        <Popup>Customer — deliver here</Popup>
      </Marker>

      {selfLocation && (
        <>
          <Marker position={[selfLocation.lat, selfLocation.lng]} icon={riderIcon}>
            <Popup>You</Popup>
          </Marker>
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: "#16a34a", weight: 4, dashArray: "6 8" }}
            />
          )}
        </>
      )}

      <FitBounds
        points={[
          order.storeLocation,
          order.address.location,
          ...(selfLocation ? [selfLocation] : []),
        ]}
      />
    </MapContainer>
  );
};

export default RiderMap;
