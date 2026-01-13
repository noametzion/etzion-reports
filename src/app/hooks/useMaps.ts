"use client";

import { useState, useEffect } from 'react';
import {SurveyDataRow, SurveyDistanceKey} from '@/app/types/survey';
import {MapDataPoint, MapInfo} from "@/app/types/report";
import {createSegments, getDistanceIndexInSegment, getSegmentIndex} from "@/app/utils/reportUtils";

export const useMaps = (surveyData: SurveyDataRow[] | null, splitDistance: number): MapInfo[] => {
  const [maps, setMaps] = useState<MapInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setMaps([]);
      return;
    }

    // init segments with default values
    const lastDistance = Number(surveyData[surveyData.length - 1][SurveyDistanceKey]);
    // TODO: check if all distances have the same difference
    const distanceDiff = Number(surveyData[1][SurveyDistanceKey]) - Number(surveyData[0][SurveyDistanceKey]);
    const mapSegments: { [key: number]: MapDataPoint[] } = createSegments(lastDistance, distanceDiff, splitDistance) as { [key: number]: MapDataPoint[] };

    surveyData.forEach((row, index) => {
      const distance = row[SurveyDistanceKey];
      if (distance === undefined) return;

      const segmentIndex = getSegmentIndex(Number(distance), splitDistance);

      // modify to "break" for empty distances
      let prevDistance = index > 0 ? Number(surveyData[index - 1][SurveyDistanceKey]) : undefined;
      while (prevDistance !== undefined && (prevDistance + distanceDiff) < Number(distance)) {
        prevDistance+=distanceDiff;
        const prevDistanceIndexInSegment = getDistanceIndexInSegment(prevDistance, distanceDiff, splitDistance);
        mapSegments[segmentIndex][prevDistanceIndexInSegment] = {
          ...mapSegments[segmentIndex][prevDistanceIndexInSegment],
          location: "break"
        };
      }

      const distanceIndexInSegment = getDistanceIndexInSegment(Number(distance), distanceDiff, splitDistance);

      mapSegments[segmentIndex][distanceIndexInSegment] = {
        ...mapSegments[segmentIndex][distanceIndexInSegment],
        location: {
          latitude: row['Latitude'],
          longitude: row['Longitude'],
          altitude: row['Altitude'],
        }
      };
    });

    setMaps(Object.entries(mapSegments).map(([segmentIndex, segment]) => {
      const startDist = Number(segmentIndex) * splitDistance;
      const endDist = (Number(segmentIndex) + 1) * splitDistance - 0.1;

      return {
        title: `Map: distance (stations) ${startDist}-${endDist}`,
        data: segment,
        startDistance: startDist,
        endDistance: endDist,
        distanceDiff: distanceDiff
      };
    }));

  }, [surveyData, splitDistance]);

  return maps;
};
