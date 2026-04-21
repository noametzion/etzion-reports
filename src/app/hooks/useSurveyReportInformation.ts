"use client";

import { useCallback, useRef } from "react";
import { useReportsInformation } from "@/app/hooks/useReportsInformation";
import { ReportInformation } from "@/app/types/reportInformation";

export function useSurveyReportInformation(surveyName: string | null | undefined) {
    const { reportsInformation, upsert, loaded } = useReportsInformation();
    const reportInfo = reportsInformation.find(r => r.survey?.name === surveyName) ?? null;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateReportInfo = useCallback((patch: Partial<ReportInformation>) => {
        if (!surveyName) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            upsert(surveyName, patch);
        }, 1000);
    }, [surveyName, upsert]);

    const projectNameSuggestions = [...new Set(
        reportsInformation.map(r => r.projectName).filter(Boolean)
    )];

    const locationSuggestions = [...new Set([
        ...reportsInformation.map(r => r.from).filter(Boolean),
        ...reportsInformation.map(r => r.to).filter(Boolean),
    ])];

    return { reportInfo, updateReportInfo, loaded, projectNameSuggestions, locationSuggestions };
}
