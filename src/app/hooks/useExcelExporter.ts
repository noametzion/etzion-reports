"use client";

import * as XLSX from "xlsx";
import {useState} from "react";
import {EditedSurvey, SurveyInfo} from "@/app/types/survey";

export const useExcelExporter = () => {
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const exportToExcel = (editedSurvey: EditedSurvey, surveyInfo: SurveyInfo, surveyDataHeaders: string[], dcpDataHeaders: string[]) => {
        setIsExporting(true);
        const workbook = XLSX.utils.book_new();

        const surveyDataWorksheet = XLSX.utils.json_to_sheet(editedSurvey.surveyData, {
            header: surveyDataHeaders
        });

        const dcpDataWorksheet = XLSX.utils.json_to_sheet(editedSurvey.DCPData, {
            header: dcpDataHeaders
        });

        const surveyInfoRows = Object.entries(surveyInfo);
        const surveyInfoWorksheet = XLSX.utils.aoa_to_sheet(surveyInfoRows);

        XLSX.utils.book_append_sheet(workbook, surveyDataWorksheet, 'Survey Data');
        // const colIndex = surveyDataHeaders.indexOf("On Time");
        // /surveyDataWorksheet[colIndex].z = "dd/mm/yyyy hh:mm:ss.000";
        XLSX.utils.book_append_sheet(workbook, dcpDataWorksheet, 'DCP Data');
        XLSX.utils.book_append_sheet(workbook, surveyInfoWorksheet, 'Survey Info');


        XLSX.writeFile(workbook, "edited_survey.xlsx");
        setTimeout(() => setIsExporting(false), 3000);
    };

    return {exportToExcel, isExporting}
}