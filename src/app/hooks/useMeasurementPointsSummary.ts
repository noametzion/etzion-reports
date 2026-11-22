"use client";

import { useState, useCallback } from 'react';
import { Project } from '@/app/types/project';
import { DCPDataAnomalyKey, DCPDataStationKey, isDcpMeasurementPoint } from '@/app/types/survey';
import { loadProjectFileData } from '@/app/utils/projectFileLoader';

export interface MeasurementPointRow {
  stationNo: number;
  anomalyText: string;
  isSelected: boolean;
}

export interface MeasurementPointsFileSummary {
  fileName: string;
  measurementPointCount: number;
  rows: MeasurementPointRow[];
}

interface MeasurementPointsSummary {
  totalMeasurementPoints: number;
  fileCount: number;
  filesProcessed: number;
  isCalculating: boolean;
  error: string | null;
  fileSummary: MeasurementPointsFileSummary[];
}

export const useMeasurementPointsSummary = () => {
  const [summary, setSummary] = useState<MeasurementPointsSummary | null>(null);

  const calculateMeasurementPointsSummary = useCallback(async (project: Project) => {
    setSummary({
      totalMeasurementPoints: 0,
      fileCount: project.projectFiles.length,
      filesProcessed: 0,
      isCalculating: true,
      error: null,
      fileSummary: [],
    });

    let totalMeasurementPoints = 0;
    const fileSummary: MeasurementPointsFileSummary[] = [];

    for (let i = 0; i < project.projectFiles.length; i++) {
      const file = project.projectFiles[i];

      try {
        const { dcpData } = await loadProjectFileData(file);

        const selectedByStation = new Map<number, number>();
        const rows: MeasurementPointRow[] = dcpData.map((row, idx) => {
          const anomalyText = row[DCPDataAnomalyKey]?.toString() ?? '';
          const stationNo = Number(row[DCPDataStationKey]);
          let isSelected = false;
          if (isDcpMeasurementPoint(anomalyText) && !selectedByStation.has(stationNo)) {
            isSelected = true;
            selectedByStation.set(stationNo, idx);
          }
          return { stationNo, anomalyText, isSelected };
        });

        const measurementPointCount = rows.filter(r => r.isSelected).length;
        totalMeasurementPoints += measurementPointCount;
        fileSummary.push({ fileName: file.name, measurementPointCount, rows });

        setSummary((prev) => prev ? {
          ...prev,
          totalMeasurementPoints,
          filesProcessed: i + 1,
          fileSummary: [...fileSummary],
        } : null);
      } catch (err) {
        setSummary((prev) => prev ? {
          ...prev,
          error: `Failed to process ${file.name}: ${(err as Error).message}`,
          isCalculating: false,
        } : null);
        return;
      }
    }

    setSummary({
      totalMeasurementPoints,
      fileCount: project.projectFiles.length,
      filesProcessed: project.projectFiles.length,
      isCalculating: false,
      error: null,
      fileSummary,
    });
  }, []);

  const toggleMeasurementPoint = useCallback((fileName: string, rowIndex: number) => {
    setSummary(prev => {
      if (!prev) return prev;
      const fileIdx = prev.fileSummary.findIndex(f => f.fileName === fileName);
      if (fileIdx === -1) return prev;

      const file = prev.fileSummary[fileIdx];
      const clicked = file.rows[rowIndex];
      if (!clicked) return prev;

      const selecting = !clicked.isSelected;
      const newRows = file.rows.map((row, i) => {
        if (i === rowIndex) return { ...row, isSelected: selecting };
        // when selecting, deselect any other row with the same station
        if (selecting && row.stationNo === clicked.stationNo && row.isSelected) return { ...row, isSelected: false };
        return row;
      });

      const newFileSummary = [...prev.fileSummary];
      newFileSummary[fileIdx] = {
        ...file,
        rows: newRows,
        measurementPointCount: newRows.filter(r => r.isSelected).length,
      };

      return {
        ...prev,
        totalMeasurementPoints: newFileSummary.reduce((sum, f) => sum + f.measurementPointCount, 0),
        fileSummary: newFileSummary,
      };
    });
  }, []);

  return { summary, calculateMeasurementPointsSummary, toggleMeasurementPoint };
};
