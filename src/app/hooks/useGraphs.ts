import { useState, useEffect } from 'react';
import {SurveyDataRow, SurveyDistanceKey} from '@/app/types/survey';
import {GraphInfo, GraphDataPoint} from "@/app/types/report";
import {createSegments} from "@/app/utils/reportUtils";

const CONSTANT_VOLTAGE = -850;
const voltToMillyVolt= (V: number| undefined) => V!==undefined ? V * 1000 : V;

export const useGraphs = (surveyData: SurveyDataRow[] | null, splitDistance: number): GraphInfo[] => {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setGraphs([]);
      return;
    }

    // init segments with default values
    const lastDistance = Number(surveyData[surveyData.length - 1][SurveyDistanceKey]);
    const graphSegments: { [key: number]: GraphDataPoint[] } = createSegments(lastDistance, splitDistance) as { [key: number]: GraphDataPoint[] };

    surveyData.forEach((row, index) => {
      const distance = row[SurveyDistanceKey];
      if (distance === undefined) return;

      const segmentIndex = Math.floor(Number(distance) / splitDistance);

      // modify empty distances
      let prevDistance = index > 0 ? Number(surveyData[index - 1][SurveyDistanceKey]) : undefined;
      while (prevDistance !== undefined && (prevDistance + 1) < Number(distance)) {
        prevDistance++;
        const prevDistanceIndexInSegment = prevDistance % splitDistance;
        graphSegments[segmentIndex][prevDistanceIndexInSegment] = {
          ...graphSegments[segmentIndex][prevDistanceIndexInSegment],
          onVoltage: undefined,
          offVoltage: undefined,
          constantVoltage: CONSTANT_VOLTAGE,
          dcvg: undefined
        };
      }

      const distanceIndexInSegment = Number(distance) % splitDistance;

      graphSegments[segmentIndex][distanceIndexInSegment] = {
        ...graphSegments[segmentIndex][distanceIndexInSegment],
        onVoltage: voltToMillyVolt(row['On Voltage']),
        offVoltage: voltToMillyVolt(row['Off Voltage']),
        constantVoltage: CONSTANT_VOLTAGE,
        dcvg: voltToMillyVolt(row['DCVG Voltage']),
        comment: row['Comment'] || row['DCP/Feature/DCVG Anomaly'],
      };
    });

    // eslint-disable-next-line
    setGraphs(Object.entries(graphSegments).map(([_, segment]) => {
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

  return graphs;
};