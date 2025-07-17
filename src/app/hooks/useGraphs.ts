import { useState, useEffect } from 'react';
import { SurveyDataRow } from '@/app/types/survey';
import {GraphInfo, GraphDataPoint} from "@/app/types/report";

const CONSTANT_VOLTAGE = -850;
const voltToMillyVolt= (V: number| undefined) => V!==undefined ? V * 1000 : V;

export const useGraphs = (surveyData: SurveyDataRow[] | null, splitDistance: number): GraphInfo[] => {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0 || splitDistance < 100) {
      setGraphs([]);
      return;
    }

    const graphSegments: { [key: number]: GraphDataPoint[] } = {};

    surveyData.forEach((row, index) => {
      const distance = row['Dist From Start'];
      if (distance === undefined) return;

      // check and add the current segment
      const segmentIndex = Math.floor(distance / splitDistance);
      if (!graphSegments[segmentIndex]) {
        graphSegments[segmentIndex] = [];
      }

      // add empty distances
      let prevDistance = index > 0 ? surveyData[index - 1]['Dist From Start'] : undefined;
      while (prevDistance !== undefined &&  prevDistance + 1 !== distance) {
        prevDistance++;
        graphSegments[segmentIndex].push({
          distance: prevDistance,
          onVoltage: undefined,
          offVoltage: undefined,
          constantVoltage: CONSTANT_VOLTAGE,
          dcvg: undefined
        });
      }

      graphSegments[segmentIndex].push({
        distance: distance,
        onVoltage: voltToMillyVolt(row['On Voltage']),
        offVoltage: voltToMillyVolt(row['Off Voltage']),
        constantVoltage: CONSTANT_VOLTAGE,
        dcvg: voltToMillyVolt(row['DCVG Voltage']),
      });
    });

    // add titles and empty distances at the end of the last segment
    const newGraphs: GraphInfo[] = Object.keys(graphSegments).map(key => {
      const segmentIndex = parseInt(key, 10);
      const startDist = segmentIndex * splitDistance;
      const endDist = startDist + splitDistance;

      const newData: GraphDataPoint[] = Array.from({length: endDist-startDist+1}, (_, i) => {
        const distance = startDist + i;
        const graphInfo = graphSegments[segmentIndex][i] || { distance: distance };
        if(distance === 40) console.log(graphInfo);
        return graphInfo;
      })

      return {
        title: `Graph: ${startDist}m - ${endDist}m`,
        data: newData,
      };
    });

    setGraphs(newGraphs);

  }, [surveyData, splitDistance]);

  return graphs;
};
