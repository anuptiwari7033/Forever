import axios from "axios";

// Uses OpenStreetMap's free Nominatim geocoder — no API key needed, same
// spirit as the existing Leaflet/OSM map tiles already used elsewhere in
// Forever Minutes. Good for development / low traffic. Nominatim's usage
// policy caps this at ~1 request/second and asks that you don't hammer it
// in production — if this app goes live with real traffic, swap these two
// functions for Google Places Autocomplete / LocationIQ / Mapbox (paid,
// but much higher limits and better result quality) without touching any
// other file, since every caller only goes through here.

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Returns [{ label, sublabel, lat, lng }, ...]
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) return [];
  try {
    const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: { q: query, format: "jsonv2", addressdetails: 1, limit: 6 },
    });
    return data.map((item) => {
      const parts = item.display_name.split(",").map((p) => p.trim());
      return {
        label: parts[0],
        sublabel: parts.slice(1).join(", "),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch (e) {
    console.log(e);
    return [];
  }
};

// Returns a formatted address string for a given lat/lng.
export const reverseGeocode = async (lat, lng) => {
  try {
    const { data } = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: { lat, lon: lng, format: "jsonv2" },
    });
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (e) {
    console.log(e);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};
