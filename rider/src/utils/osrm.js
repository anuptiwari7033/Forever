import axios from "axios";

// Uses OSRM's free public demo routing server — no API key needed, same
// spirit as the free Nominatim/OSM tiles already used elsewhere. It's a
// shared demo instance (rate-limited, "best effort" uptime), which is
// fine for development. For production traffic, self-host OSRM or switch
// to a paid routing API (Google Directions, Mapbox Directions, etc.) —
// every caller goes through fetchRoadRoute() so that's a one-file swap.
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// Returns an array of { lat, lng } following actual roads between two
// points, or null if the routing request fails for any reason (caller
// should fall back to a straight line in that case).
export const fetchRoadRoute = async (from, to) => {
  if (!from || !to) return null;
  try {
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}`;
    const { data } = await axios.get(url, {
      params: { overview: "full", geometries: "geojson" },
    });
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!coords || !coords.length) return null;
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch (e) {
    console.log("OSRM route fetch failed, falling back to straight line:", e.message);
    return null;
  }
};

// Rough distance in meters — used to decide "did the rider move enough to
// be worth re-fetching a fresh route", so we don't hammer the routing
// server on every single GPS tick.
export const roughMeters = (a, b) => {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
