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
import { ReportInformation } from "@/app/types/reportInformation";

const collectionPath = "reports_information";

const reportsInformationCol = collection(db, collectionPath);

export async function createReportInformation(data: ReportInformation) {
    const ref = await addDoc(reportsInformationCol, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref;
}

export async function upsertReportInformation(id: string, patch: Partial<ReportInformation>) {
    await setDoc(
        doc(db, collectionPath, id),
        { ...patch, updatedAt: serverTimestamp() },
        { merge: true }
    );
}

export async function updateReportInformation(id: string, patch: Partial<ReportInformation>) {
    await updateDoc(doc(db, collectionPath, id), {
        ...patch,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteReportInformation(id: string) {
    await deleteDoc(doc(db, collectionPath, id));
}
