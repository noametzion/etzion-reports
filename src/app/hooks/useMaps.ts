import { useState, useEffect } from 'react';
import { SurveyDataRow } from '@/app/types/survey';
import {MapDataPoint, MapInfo} from "@/app/types/report";

export const useMaps = (surveyData: SurveyDataRow[] | null, splitDistance: number): MapInfo[] => {
  const [maps, setMaps] = useState<MapInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setMaps([]);
      return;
    }

    const mapSegments: { [key: number]: MapDataPoint[] } = {};

    surveyData.forEach((row, index) => {
      const distance = row['Dist From Start'];
      if (distance === undefined) return;

      // check and add the current segment
      const segmentIndex = Math.floor(distance / splitDistance);
      if (!mapSegments[segmentIndex]) {
        mapSegments[segmentIndex] = [];
      }

      // add "break" for empty distances
      let prevDistance = index > 0 ? surveyData[index - 1]['Dist From Start'] : undefined;
      while (prevDistance !== undefined &&  prevDistance + 1 !== distance) {
        prevDistance++;
        mapSegments[segmentIndex].push({
          distance: prevDistance,
          location: "break",
        });
      }

      mapSegments[segmentIndex].push({
        distance: distance,
        location: {
          latitude: row['Latitude'],
          longitude: row['Longitude'],
          altitude: row['Altitude'],
        }
      });
    });

    // add titles
    const newMaps: MapInfo[] = Object.keys(mapSegments).map(key => {
      const segmentIndex = parseInt(key, 10);
      const startDist = segmentIndex * splitDistance;
      const endDist = startDist + splitDistance;

      return {
        title: `Map: ${startDist}m - ${endDist}m`,
        data: mapSegments[segmentIndex],
      };
    });

    setMaps(newMaps);

  }, [surveyData, splitDistance]);

  return maps;
};
