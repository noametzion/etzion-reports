"use client";

import { useMemo } from 'react';
import { AnomalyReport } from '@/app/types/report';
import { EditedSurveyDataRow, EditedDCPDataRow } from '@/app/types/survey';
import {
  groupDcpByStation,
  groupSurveyByStation,
  findAnomalyStations,
  buildTpMap,
  toStrengthPoint,
  buildAnomalies,
  buildStrengthPointsCandidates,
  type DCVGCandidate,
  type StrengthPointCandidate,
} from './anomalyReport';

export type { DCVGCandidate, StrengthPointCandidate };

export interface UseAnomalyReportResult {
  report: AnomalyReport;
  dcvgCandidates: Map<number, DCVGCandidate[]>;
  /** All selectable strength point candidates: TPs + first/last station (only if not already a TP), sorted by station */
  strengthPointsCandidates: StrengthPointCandidate[];
}

export const useAnomalyReport = (
  surveyData: EditedSurveyDataRow[],
  dcpData: EditedDCPDataRow[],
  stationDiff: number
): UseAnomalyReportResult => {
  return useMemo(() => {
    const dcpByStation = groupDcpByStation(dcpData);
    const { surveyByStation, surveyIndexByStation } = groupSurveyByStation(surveyData);
    const anomalyStations = findAnomalyStations(dcpData, surveyData);
    const tpMap = buildTpMap(dcpData, surveyData, surveyByStation, surveyIndexByStation);

    const strengthPoints = [...tpMap.values()]
      .sort((a, b) => a.tpNumber - b.tpNumber)
      .map(toStrengthPoint);
    const tpsByStation = [...tpMap.values()].sort((a, b) => a.station - b.station);
    const allStations = [...surveyByStation.keys()].sort((a, b) => a - b);

    const { anomalies, dcvgCandidates } = buildAnomalies(
      anomalyStations, dcpByStation, surveyByStation, tpsByStation, stationDiff
    );
    const strengthPointsCandidates = buildStrengthPointsCandidates(strengthPoints, allStations, surveyByStation);

    return { report: { anomalies }, dcvgCandidates, strengthPointsCandidates };
  }, [surveyData, dcpData, stationDiff]);
};
