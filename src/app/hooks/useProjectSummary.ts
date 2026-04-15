"use client";

import { useState, useCallback } from 'react';
import { DBProject } from '@/app/types/dbTypes';
import { SurveyDistanceKey, SurveyDataRow, SurveyInfo, EditedSurveyFile } from '@/app/types/survey';
import { fetchFileByQueryParam } from '@/app/utils/readFileUtils';
import { readEditedSurveyData, readOriginalSurveyFile } from '@/app/utils/fileDataUtils';

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

  const calculateGpsDist = (surveySegments: SurveyDataRow[][], gpsThreshold: number): number => {
    let total = 0;

    for (const surveyData of surveySegments) {
      for (let i = 1; i < surveyData.length; i++) {
        const prevRow = surveyData[i - 1];
        const currentRow = surveyData[i];

        const lat1 = prevRow['Latitude'];
        const lon1 = prevRow['Longitude'];
        const lat2 = currentRow['Latitude'];
        const lon2 = currentRow['Longitude'];

        if (lat1 !== undefined && lon1 !== undefined && lat2 !== undefined && lon2 !== undefined) {
          const earthRadiusMeters = 6371e3;
          const phi1 = lat1 * Math.PI / 180;
          const phi2 = lat2 * Math.PI / 180;
          const deltaPhi = (lat2 - lat1) * Math.PI / 180;
          const deltaLambda = (lon2 - lon1) * Math.PI / 180;

          const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = earthRadiusMeters * c;

          if (dist < gpsThreshold) {
            total += dist;
          }
        }
      }
    }

    return total / 1000;
  };

  const splitSurveyDataByBreaks = (surveyData: SurveyDataRow[], distanceDiff: number): SurveyDataRow[][] => {
    const segments: SurveyDataRow[][] = [];
    let currentSegment: SurveyDataRow[] = [];

    surveyData.forEach((row, index) => {
      const currentDistance = Number(row[SurveyDistanceKey]);
      const previousDistance = index > 0 ? Number(surveyData[index - 1][SurveyDistanceKey]) : undefined;

      if (
        index > 0 &&
        previousDistance !== undefined &&
        distanceDiff > 0 &&
        (previousDistance + distanceDiff) < currentDistance
      ) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }

      if (row['Latitude'] !== undefined && row['Longitude'] !== undefined) {
        currentSegment.push(row);
      }
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  };

  const calculateProjectSummary = useCallback(async (project: DBProject, thresholdMeters = 35) => {
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
        const segmentedSurveyData = splitSurveyDataByBreaks(surveyData, distPerReading);
        const flatSurveyData = surveyData.filter(
          (row) => row['Latitude'] !== undefined && row['Longitude'] !== undefined
        );
        const gpsDist = calculateGpsDist(segmentedSurveyData, thresholdMeters);
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
