"use client";

import { useCallback } from "react";
import { useAnomalyReports } from "@/app/hooks/useAnomalyReports";
import { AnomalyReport } from "@/app/types/report";
import { SurveyFile } from "@/app/types/survey";

export function useAnomalyReport(originalSurveyFile: SurveyFile | null | undefined) {
    const { anomalyReports, add, upsert, remove, loaded, status } = useAnomalyReports();
    const anomalyReport = anomalyReports.find(r => r.originalSurveyFile?.name === originalSurveyFile?.name) ?? null;

    const saveAnomalyReport = useCallback((report: AnomalyReport) => {
        if (!originalSurveyFile) return;
        if (anomalyReport) {
            upsert(anomalyReport.id, { originalSurveyFile, anomalyReport: report });
        } else {
            add({ originalSurveyFile, anomalyReport: report });
        }
    }, [originalSurveyFile, anomalyReport, add, upsert]);

    const deleteAnomalyReport = useCallback(() => {
        if (!anomalyReport) return;
        remove(anomalyReport.id);
    }, [anomalyReport, remove]);

    return { anomalyReport, saveAnomalyReport, deleteAnomalyReport, loaded, isSaving: status === 'loading' };
}
