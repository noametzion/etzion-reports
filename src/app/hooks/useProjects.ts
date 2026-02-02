"use client";

import {useCallback, useEffect, useState} from "react";
import { Project } from "@/app/types/project";
import {createProject, deleteProject, updateProject, upsertProject} from "@/app/db/projectsRepo";
import {DBProject} from "@/app/types/dbTypes";
import {collection, getDocs} from "firebase/firestore";
import { db } from "../config/firebase";

type Status = "idle" | "loading" | "success" | "error";

export function useProjects() {
  const [projects, setProjects] = useState<DBProject[]>([]);
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
      // TODO: change
      setError("Unknown error");
      throw e;
    }
  }, []);

  const add = useCallback(
      (data: Project) => run(() => createProject(data)),
      [run]
  );

  const upsert = useCallback(
      (id: string, patch: Project) => run(() => upsertProject(id, patch)),
      [run]
  );

  const update = useCallback(
      (id: string, patch: Project) => run(() => updateProject(id, patch)),
      [run]
  );

  const remove = useCallback(
      (id: string) => run(() => deleteProject(id)),
      [run]
  );

  const getProjects = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    return querySnapshot.docs.map((doc) => {
      return doc.data() as DBProject;
    });
  };

  useEffect(() => {
    getProjects().then(DBProjects => setProjects([...DBProjects]))
  }, []);


  return {
    add,
    upsert,
    update,
    remove,
    status,
    error,
    projects,
  };
}