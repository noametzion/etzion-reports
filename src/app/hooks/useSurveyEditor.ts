"use client";

import {useState, useEffect, useCallback, useMemo} from 'react';
import {EditedSurvey, Survey, SurveyDataRow, SurveyFile} from '@/app/types/survey';
import {cloneDeep} from "es-toolkit";
import {useEditedSurveyFile} from "@/app/hooks/useEditedSurveyFile";
import {useEditedSurveyReader} from "@/app/hooks/useEditedSurveyReader";

export const useSurveyEditor = (originalSurveyFile: SurveyFile | null, originalSurvey: Survey | null) => {
  const [originalSurveyIsSet, setOriginalSurveyIsSet] = useState(false);
  const [editedSurvey, setEditedSurvey] = useState<EditedSurvey | null>(null);
  const {editedFile, isLoading: editedFileLoading, isUpdating: editedFileUpdating, error: editedFileError, updateFile, reload: reloadEditedSurveyFile } = useEditedSurveyFile(originalSurveyFile?.name);
  const { survey: lastEditedSurvey , isLoading: lastEditedSurveyReading, error: lastEditedSurveyError} = useEditedSurveyReader(editedFile);
  const [isChanged, setIsChanged] = useState(false);

  const editedFileExists = useMemo(() => editedFile !== null, [editedFile]);

  useEffect(() => {
    if (originalSurvey && !originalSurveyIsSet) {
      // get the edited survey from the server or clone survey
      if (editedFile && lastEditedSurvey) {
        setEditedSurvey(cloneDeep(lastEditedSurvey));
        setOriginalSurveyIsSet(true);
        setIsChanged(false);
      } else if (!editedFileLoading && !editedFileError && !editedFile &&
                 !lastEditedSurveyReading && !lastEditedSurveyError && !lastEditedSurvey) {
        setEditedSurvey({surveyData: cloneDeep(originalSurvey.surveyData)});
        setOriginalSurveyIsSet(true);
        setIsChanged(false);
      } else if (!editedFileLoading && editedFileError) {
        console.error("Error fetching edited survey file:", editedFileError);
      } else if (!lastEditedSurveyReading && lastEditedSurveyError) {
        console.error("Error reading last edited survey:", lastEditedSurveyError);
      }
    }
  }, [originalSurvey,
    originalSurveyIsSet,
    editedFile,
    lastEditedSurvey,
    editedFileLoading,
    editedFileError,
    lastEditedSurveyReading,
    lastEditedSurveyError
  ]);

  useEffect(() => {
    if (!originalSurveyFile || !originalSurvey) {
      setOriginalSurveyIsSet(false);
      setEditedSurvey(null);
    }
  }, [originalSurvey, originalSurveyFile]);

  const editLocally = useCallback((editedSurveyData: SurveyDataRow[]) => {
    setEditedSurvey({surveyData: editedSurveyData});
    setIsChanged(true);
  }, [setEditedSurvey]);

  const reload = useCallback(() => {
    setOriginalSurveyIsSet(false);
    reloadEditedSurveyFile();
  }, [setOriginalSurveyIsSet, reloadEditedSurveyFile]);

  const saveEditedSurvey = useCallback(async () => {
    if (editedSurvey && originalSurveyFile) {
      const surveyJson = JSON.stringify(editedSurvey, null, 2);
      const blob = new Blob([surveyJson], { type: 'application/json' });
      const file = new File([blob], `${originalSurveyFile.name}_edited`, { type: 'application/json' });
      await updateFile(file, originalSurveyFile.name);
      setIsChanged(false);
    }
  }, [
      editedSurvey,
      originalSurveyFile,
      updateFile
  ]);

  return { editedSurvey , saveEditedSurvey, isChanged, isUpdating: editedFileUpdating, editLocally, reload, editedFileExists};
};
