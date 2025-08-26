"use client";

import {useState, useEffect, useCallback} from 'react';
import { EditedSurvey, EditedSurveyFile } from '@/app/types/survey';
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../config/firebase"

export const useEditedSurveyReader = (editedSurveyFile: EditedSurveyFile | null) => {
  const [survey, setSurvey] = useState<EditedSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSurvey = useCallback(async () => {
    if(!editedSurveyFile) return;
    setIsLoading(true);
    setError(null);
    try {
      if (editedSurveyFile.isLocal) {
        console.log("reading local file...");
        const fileResponse = await fetch(editedSurveyFile.path);
        if (!fileResponse.ok) {
          setError(`Failed to fetch local file: ${fileResponse.statusText}`);
        }
        const surveyData = await fileResponse.json();
        setSurvey(surveyData);
      } else {
        console.log("reading firebase file...");
        const fileRef = ref(storage, editedSurveyFile.path); // path inside bucket
        const url = await getDownloadURL(fileRef);
        const res = await fetch(url);
        if (!res.ok) {
          setError("Failed to fetch JSON from FIREBASE");
        }
        const data = await res.json();
        setSurvey(data);
      }
    } catch (err) {
      console.log("error fetching file:", editedSurveyFile.path, err)
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  },[setIsLoading, setError, setSurvey, editedSurveyFile]);

  useEffect(() => {
    if (!editedSurveyFile) {
      setSurvey(null);
      return;
    }

    loadSurvey();
  }, [editedSurveyFile, loadSurvey]);

  return { survey, isLoading, error};
};
