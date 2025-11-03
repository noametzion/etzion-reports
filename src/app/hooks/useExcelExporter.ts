"use client";

import * as XLSX from "xlsx";
import {useState} from "react";
import {
    DCPDataRow, DCPDateTimeKeys,
    EditedSurvey,
    SURVEY_DATE_TIME_FORMAT,
    SURVEY_SHORT_DATE_TIME_FORMAT,
    SurveyDataRow,
    SurveyDateTimeKeys,
    SurveyInfo,
    SurveyInfoDateTimeKeys
} from "@/app/types/survey";
import {WorkSheet} from "xlsx";
import {forEach} from "es-toolkit/compat";


const formatColumnAsDateTime = (workSheet: WorkSheet, columnIndex: number) => {
    if (columnIndex !== -1) {
        // Set the number format for the column
        if (!workSheet['!cols']) {
            workSheet['!cols'] = [];
        }

        // Set the column width
        workSheet['!cols']![columnIndex] = {
            ...workSheet['!cols']![columnIndex],
            wch: 25
        };

        // Set the date format for all date cells in the column
        const surveyDataWorksheetRange = workSheet['!ref']
        if (surveyDataWorksheetRange) {
            const range = XLSX.utils.decode_range(surveyDataWorksheetRange);
            for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
                const cellAddress = XLSX.utils.encode_cell({r: rowNum, c: columnIndex});
                if (workSheet[cellAddress]) {
                    workSheet[cellAddress].z = SURVEY_DATE_TIME_FORMAT;
                }
            }
        }
    }
}

export function formatRowAsDateTime(
    workSheet: XLSX.WorkSheet,
    rowNumber: number,
) {
    const ref = workSheet["!ref"];
    if (ref) {
        const valCellAddress = XLSX.utils.encode_cell({r: rowNumber, c: 1});
        if (workSheet[valCellAddress]) {
            workSheet[valCellAddress].z = SURVEY_SHORT_DATE_TIME_FORMAT;
        }
    }
}

const formatDateTimeColumns = (workSheet: WorkSheet, headers: string[], dateTimeKeys: (keyof SurveyDataRow | keyof DCPDataRow)[]) => {
    forEach(dateTimeKeys, (key) => {
        const index = headers.indexOf(key);
        formatColumnAsDateTime(workSheet, index);
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDateTimeRows = (workSheet: WorkSheet, entries: (never[] | [string, any])[], dateTimeKeys: (keyof SurveyInfo)[]) => {
    forEach(dateTimeKeys, (key) => {
        const rowNumber = entries.findIndex(row => row[0] === key);
        formatRowAsDateTime(workSheet, rowNumber);
    });
}

export const useExcelExporter = () => {
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const exportToExcel = (editedSurvey: EditedSurvey, surveyInfo: SurveyInfo, surveyDataHeaders: string[], dcpDataHeaders: string[]) => {
        setIsExporting(true);

        try {
            const workbook = XLSX.utils.book_new();

            // Survey Data
            const surveyDataWorksheet = XLSX.utils.json_to_sheet(editedSurvey.surveyData, {
                header: surveyDataHeaders
            });
            formatDateTimeColumns(surveyDataWorksheet, surveyDataHeaders, SurveyDateTimeKeys)

            // DCP Data
            const dcpDataWorksheet = XLSX.utils.json_to_sheet(editedSurvey.DCPData, {
                header: dcpDataHeaders
            });
            formatDateTimeColumns(dcpDataWorksheet, dcpDataHeaders, DCPDateTimeKeys)

            // Survey Info
            const surveyInfoRows = [
                [],  // empty first row
                ...Object.entries(surveyInfo)
            ];
            const surveyInfoWorksheet = XLSX.utils.aoa_to_sheet(surveyInfoRows);
            formatDateTimeRows(surveyInfoWorksheet, surveyInfoRows, SurveyInfoDateTimeKeys)

            XLSX.utils.book_append_sheet(workbook, surveyDataWorksheet, 'Survey Data');
            XLSX.utils.book_append_sheet(workbook, dcpDataWorksheet, 'DCP Data');
            XLSX.utils.book_append_sheet(workbook, surveyInfoWorksheet, 'Survey Info');

            XLSX.writeFile(workbook, "edited_survey.xlsx");
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        } finally {
            setTimeout(() => setIsExporting(false), 3000);
        }
    };

    return { exportToExcel, isExporting };
};