"use client";

import { SurveyFile, SurveyDataRow, SurveyInfo, EditedSurveyFile } from '@/app/types/survey';
import { DCPDataRow } from '@/app/types/survey';
import { fetchFileByQueryParam } from '@/app/utils/readFileUtils';
import { readEditedSurveyData, readOriginalSurveyFile } from '@/app/utils/fileDataUtils';

interface ResponseEditedSurveyFileData {
  fileName: string;
  filePath: string;
  isLocal: boolean;
  originalFileName: string;
}

const EDITED_SURVEYS_API = '/api/editedSurveys';

export interface ProjectFileData {
  surveyData: SurveyDataRow[];
  dcpData: DCPDataRow[];
  surveyInfo: SurveyInfo;
}

export const loadProjectFileData = async (file: SurveyFile): Promise<ProjectFileData> => {
  const originalSurvey = await readOriginalSurveyFile(file);

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
  } catch {
    // No edited file exists, use original
  }

  if (editedFile) {
    const editedSurvey = await readEditedSurveyData(editedFile);
    return {
      surveyData: editedSurvey.surveyData,
      dcpData: editedSurvey.DCPData,
      surveyInfo: originalSurvey.surveyInfo,
    };
  }

  return {
    surveyData: originalSurvey.surveyData,
    dcpData: originalSurvey.DCPData,
    surveyInfo: originalSurvey.surveyInfo,
  };
};
