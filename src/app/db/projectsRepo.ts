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
import {Project} from "@/app/types/project";

const collectionPath = "projects";

const projectsCol = collection(db, collectionPath);

// CREATE (auto id)
export async function createProject(data: Project) {
    const ref = await addDoc(projectsCol, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref; // contains id
}

// UPSERT (create if missing, update fields only)
export async function upsertProject(id: string, patch: Project) {
    await setDoc(
        doc(db, collectionPath, id),
        { ...patch, updatedAt: serverTimestamp() },
        { merge: true }
    );
}

// UPDATE (fails if doc doesn't exist)
export async function updateProject(id: string, patch: Project) {
    await updateDoc(doc(db, collectionPath, id), {
        ...patch,
        updatedAt: serverTimestamp(),
    });
}

// DELETE
export async function deleteProject(id: string) {
    await deleteDoc(doc(db, collectionPath, id));
}
