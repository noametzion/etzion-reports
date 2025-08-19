"use client";

import { useState, useEffect } from 'react';
import { EditedSurvey, EditedSurveyFile } from '@/app/types/survey';

export const useEditedSurveyReader = (editedSurveyFile: EditedSurveyFile | null) => {
  const [survey, setSurvey] = useState<EditedSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editedSurveyFile) {
      setSurvey(null);
      return;
    }

    const loadSurvey = async () => {
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
    };

    loadSurvey();
  }, [editedSurveyFile]);

  return { survey, isLoading, error };
};
