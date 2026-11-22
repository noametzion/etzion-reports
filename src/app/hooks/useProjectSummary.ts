"use client";

import { useState, useCallback } from 'react';
import { Project } from '@/app/types/project';
import { SurveyDistanceKey, SurveyDataRow } from '@/app/types/survey';
import { calculatePathLengthKm, splitSurveyDataByBreaks } from '@/app/utils/gpsUtils';
import { loadProjectFileData } from '@/app/utils/projectFileLoader';

interface ProjectSummary {
  totalGpsDist: number;
  totalExtendedGpsDist: number;
  totalStationNo: number;
  totalStationDistCalc: number;
  distPerReadingValues: number[];
  fileCount: number;
  filesProcessed: number;
  isCalculating: boolean;
  error: string | null;
  gpsThreshold: number;
  fileSummary: {
    fileName: string;
    gpsDist: number;
    extendedGpsDist: number;
    stationNo: number;
    stationDistCalc: number;
    distPerReading: number;
  }[];
}

export const useProjectSummary = () => {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);

  const calculateGpsDist = async (pathSegments: SurveyDataRow[][], gpsThreshold: number): Promise<number> => {
    return await calculatePathLengthKm(pathSegments, gpsThreshold);
  };

  const calculateProjectSummary = useCallback(async (project: Project, thresholdMeters = 35) => {

    setSummary({
      totalGpsDist: 0,
      totalExtendedGpsDist: 0,
      totalStationNo: 0,
      totalStationDistCalc: 0,
      distPerReadingValues: [],
      fileCount: project.projectFiles.length,
      filesProcessed: 0,
      isCalculating: true,
      error: null,
      gpsThreshold: thresholdMeters,
      fileSummary: [],
    });

    let totalGpsDist = 0;
    let totalExtendedGpsDist = 0;
    let totalStationNo = 0;
    let totalStationDistCalc = 0;
    const distPerReadingValues: number[] = [];
    const fileSummary: ProjectSummary['fileSummary'] = [];

    for (let i = 0; i < project.projectFiles.length; i++) {
      const file = project.projectFiles[i];

      try {
        const { surveyData, surveyInfo } = await loadProjectFileData(file);

        if (surveyData.length === 0) {
          continue;
        }

        const distPerReading = Number(surveyInfo['Dist per reading']) || 0;
        const pathSegments = splitSurveyDataByBreaks(surveyData, SurveyDistanceKey, distPerReading);
        const flatSurveyData = surveyData.filter(
          (row) => row['Latitude'] !== undefined && row['Longitude'] !== undefined
        );
        const gpsDist = await calculateGpsDist(pathSegments, thresholdMeters);
        const extendedGpsDist = await calculateGpsDist(flatSurveyData.length > 0 ? [flatSurveyData] : [], thresholdMeters);

        const stationNo = surveyData.reduce((max, row) => {
          const distance = row['Station No'] || 0;
          return distance > max ? distance : max;
        }, 0);
        const stationDistCalc = stationNo * distPerReading;

        totalGpsDist += gpsDist;
        totalExtendedGpsDist += extendedGpsDist;
        totalStationNo += stationNo;
        totalStationDistCalc += stationDistCalc;
        distPerReadingValues.push(distPerReading);
        fileSummary.push({
          fileName: file.name,
          gpsDist,
          extendedGpsDist,
          stationNo,
          stationDistCalc,
          distPerReading,
        });

        setSummary((prev) => prev ? {
          ...prev,
          totalGpsDist,
          totalExtendedGpsDist,
          totalStationNo,
          totalStationDistCalc,
          distPerReadingValues,
          filesProcessed: i + 1,
          gpsThreshold: thresholdMeters,
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
      totalGpsDist,
      totalExtendedGpsDist,
      totalStationNo,
      totalStationDistCalc,
      distPerReadingValues,
      fileCount: project.projectFiles.length,
      filesProcessed: project.projectFiles.length,
      isCalculating: false,
      error: null,
      gpsThreshold: thresholdMeters,
      fileSummary,
    });
  }, []);

  return { summary, calculateProjectSummary };
};
