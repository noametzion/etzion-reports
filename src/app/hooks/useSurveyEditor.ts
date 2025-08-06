"use client";

import { useState, useEffect } from 'react';
import {EditedSurvey, Survey} from '@/app/types/survey';
import {cloneDeep} from "es-toolkit";

export const useSurveyEditor = (survey: Survey | null) => {
  const [originalSurveyIsSet, setOriginalSurveyIsSet] = useState(false);
  const [editedSurvey, setEditedSurvey] = useState<EditedSurvey | null>(null);

  useEffect(() => {
    if (survey && !originalSurveyIsSet) {
      setEditedSurvey({surveyData: cloneDeep(survey.surveyData)});
      setOriginalSurveyIsSet(true);
    }
  }, [survey, originalSurveyIsSet]);

  useEffect(() => {
    if (!survey) {
      setOriginalSurveyIsSet(false);
      setEditedSurvey(null);
    }
  }, [survey]);

  return { editedSurvey };
};
