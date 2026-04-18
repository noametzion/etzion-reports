"use client";

import {useState, useEffect, useCallback} from 'react';
import { EditedSurvey, EditedSurveyFile } from '@/app/types/survey';
import { readEditedSurveyData } from '@/app/utils/fileDataUtils';

export const useEditedSurveyReader = (editedSurveyFile: EditedSurveyFile | null) => {
  const [survey, setSurvey] = useState<EditedSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSurvey = useCallback(async () => {
    if(!editedSurveyFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await readEditedSurveyData(editedSurveyFile);
      setSurvey(data);
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
