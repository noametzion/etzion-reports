import { useState, useEffect } from 'react';
import { SurveyDataRow } from '@/app/types/survey';
import {GraphInfo} from "@/app/types/report";

export const useGraphs = (surveyData: SurveyDataRow[] | null, splitDistance: number): GraphInfo[] => {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    if (!surveyData || surveyData.length === 0) {
      setGraphs([]);
      return;
    }

    // Placeholder for future logic to split data into graphs
    const newGraphs: GraphInfo[] = [
      {}, // Returning a single, empty graph object for now
    ];
    setGraphs(newGraphs);

  }, [surveyData, splitDistance]);

  return graphs;
};
