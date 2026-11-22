"use client";

import { useState, useCallback } from 'react';
import { Project } from '@/app/types/project';
import {
  DCPDataAnomalyKey, DCPDataStationKey, isDcpMeasurementPoint,
  SurveyCommentKey, SurveyAnomalyKey, SurveyStationKey, normalizeMeasurementPointName,
} from '@/app/types/survey';
import { loadProjectFileData } from '@/app/utils/projectFileLoader';

// Matches tp / lp / tb anywhere in a string, capturing text until the next comma
const TP_ANYWHERE = /(tp|lp|tb)([^,]*)/i;

function extractComment(surveyText: string, dcpAnomalyText: string): string {
  if (surveyText) {
    const match = surveyText.match(TP_ANYWHERE);
    if (match) return normalizeMeasurementPointName(match[0].trim()) || match[0].trim();
    return surveyText;
  }
  const colonIdx = dcpAnomalyText.indexOf(':');
  return colonIdx >= 0 ? dcpAnomalyText.slice(0, colonIdx).trim() : dcpAnomalyText.trim();
}

export interface MeasurementPoint {
  stationNo: number;
  anomalyText: string;
  comment: string;
  isSelected: boolean;
  isSuggested: boolean;
}

export interface MeasurementPointsFileReport {
  fileName: string;
  measurementPointCount: number;
  points: MeasurementPoint[];
}

interface MeasurementPointsReport {
  totalMeasurementPoints: number;
  fileCount: number;
  filesProcessed: number;
  isCalculating: boolean;
  error: string | null;
  fileReport: MeasurementPointsFileReport[];
}

export const useMeasurementPointsReport = () => {
  const [report, setReport] = useState<MeasurementPointsReport | null>(null);

  const calculateMeasurementPointsReport = useCallback(async (project: Project) => {
    setReport({
      totalMeasurementPoints: 0,
      fileCount: project.projectFiles.length,
      filesProcessed: 0,
      isCalculating: true,
      error: null,
      fileReport: [],
    });

    let totalMeasurementPoints = 0;
    const fileReport: MeasurementPointsFileReport[] = [];

    for (let i = 0; i < project.projectFiles.length; i++) {
      const file = project.projectFiles[i];

      try {
        const { dcpData, surveyData } = await loadProjectFileData(file);

        const surveyCommentByStation = new Map<number, string>();
        for (const row of surveyData) {
          const station = Number(row[SurveyStationKey]);
          if (!surveyCommentByStation.has(station)) {
            const raw = (row[SurveyCommentKey]?.toString() ?? '').trim()
              || (row[SurveyAnomalyKey]?.toString() ?? '').trim();
            if (raw) surveyCommentByStation.set(station, raw);
          }
        }

        const selectedByStation = new Map<number, number>();
        const dcpStations = new Set<number>();
        const dcpPoints: MeasurementPoint[] = dcpData.map((row, idx) => {
          const anomalyText = row[DCPDataAnomalyKey]?.toString() ?? '';
          const stationNo = Number(row[DCPDataStationKey]);
          dcpStations.add(stationNo);
          const surveyText = surveyCommentByStation.get(stationNo) ?? '';
          const comment = extractComment(surveyText, anomalyText);
          let isSelected = false;
          if (isDcpMeasurementPoint(anomalyText) && !selectedByStation.has(stationNo)) {
            isSelected = true;
            selectedByStation.set(stationNo, idx);
          }
          return { stationNo, anomalyText, comment, isSelected, isSuggested: false };
        });

        const suggestedStations = new Set<number>();
        const suggestedPoints: MeasurementPoint[] = [];
        for (const [station, raw] of surveyCommentByStation) {
          if (dcpStations.has(station) || suggestedStations.has(station)) continue;
          if (!TP_ANYWHERE.test(raw)) continue;
          suggestedStations.add(station);
          suggestedPoints.push({
            stationNo: station,
            anomalyText: '',
            comment: extractComment(raw, ''),
            isSelected: false,
            isSuggested: true,
          });
        }

        const points = [...dcpPoints, ...suggestedPoints].sort((a, b) => a.stationNo - b.stationNo);

        const measurementPointCount = points.filter(p => p.isSelected).length;
        totalMeasurementPoints += measurementPointCount;
        fileReport.push({ fileName: file.name, measurementPointCount, points });

        setReport((prev) => prev ? {
          ...prev,
          totalMeasurementPoints,
          filesProcessed: i + 1,
          fileReport: [...fileReport],
        } : null);
      } catch (err) {
        setReport((prev) => prev ? {
          ...prev,
          error: `Failed to process ${file.name}: ${(err as Error).message}`,
          isCalculating: false,
        } : null);
        return;
      }
    }

    setReport({
      totalMeasurementPoints,
      fileCount: project.projectFiles.length,
      filesProcessed: project.projectFiles.length,
      isCalculating: false,
      error: null,
      fileReport,
    });
  }, []);

  const toggleMeasurementPoint = useCallback((fileName: string, pointIndex: number) => {
    setReport(prev => {
      if (!prev) return prev;
      const fileIdx = prev.fileReport.findIndex(f => f.fileName === fileName);
      if (fileIdx === -1) return prev;

      const file = prev.fileReport[fileIdx];
      const clicked = file.points[pointIndex];
      if (!clicked) return prev;

      const selecting = !clicked.isSelected;
      const newPoints = file.points.map((point, i) => {
        if (i === pointIndex) return { ...point, isSelected: selecting };
        if (selecting && point.stationNo === clicked.stationNo && point.isSelected) return { ...point, isSelected: false };
        return point;
      });

      const newFileReport = [...prev.fileReport];
      newFileReport[fileIdx] = {
        ...file,
        points: newPoints,
        measurementPointCount: newPoints.filter(p => p.isSelected).length,
      };

      return {
        ...prev,
        totalMeasurementPoints: newFileReport.reduce((sum, f) => sum + f.measurementPointCount, 0),
        fileReport: newFileReport,
      };
    });
  }, []);

  return { report, calculateMeasurementPointsReport, toggleMeasurementPoint };
};
