"use client";

import { useCallback } from "react";
import { useAnomalyReports } from "@/app/hooks/useAnomalyReports";
import { AnomalyReport } from "@/app/types/report";
import { SurveyFile } from "@/app/types/survey";

export function useAnomalyReport(originalSurveyFile: SurveyFile | null | undefined) {
    const { anomalyReports, add, upsert, loaded } = useAnomalyReports();
    const anomalyReport = anomalyReports.find(r => r.originalSurveyFile?.name === originalSurveyFile?.name) ?? null;

    const saveAnomalyReport = useCallback((report: AnomalyReport) => {
        if (!originalSurveyFile) return;
        if (anomalyReport) {
            upsert(anomalyReport.id, { originalSurveyFile, anomalyReport: report });
        } else {
            add({ originalSurveyFile, anomalyReport: report });
        }
    }, [originalSurveyFile, anomalyReport, add, upsert]);

    return { anomalyReport, saveAnomalyReport, loaded };
}
