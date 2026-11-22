"use client";

import { useState, useCallback } from 'react';
import { Project } from '@/app/types/project';
import {
  DCPDataAnomalyKey, DCPDataStationKey, isDcpTestPoint,
  SurveyCommentKey, SurveyAnomalyKey, SurveyStationKey, SurveyOnVoltageKey, SurveyOffVoltageKey,
  normalizeTestPointName,
} from '@/app/types/survey';
import { ReportInformation } from '@/app/types/reportInformation';
import { loadProjectFileData } from '@/app/utils/projectFileLoader';
import { getSurveyDisplayName } from '@/app/utils/surveyNameUtils';
import { fileColor } from '@/app/utils/excelStyleUtils';
import { FinalReportTestPoint, TestPointsFinalReportData } from '@/app/types/testPointsReport';

// Matches tp / lp / tb anywhere in a string, capturing text until the next comma
const TP_ANYWHERE = /(tp|lp|tb)([^,]*)/i;

function extractComment(surveyText: string, dcpAnomalyText: string): string {
  if (surveyText) {
    const match = surveyText.match(TP_ANYWHERE);
    if (match) return normalizeTestPointName(match[0].trim()) || match[0].trim();
    return surveyText;
  }
  const colonIdx = dcpAnomalyText.indexOf(':');
  return colonIdx >= 0 ? dcpAnomalyText.slice(0, colonIdx).trim() : dcpAnomalyText.trim();
}

export interface TestPoint {
  stationNo: number;
  anomalyText: string;
  comment: string;
  editedName?: string;
  isSelected: boolean;
  isSuggested: boolean;
  vOn?: number;
  vOff?: number;
}

export interface TestPointsFileReport {
  fileName: string;
  testPointCount: number;
  points: TestPoint[];
  selectedPoints: TestPoint[];
}

export interface TestPointsReport {
  totalTestPoints: number;
  fileCount: number;
  filesProcessed: number;
  isCalculating: boolean;
  error: string | null;
  fileReport: TestPointsFileReport[];
}


