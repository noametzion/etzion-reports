import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Survey, SurveyFile, SurveyInfo, SurveyDataRow, DCPDataRow } from '@/app/types/survey';

const parseSurveyInfo = (sheet: XLSX.WorkSheet): SurveyInfo => {
  // eslint-disable-next-line
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

const getHeaders = (sheet: XLSX.WorkSheet): string[] => {
  const headers: string[] = [];
  // Get the sheet's full range, e.g. "A1:D10"
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  // Only read row 0 (Excel rows are 1-based, so r=0 is row 1)
  const headerRowIndex = range.s.r;
  for (let c = range.s.c; c <= range.e.c; ++c) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    const cell = sheet[cellAddress];
    headers.push(cell?.v ?? '');
  }
  return headers;
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
        const surveyInfo = parseSurveyInfo(surveyInfoSheet);
        const surveyDataHeaders = getHeaders(surveyDataSheet) as (keyof SurveyDataRow)[];

        setSurvey({
          surveyData,
          DCPData: dcpData,
          surveyInfo,
          surveyDataHeaders: surveyDataHeaders,
        });

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    readFile();
  }, [file]);

  return { survey, isLoading, error };
};
