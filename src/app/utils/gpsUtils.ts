import L from 'leaflet';

export const calculatePathLengthKm = <T extends { Latitude?: number; Longitude?: number }>(
  segments: T[][],
  distThresholdMeters: number = 35
): number => {
  let total = 0;

  for (let s = 0; s < segments.length; s++) {
    for (let i = 1; i < segments[s].length; i++) {
      const prevPoint = segments[s][i - 1];
      const currentPoint = segments[s][i];

      const lat1 = prevPoint.Latitude;
      const lon1 = prevPoint.Longitude;
      const lat2 = currentPoint.Latitude;
      const lon2 = currentPoint.Longitude;

      if (lat1 !== undefined && lon1 !== undefined && lat2 !== undefined && lon2 !== undefined) {
        const dist = L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2)); // meters

        if (dist < distThresholdMeters) {
          total += dist;
        }
      }
    }
  }

  return total / 1000; // km
};
