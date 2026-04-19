"use client";

import { useCallback, useEffect, useState } from "react";
import { ReportInformation } from "@/app/types/reportInformation";
import {
    createReportInformation,
    deleteReportInformation,
    updateReportInformation,
    upsertReportInformation,
} from "@/app/db/reportsInformationRepo";
import { DBReportInformation } from "@/app/types/dbTypes";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const DB_PATH = "reports_information";

type Status = "idle" | "loading" | "success" | "error";

export function useReportsInformation() {
    const [reportsInformation, setReportsInformation] = useState<DBReportInformation[]>([]);
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
        (data: ReportInformation) => run(() => createReportInformation(data)),
        [run]
    );

    const upsert = useCallback(
        (id: string, patch: Partial<ReportInformation>) => run(() => upsertReportInformation(id, patch)),
        [run]
    );

    const update = useCallback(
        (id: string, patch: Partial<ReportInformation>) => run(() => updateReportInformation(id, patch)),
        [run]
    );

    const remove = useCallback(
        (id: string) => run(() => deleteReportInformation(id)),
        [run]
    );

    useEffect(() => {
        const unsub = onSnapshot(collection(db, DB_PATH), (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const list = snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as DBReportInformation[];
            setReportsInformation(list);
        }, console.error);

        return () => unsub();
    }, []);

    return {
        add,
        upsert,
        update,
        remove,
        status,
        error,
        reportsInformation,
    };
}
