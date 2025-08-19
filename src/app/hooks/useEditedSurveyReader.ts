"use client";

import {useState, useEffect, useCallback} from 'react';
import { EditedSurvey, EditedSurveyFile } from '@/app/types/survey';

export const useEditedSurveyReader = (editedSurveyFile: EditedSurveyFile | null) => {
  const [survey, setSurvey] = useState<EditedSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSurvey = useCallback(async () => {
    if(!editedSurveyFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const fileResponse = await fetch(editedSurveyFile.path);
      if (!fileResponse.ok) {
        setError(`Failed to fetch file: ${fileResponse.statusText}`);
      }
      const surveyData = await fileResponse.json();
      setSurvey(surveyData);
    } catch (err) {
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

  const reload = useCallback(() => {
    setSurvey(null);
    loadSurvey();
  },[setSurvey, loadSurvey]);

  return { survey, isLoading, error, reload};
};
