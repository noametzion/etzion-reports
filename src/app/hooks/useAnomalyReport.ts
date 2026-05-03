"use client";

import { useMemo } from 'react';
import { AnomalyReport} from '@/app/types/report';
import { EditedSurveyDataRow, EditedDCPDataRow } from '@/app/types/survey';

export const useAnomalyReport = (
  surveyData: EditedSurveyDataRow[],
  dcpData: EditedDCPDataRow[]
): AnomalyReport => {
  return useMemo(() => {
    return {anomalies: []};
  }, [surveyData, dcpData]);
};
