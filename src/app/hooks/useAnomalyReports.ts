"use client";

import { useCallback, useEffect, useState } from "react";
import {
    createAnomalyReport,
    deleteAnomalyReport,
    updateAnomalyReport,
    upsertAnomalyReport,
    anomalyReportsCol,
} from "@/app/db/anomalyReportRepo";
import { DBAnomalyReport } from "@/app/types/dbTypes";
import { AnomalyReport } from "@/app/types/report";
import { SurveyFile } from "@/app/types/survey";
import { onSnapshot } from "firebase/firestore";

type AnomalyReportData = { anomalyReport: AnomalyReport; originalSurveyFile: SurveyFile };
type Status = "idle" | "loading" | "success" | "error";

export function useAnomalyReports() {
    const [anomalyReports, setAnomalyReports] = useState<DBAnomalyReport[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async <T,>(fn: () => Promise<T>) => {
        setStatus("loading");
        setError(null);
        try {
            const res = await fn();
            setStatus("success");
            return res;
        } catch (e: Error | unknown) {
            setStatus("error");
            setError("Unknown error");
            throw e;
        }
    }, []);

    const add = useCallback(
        (data: AnomalyReportData) => run(() => createAnomalyReport(data)),
        [run]
    );

    const upsert = useCallback(
        (id: string, patch: AnomalyReportData) => run(() => upsertAnomalyReport(id, patch)),
        [run]
    );

    const update = useCallback(
        (id: string, patch: Partial<AnomalyReportData>) => run(() => updateAnomalyReport(id, patch)),
        [run]
    );

    const remove = useCallback(
        (id: string) => run(() => deleteAnomalyReport(id)),
        [run]
    );

    useEffect(() => {
        const unsub = onSnapshot(anomalyReportsCol, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const list = snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as DBAnomalyReport[];
            setAnomalyReports(list);
            setLoaded(true);
        }, console.error);

        return () => unsub();
    }, []);

    return { add, upsert, update, remove, status, error, anomalyReports, loaded };
}
