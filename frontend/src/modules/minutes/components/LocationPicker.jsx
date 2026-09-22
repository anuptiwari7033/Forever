import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  html: '<div style="font-size:28px;">📍</div>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Lets the customer click anywhere on the map to drop a pin — this is how
// they pick "a location away from me" (e.g. a family member's address)
// without needing any paid geocoding API.
const ClickToPick = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

/**
 * Props:
 * - initialCenter: { lat, lng } — where the map opens centered
 * - onConfirm: (loc: {lat,lng}) => void
 * - onClose: () => void
 */
const LocationPicker = ({ initialCenter, onConfirm, onClose }) => {
  const [picked, setPicked] = useState(initialCenter);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Tap on the map to choose a delivery location
          </h2>
          <button onClick={onClose} className="text-gray-400 text-sm">
            ✕
          </button>
        </div>

        <MapContainer
          center={[picked.lat, picked.lng]}
          zoom={13}
          style={{ height: "320px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[picked.lat, picked.lng]} icon={pinIcon} />
          <ClickToPick onPick={setPicked} />
        </MapContainer>

        <p className="text-xs text-gray-400 mt-2">
          Pin: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onConfirm(picked)}
            className="flex-1 bg-green-600 text-white rounded py-2 text-sm font-medium"
          >
            Use this location
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
