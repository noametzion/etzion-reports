"use client";

import { useMemo } from 'react';
import { AnomalyReport } from '@/app/types/report';
import { EditedSurveyDataRow, EditedDCPDataRow } from '@/app/types/survey';
import {
  groupDcpByStation,
  groupSurveyByStation,
  findAnomalyStations,
  findAdditionalSuggestedAnomalies,
  buildTpMap,
  toStrengthPoint,
  buildAnomalies,
  buildStrengthPointsCandidates,
  type DCVGCandidate,
  type StrengthPointCandidate,
  type SuggestedAnomaly,
} from './anomalyReportCreator';

export type { DCVGCandidate, StrengthPointCandidate, SuggestedAnomaly };

export interface UseAnomalyReportCreatorResult {
  report: AnomalyReport;
  dcvgCandidates: Map<number, DCVGCandidate[]>;
  /** All selectable strength point candidates: TPs + first/last station (only if not already a TP), sorted by station */
  strengthPointsCandidates: StrengthPointCandidate[];
  /** Stations found in surveyData with DCVG markers that are NOT already in the main anomaly list */
  suggestedAnomalies: SuggestedAnomaly[];
}

export const useAnomalyReportCreator = (
  surveyData: EditedSurveyDataRow[],
  dcpData: EditedDCPDataRow[],
  stationDiff: number,
  userAddedAnomalyStations?: Set<number>
): UseAnomalyReportCreatorResult => {
  return useMemo(() => {
    const dcpByStation = groupDcpByStation(dcpData);
    const { surveyByStation, surveyIndexByStation } = groupSurveyByStation(surveyData);
    const dcpDataAnomalyStations = findAnomalyStations(dcpData, surveyData);

    // Merge user-added stations so they're built as full anomalies
    const allAnomalyStations = new Map(dcpDataAnomalyStations);
    for (const station of userAddedAnomalyStations ?? []) {
      if (!allAnomalyStations.has(station)) {
        allAnomalyStations.set(station, { marker: 'user added' });
      }
    }

    const suggestedAnomalies = findAdditionalSuggestedAnomalies(surveyData, allAnomalyStations);
    const tpMap = buildTpMap(dcpData, surveyData, surveyByStation, surveyIndexByStation);

    const strengthPoints = [...tpMap.values()]
      .sort((a, b) => a.tpNumber - b.tpNumber)
      .map(toStrengthPoint);
    const tpsByStation = [...tpMap.values()].sort((a, b) => a.station - b.station);
    const allStations = [...surveyByStation.keys()].sort((a, b) => a - b);

    const { anomalies, dcvgCandidates } = buildAnomalies(
      allAnomalyStations, dcpByStation, surveyByStation, tpsByStation, stationDiff
    );
    const strengthPointsCandidates = buildStrengthPointsCandidates(strengthPoints, allStations, surveyByStation);

    return { report: { anomalies }, dcvgCandidates, strengthPointsCandidates, suggestedAnomalies };
  }, [surveyData, dcpData, stationDiff, userAddedAnomalyStations]);
};
