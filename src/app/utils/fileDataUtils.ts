"use client";

import { EditedSurvey, EditedSurveyFile, Survey, SurveyFile, SurveyInfo, SurveyDataRow, DCPDataRow } from '@/app/types/survey';
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/app/config/firebase";
import { fetchFileResponse } from '@/app/utils/readFileUtils';
import * as XLSX from 'xlsx';

export const readEditedSurveyData = async (editedSurveyFile: EditedSurveyFile): Promise<EditedSurvey> => {
  if (editedSurveyFile.isLocal) {
    console.log("reading local file...");
    const fileResponse = await fetch(editedSurveyFile.path);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch local file: ${fileResponse.statusText}`);
    }
    const surveyData = await fileResponse.json();
    return surveyData;
  } else {
    console.log("reading firebase file...");
    const fileRef = ref(storage, editedSurveyFile.path);
    const url = await getDownloadURL(fileRef);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch JSON from FIREBASE");
    }
    const data = await res.json();
    return data;
  }
};

const parseSurveyInfo = (sheet: XLSX.WorkSheet): SurveyInfo => {
  // eslint-disable-next-line
  const info: any = {};
  const sheetData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  sheetData.forEach(row => {
    if (row && row.length >= 1) {
      const key = row[0];
      info[key] = row[1];
    }
  });
  return info as SurveyInfo;
};

const getHeaders = (sheet: XLSX.WorkSheet): string[] => {
  const headers: string[] = [];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const headerRowIndex = range.s.r;
  for (let c = range.s.c; c <= range.e.c; ++c) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    const cell = sheet[cellAddress];
    headers.push(cell?.v ?? '');
  }
  return headers;
};

export const readOriginalSurveyFile = async (file: SurveyFile): Promise<Survey> => {
  const response = await fetchFileResponse(file);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

  const surveyDataSheet = workbook.Sheets['Survey Data'];
  const dcpDataSheet = workbook.Sheets['DCP Data'];
  const surveyInfoSheet = workbook.Sheets['Survey Info'];

  if (!surveyDataSheet || !dcpDataSheet || !surveyInfoSheet) {
    throw new Error('One or more required sheets are missing from the survey file.');
  }

  const surveyData = XLSX.utils.sheet_to_json<SurveyDataRow>(surveyDataSheet);
  const dcpData = XLSX.utils.sheet_to_json<DCPDataRow>(dcpDataSheet);
  const surveyInfo = parseSurveyInfo(surveyInfoSheet);
  const surveyDataHeaders = getHeaders(surveyDataSheet) as (keyof SurveyDataRow)[];
  const dcpDataHeaders = getHeaders(dcpDataSheet) as (keyof DCPDataRow)[];

  return {
    surveyData,
    DCPData: dcpData,
    surveyInfo,
    surveyDataHeaders,
    dcpDataHeaders
  };
};