export const useTestPointsReport = () => {
  const [report, setReport] = useState<TestPointsReport | null>(null);

  const calculateTestPointsReport = useCallback(async (project: Project) => {
    setReport({
      totalTestPoints: 0,
      fileCount: project.projectFiles.length,
      filesProcessed: 0,
      isCalculating: true,
      error: null,
      fileReport: [],
    });

    let totalTestPoints = 0;
    const fileReport: TestPointsFileReport[] = [];

    for (let i = 0; i < project.projectFiles.length; i++) {
      const file = project.projectFiles[i];

      try {
        const { dcpData, surveyData } = await loadProjectFileData(file);

        const surveyCommentByStation = new Map<number, string>();
        const voltageByStation = new Map<number, { vOn?: number; vOff?: number }>();
        for (const row of surveyData) {
          const station = Number(row[SurveyStationKey]);
          if (!surveyCommentByStation.has(station)) {
            const raw = (row[SurveyCommentKey]?.toString() ?? '').trim()
              || (row[SurveyAnomalyKey]?.toString() ?? '').trim();
            if (raw) surveyCommentByStation.set(station, raw);
          }
          if (!voltageByStation.has(station)) {
            const vOn = row[SurveyOnVoltageKey] != null ? Number(row[SurveyOnVoltageKey]) : undefined;
            const vOff = row[SurveyOffVoltageKey] != null ? Number(row[SurveyOffVoltageKey]) : undefined;
            if (vOn !== undefined || vOff !== undefined) voltageByStation.set(station, { vOn, vOff });
          }
        }

        const selectedByStation = new Map<number, number>();
        const dcpStations = new Set<number>();
        const dcpPoints: TestPoint[] = dcpData.map((row, idx) => {
          const anomalyText = row[DCPDataAnomalyKey]?.toString() ?? '';
          const stationNo = Number(row[DCPDataStationKey]);
          dcpStations.add(stationNo);
          const surveyText = surveyCommentByStation.get(stationNo) ?? '';
          const comment = extractComment(surveyText, anomalyText);
          const { vOn, vOff } = voltageByStation.get(stationNo) ?? {};
          let isSelected = false;
          if (isDcpTestPoint(anomalyText) && !selectedByStation.has(stationNo)) {
            isSelected = true;
            selectedByStation.set(stationNo, idx);
          }
          return { stationNo, anomalyText, comment, isSelected, isSuggested: false, vOn, vOff };
        });

        const suggestedStations = new Set<number>();
        const suggestedPoints: TestPoint[] = [];
        for (const [station, raw] of surveyCommentByStation) {
          if (dcpStations.has(station) || suggestedStations.has(station)) continue;
          if (!TP_ANYWHERE.test(raw)) continue;
          suggestedStations.add(station);
          const { vOn, vOff } = voltageByStation.get(station) ?? {};
          suggestedPoints.push({
            stationNo: station,
            anomalyText: '',
            comment: extractComment(raw, ''),
            isSelected: false,
            isSuggested: true,
            vOn,
            vOff,
          });
        }

        const points = [...dcpPoints, ...suggestedPoints].sort((a, b) => a.stationNo - b.stationNo);
        const testPointCount = points.filter(p => p.isSelected).length;
        const selectedPoints = points.filter(p => p.isSelected);
        totalTestPoints += testPointCount;
        fileReport.push({ fileName: file.name, testPointCount, points, selectedPoints });

        setReport((prev) => prev ? {
          ...prev,
          totalTestPoints,
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
      totalTestPoints,
      fileCount: project.projectFiles.length,
      filesProcessed: project.projectFiles.length,
      isCalculating: false,
      error: null,
      fileReport,
    });
  }, []);

  const toggleTestPoint = useCallback((fileName: string, pointIndex: number) => {
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
        testPointCount: newPoints.filter(p => p.isSelected).length,
        selectedPoints: newPoints.filter(p => p.isSelected),
      };

      return {
        ...prev,
        totalTestPoints: newFileReport.reduce((sum, f) => sum + f.testPointCount, 0),
        fileReport: newFileReport,
      };
    });
  }, []);

  const editTestPointName = useCallback((fileName: string, pointIndex: number, name: string) => {
    setReport(prev => {
      if (!prev) return prev;
      const fileIdx = prev.fileReport.findIndex(f => f.fileName === fileName);
      if (fileIdx === -1) return prev;
      const file = prev.fileReport[fileIdx];
      const newPoints = file.points.map((p, i) =>
        i === pointIndex ? { ...p, editedName: name } : p
      );
      const newFileReport = [...prev.fileReport];
      newFileReport[fileIdx] = {
        ...file,
        points: newPoints,
        selectedPoints: newPoints.filter(p => p.isSelected),
      };
      return { ...prev, fileReport: newFileReport };
    });
  }, []);

  const buildFinalReport = useCallback((
    project: Project,
    reportsInformation: ReportInformation[],
  ): TestPointsFinalReportData => {
    const projectFileNames = project.projectFiles.map(f => f.name);
    const relevant = reportsInformation.filter(r => projectFileNames.includes(r.survey?.name ?? ''));

    // Latest date from report information (ISO format YYYY-MM-DD)
    let latest: Date | null = null;
    for (const info of relevant) {
      if (!info.date) continue;
      const match = info.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        if (!latest || d > latest) latest = d;
      }
    }
    const monthYear = latest
      ? `${String(latest.getMonth() + 1).padStart(2, '0')}/${latest.getFullYear()}`
      : '';
    const hasDate = !!monthYear;
    const title = `Test Points Measurements ${hasDate ? monthYear : '[MM/YYYY]'}`;

    const rows: FinalReportTestPoint[] = [];

    if (report) {
      const sortedFiles = [...project.projectFiles]
        .map(file => {
          const reportInfo = reportsInformation.find(r => r.survey?.name === file.name);
          const displayName = getSurveyDisplayName(reportInfo?.projectName, file.name) ?? file.name;
          const fileReport = report.fileReport.find(f => f.fileName === file.name);
          return fileReport && fileReport.selectedPoints.length > 0 ? { displayName, fileReport } : null;
        })
        .filter((x): x is { displayName: string; fileReport: TestPointsFileReport } => x !== null)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      sortedFiles.forEach(({ displayName, fileReport }, fi) => {
        const color = fileColor(fi);
        const reportInfo = reportsInformation.find(r => r.survey?.name === fileReport.fileName);
        const pipelineSize = reportInfo?.pipelineSize ? `${reportInfo.pipelineSize}"` : '';
        for (const point of fileReport.selectedPoints) {
          rows.push({
            displayName,
            fileColor: color,
            pipelineSize,
            testPoint: point.editedName ?? point.comment,
            vOn: point.vOn,
            vOff: point.vOff,
          });
        }
      });
    }

    return { title, hasDate, projectName: project.projectName, rows };
  }, [report]);

  return { report, calculateTestPointsReport, toggleTestPoint, editTestPointName, buildFinalReport };
};
