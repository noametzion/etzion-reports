"use client";

import { useState, useCallback } from 'react';
import { Project } from '@/app/types/project';
import { SurveyDistanceKey, SurveyDataRow, SurveyInfo, EditedSurveyFile } from '@/app/types/survey';
import { fetchFileByQueryParam } from '@/app/utils/readFileUtils';
import { readEditedSurveyData, readOriginalSurveyFile } from '@/app/utils/fileDataUtils';
import { calculatePathLengthKm, splitSurveyDataByBreaks } from '@/app/utils/gpsUtils';

interface ResponseEditedSurveyFileData {
  fileName: string;
  filePath: string;
  isLocal: boolean;
  originalFileName: string;
}

const EDITED_SURVEYS_API = '/api/editedSurveys';

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

  const calculateGpsDist = (pathSegments: SurveyDataRow[][], gpsThreshold: number): number => {
    return calculatePathLengthKm(pathSegments, gpsThreshold);
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
        // Read original survey file to get surveyInfo
        const originalSurvey = await readOriginalSurveyFile(file);

        // Fetch edited survey file metadata
        let editedFile: EditedSurveyFile | null = null;
        try {
          const responseData = await fetchFileByQueryParam(EDITED_SURVEYS_API, 'originalFileName', file.name);
          const resFile = responseData.file as ResponseEditedSurveyFileData | null;

          if (resFile) {
            editedFile = {
              name: resFile.fileName,
              path: resFile.filePath,
              isLocal: resFile.isLocal,
              originalFileName: resFile.originalFileName,
              updatedAt: new Date().toISOString(),
            };
          }
        } catch (err) {
          // No edited file exists, continue with original
        }

        let surveyData: SurveyDataRow[] = originalSurvey.surveyData;
        const surveyInfo: SurveyInfo = originalSurvey.surveyInfo;

        // If edited file exists, use edited surveyData instead
        if (editedFile) {
          const editedSurvey = await readEditedSurveyData(editedFile);
          surveyData = editedSurvey.surveyData;
        }

        if (surveyData.length === 0) {
          continue;
        }

        const distPerReading = Number(surveyInfo['Dist per reading']) || 0;
        const pathSegments = splitSurveyDataByBreaks(surveyData, SurveyDistanceKey, distPerReading);
        const flatSurveyData = surveyData.filter(
          (row) => row['Latitude'] !== undefined && row['Longitude'] !== undefined
        );
        const gpsDist = calculateGpsDist(pathSegments, thresholdMeters);
        const extendedGpsDist = calculateGpsDist(flatSurveyData.length > 0 ? [flatSurveyData] : [], thresholdMeters);

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
