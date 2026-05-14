import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { AnomalyReport } from "@/app/types/report";
import { SurveyFile } from "@/app/types/survey";

type AnomalyReportData = { anomalyReport: AnomalyReport; originalSurveyFile: SurveyFile };

const collectionPath = "anomaly_reports";

export const anomalyReportsCol = collection(db, collectionPath);

export async function createAnomalyReport(data: AnomalyReportData) {
    const ref = await addDoc(anomalyReportsCol, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref;
}

export async function upsertAnomalyReport(id: string, patch: AnomalyReportData) {
    await setDoc(
        doc(db, collectionPath, id),
        { ...patch, updatedAt: serverTimestamp() },
        { merge: true }
    );
}

export async function updateAnomalyReport(id: string, patch: Partial<AnomalyReportData>) {
    await updateDoc(doc(db, collectionPath, id), {
        ...patch,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteAnomalyReport(id: string) {
    await deleteDoc(doc(db, collectionPath, id));
}
