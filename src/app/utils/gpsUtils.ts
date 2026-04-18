// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const splitSurveyDataByBreaks = <T extends { Latitude?: number; Longitude?: number; [key: string]: any }>(
  surveyData: T[],
  distanceKey: string,
  distanceDiff: number
): T[][] => {
  const pathSegments: T[][] = [];
  let currentPathSegment: T[] = [];

  surveyData.forEach((row, index) => {
    const currentDistance = Number(row[distanceKey]);
    const previousDistance = index > 0 ? Number(surveyData[index - 1][distanceKey]) : undefined;

    if (
      index > 0 &&
      previousDistance !== undefined &&
      distanceDiff > 0 &&
      (previousDistance + distanceDiff) < currentDistance
    ) {
      if (currentPathSegment.length > 0) {
        pathSegments.push(currentPathSegment);
        currentPathSegment = [];
      }
    }

    if (row.Latitude !== undefined && row.Longitude !== undefined) {
      currentPathSegment.push(row);
    }
  });

  if (currentPathSegment.length > 0) {
    pathSegments.push(currentPathSegment);
  }

  return pathSegments;
};

export const calculatePathLengthKm = async <T extends { Latitude?: number; Longitude?: number }>(
  pathSegments: T[][],
  distThresholdMeters: number = 35
): Promise<number> => {
  // Dynamic import to avoid SSR issues with window object
  const L = (await import('leaflet')).default;

  let total = 0;

  for (let s = 0; s < pathSegments.length; s++) {
    for (let i = 1; i < pathSegments[s].length; i++) {
      const prevPoint = pathSegments[s][i - 1];
      const currentPoint = pathSegments[s][i];

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
