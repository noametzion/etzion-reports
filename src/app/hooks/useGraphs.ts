import { useState, useEffect } from 'react';
import { SurveyDataRow } from '@/app/types/survey';
import {GraphInfo, GraphDataPoint} from "@/app/types/report";

const CONSTANT_VOLTAGE = -850;
const voltToMillyVolt= (V: number| undefined) => V!==undefined ? V * 1000 : V;

export const useGraphs = (surveyData: SurveyDataRow[] | null, splitDistance: number): GraphInfo[] => {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0) {
      setGraphs([]);
      return;
    }

    const graphSegments: { [key: number]: GraphDataPoint[] } = {};

    surveyData.forEach(row => {
      const distance = row['Dist From Start'];
      if (distance === undefined) return;

      const segmentIndex = Math.floor(distance / splitDistance);

      if (!graphSegments[segmentIndex]) {
        graphSegments[segmentIndex] = [];
      }

      graphSegments[segmentIndex].push({
        distance: distance,
        onVoltage: voltToMillyVolt(row['On Voltage']),
        offVoltage: voltToMillyVolt(row['Off Voltage']),
        constantVoltage: CONSTANT_VOLTAGE,
        dcvg: voltToMillyVolt(row['DCVG Voltage']),
      });
    });

    const newGraphs: GraphInfo[] = Object.keys(graphSegments).map(key => {
      const segmentIndex = parseInt(key, 10);
      const startDist = segmentIndex * splitDistance;
      const endDist = startDist + splitDistance;

      return {
        title: `Graph: ${startDist}m - ${endDist}m`,
        data: graphSegments[segmentIndex],
      };
    });

    setGraphs(newGraphs);

  }, [surveyData, splitDistance]);

  return graphs;
};
