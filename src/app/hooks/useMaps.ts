import { useState, useEffect } from 'react';
import {SurveyDataRow, SurveyDistanceKey} from '@/app/types/survey';
import {MapDataPoint, MapInfo} from "@/app/types/report";
import {createSegments} from "@/app/utils/reportUtils";

export const useMaps = (surveyData: SurveyDataRow[] | null, splitDistance: number): MapInfo[] => {
  const [maps, setMaps] = useState<MapInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setMaps([]);
      return;
    }

    // init segments with default values
    const lastDistance = Number(surveyData[surveyData.length - 1][SurveyDistanceKey]);
    const mapSegments: { [key: number]: MapDataPoint[] } = createSegments(lastDistance, splitDistance) as { [key: number]: MapDataPoint[] };

    surveyData.forEach((row, index) => {
      const distance = row[SurveyDistanceKey];
      if (distance === undefined) return;

      const segmentIndex = Math.floor(Number(distance) / splitDistance);

      // modify to "break" for empty distances
      let prevDistance = index > 0 ? Number(surveyData[index - 1][SurveyDistanceKey]) : undefined;
      while (prevDistance !== undefined && (prevDistance + 1) < Number(distance)) {
        prevDistance++;
        const prevDistanceIndexInSegment = prevDistance % splitDistance;
        mapSegments[segmentIndex][prevDistanceIndexInSegment] = {
          ...mapSegments[segmentIndex][prevDistanceIndexInSegment],
          location: "break"
        };
      }

      const distanceIndexInSegment = Number(distance) % splitDistance;

      mapSegments[segmentIndex][distanceIndexInSegment] = {
        ...mapSegments[segmentIndex][distanceIndexInSegment],
        location: {
          latitude: row['Latitude'],
          longitude: row['Longitude'],
          altitude: row['Altitude'],
        }
      };
    });

    setMaps(Object.entries(mapSegments).map(([_, segment]) => {
      const startDist = segment[0].distance
      const endDist = segment[segment.length - 1].distance

      return {
        title: `Graph: ${startDist}m - ${endDist}m`,
        data: segment,
        startDistance: startDist,
        endDistance: endDist
      };
    }));

  }, [surveyData, splitDistance]);

  return maps;
};
