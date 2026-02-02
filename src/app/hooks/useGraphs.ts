"use client";

import { useState, useEffect } from 'react';
import {SurveyDataRow, SurveyDistanceKey} from '@/app/types/survey';
import {GraphInfo, GraphDataPoint} from "@/app/types/report";
import {createSegments, getDistanceIndexInSegment, getSegmentIndex} from "@/app/utils/reportUtils";

const CONSTANT_VOLTAGE = -850;
const voltToMillyVolt= (V: number| undefined) => V!==undefined ? V * 1000 : V;

export const useGraphs = (surveyData: SurveyDataRow[] | null, splitDistance: number, titles: {primary: string, secondary: string}): GraphInfo[] => {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setGraphs([]);
      return;
    }

    // init segments with default values
    const lastDistance = Number(surveyData[surveyData.length - 1][SurveyDistanceKey]);
    // TODO: check if all distances have the same difference
    const distanceDiff = Number(surveyData[1][SurveyDistanceKey]) - Number(surveyData[0][SurveyDistanceKey]);
    const graphSegments: { [key: number]: GraphDataPoint[] } = createSegments(lastDistance, distanceDiff, splitDistance) as { [key: number]: GraphDataPoint[] };

    surveyData.forEach((row, index) => {
      const distance = row[SurveyDistanceKey];
      if (distance === undefined) return;

      const segmentIndex = getSegmentIndex(Number(distance), splitDistance);

      // modify empty distances
      let prevDistance = index > 0 ? Number(surveyData[index - 1][SurveyDistanceKey]) : undefined;
      while (prevDistance !== undefined && (prevDistance + distanceDiff) < Number(distance)) {
        prevDistance+=distanceDiff;
        const prevDistanceIndex = getSegmentIndex(Number(prevDistance), splitDistance);
        const prevDistanceIndexInSegment = getDistanceIndexInSegment(prevDistance, distanceDiff, splitDistance);
        graphSegments[prevDistanceIndex][prevDistanceIndexInSegment] = {
          ...graphSegments[prevDistanceIndex][prevDistanceIndexInSegment],
          onVoltage: undefined,
          offVoltage: undefined,
          constantVoltage: CONSTANT_VOLTAGE,
          dcvg: undefined
        };
      }

      const distanceIndexInSegment = getDistanceIndexInSegment(Number(distance), distanceDiff, splitDistance);

      console.log("GGGG", graphSegments);

      graphSegments[segmentIndex][distanceIndexInSegment] = {
        ...graphSegments[segmentIndex][distanceIndexInSegment],
        onVoltage: voltToMillyVolt(row['On Voltage']),
        offVoltage: voltToMillyVolt(row['Off Voltage']),
        constantVoltage: CONSTANT_VOLTAGE,
        dcvg: voltToMillyVolt(row['DCVG Voltage']),
        comment: row['Comment'] || row['DCP/Feature/DCVG Anomaly'],
      };
    });

    setGraphs(Object.entries(graphSegments).map(([segmentIndex, segment]) => {
      const startDist = Number(segmentIndex) * splitDistance;
      const endDist = (Number(segmentIndex) + 1) * splitDistance - 0.1;

      return {
        title: titles.primary && titles.primary !== '' ? titles.primary : `Graph`,
        subtitle: `${titles.secondary}${titles.secondary && titles.secondary !== '' ? ', ' : ''}distance (meters) ${startDist}-${endDist}`,
        data: segment,
        startDistance: startDist,
        endDistance: endDist,
        distanceDiff: distanceDiff,
      };
    }));

  }, [surveyData, splitDistance, titles]);

  return graphs;
};