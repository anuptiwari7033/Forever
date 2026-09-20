// Small, dependency-free geo helper used across the Forever Minutes module
// (nearest-rider search, distance-remaining, ETA calculation).

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

// Haversine distance in kilometers between two [lat, lng] style points.
export const getDistanceKm = (pointA, pointB) => {
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) *
      Math.cos(toRad(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

// Very simple ETA model: assumes an average city-riding speed.
// Good enough for a "quick-commerce" style estimate without a routing engine.
export const getEtaMinutes = (distanceKm, averageSpeedKmph = 22) => {
  if (distanceKm <= 0) return 0;
  return Math.ceil((distanceKm / averageSpeedKmph) * 60);
};

// Given a target location and a list of online riders
// (each { riderId, location: { lat, lng } }), returns the nearest rider.
export const findNearestRider = (targetLocation, onlineRiders = []) => {
  if (!onlineRiders.length) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const rider of onlineRiders) {
    if (!rider.location) continue;
    const distance = getDistanceKm(targetLocation, rider.location);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = rider;
    }
  }

  return nearest ? { ...nearest, distanceKm: nearestDistance } : null;
};

// Arrival detection: true once the rider is within `thresholdMeters` of the target.
export const hasArrived = (riderLocation, targetLocation, thresholdMeters = 50) => {
  const distanceKm = getDistanceKm(riderLocation, targetLocation);
  return distanceKm * 1000 <= thresholdMeters;
};
