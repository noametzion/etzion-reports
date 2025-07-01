import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Survey, SurveyFile, SurveyInfo, SurveyDataRow, DCPDataRow } from '@/app/types/survey';

// Helper to convert sheet to JSON with proper header mapping
const sheetToJSON = <T,>(sheet: XLSX.WorkSheet, headerMap: Record<string, keyof T>): T[] => {
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });
  if (data.length < 2) return [];

  const headers = data[0] as string[];
  const jsonData = data.slice(1);

  return jsonData.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (mappedKey) {
        rowData[mappedKey] = row[index];
      }
    });
    return rowData as T;
  });
};

// Helper to parse the 'Survey Info' sheet
const parseSurveyInfo = (sheet: XLSX.WorkSheet): SurveyInfo => {
    const info: any = {};
    const sheetData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    sheetData.forEach(row => {
        if (row && row.length >= 2) {
          const key = row[0];
          info[key] = row[1];
        }
    });
    return info as SurveyInfo;
};

export const useSurveyReader = (file: SurveyFile | null) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSurvey(null);
      setIsLoading(false);
      setError(null)
      return;
    }

    const readFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/surveys/${file.name}`);
        if (!response.ok) {
          throw new Error('Failed to fetch survey file.');
        }
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
        // ?
        const surveyInfo = parseSurveyInfo(surveyInfoSheet);

        setSurvey({
          surveyData,
          DCPData: dcpData,
          surveyInfo,
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    readFile();
  }, [file]);

  return { survey, isLoading, error };
};
