"use client";

import { useState, useEffect } from 'react';
import { Survey, SurveyFile } from '@/app/types/survey';
import { readOriginalSurveyFile } from '@/app/utils/fileDataUtils';

export const useSurveyReader = (file: SurveyFile | null) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSurvey(null);
      setIsLoading(false);
      setError(null)
      return;
    }

    const readFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const surveyData = await readOriginalSurveyFile(file);
        setSurvey(surveyData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    readFile();
  }, [file]);

  return { survey, isLoading, error };
};
