/**
 * Haversine formula to calculate the great-circle distance
 * between two points on Earth given their lat/lng in decimal degrees.
 * Returns distance in meters.
 */

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinOfficeRadius(lat: number, lng: number): {
  within: boolean;
  distance: number;
} {
  const officeLat = parseFloat(process.env.OFFICE_LATITUDE || "0");
  const officeLng = parseFloat(process.env.OFFICE_LONGITUDE || "0");
  const radius = parseFloat(process.env.OFFICE_RADIUS_METERS || "100");

  const distance = haversineDistance(lat, lng, officeLat, officeLng);
  return {
    within: distance <= radius,
    distance: Math.round(distance),
  };
}
