"use client";

import {useState, useEffect, useCallback, useMemo} from 'react';
import {EditedSurvey, Survey, SurveyDataRow, SurveyFile} from '@/app/types/survey';
import {cloneDeep} from "es-toolkit";
import {useEditedSurveyFile} from "@/app/hooks/useEditedSurveyFile";
import {useSurveyReader} from "@/app/hooks/useSurveyReader";

// TODO: create a reader for the edited survey
function diff(ss: Survey | null, es: EditedSurvey | null) {
  if (ss === null && es === null) return false;
  if (ss === null || es === null) return true;
    const a = ss.surveyData;
    const b = es.surveyData as SurveyDataRow[]; // TODO: fix type
  for (const k in a) {
    if (!Object.is(a[k], b[k])){
      console.log(`${k}`, a[k], b[k]);
      return true;
    }
  }
  return false;
}

export const useSurveyEditor = (originalSurveyFile: SurveyFile | null, originalSurvey: Survey | null) => {
  const [originalSurveyIsSet, setOriginalSurveyIsSet] = useState(false);
  const [editedSurvey, setEditedSurvey] = useState<EditedSurvey | null>(null);
  const {editedFile, isLoading: editedFileLoading, isUpdating: editedFileUpdating, error: editedFileError, updateFile, deleteFile } = useEditedSurveyFile(originalSurveyFile?.name);
  const { survey: lastEditedSurvey , isLoading: lastEditedSurveyReading, error: lastEditedSurveyError} = useSurveyReader(editedFile as (SurveyFile | null));

  const isChanged = useMemo(() => diff(lastEditedSurvey, editedSurvey), [lastEditedSurvey, editedSurvey]);

  useEffect(() => {
    if (originalSurvey && !originalSurveyIsSet) {
      // get the edited survey from the server or clone survey
      if (editedFile && lastEditedSurvey) {
        setEditedSurvey({surveyData: cloneDeep(lastEditedSurvey?.surveyData)});
        setOriginalSurveyIsSet(true);
      } else if (!editedFileLoading && !editedFileError && !editedFile &&
                 !lastEditedSurveyReading && !lastEditedSurveyError && !lastEditedSurvey) {
        setEditedSurvey({surveyData: cloneDeep(originalSurvey.surveyData)});
        setOriginalSurveyIsSet(true);
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
  }, [setEditedSurvey]);

  const saveEditedSurvey = useCallback(async () => {
    if (editedSurvey && originalSurveyFile) {
      // TODO: save edited survey
      // await updateFile(editedSurvey, originalSurveyFile.name);
    }
  }, [
      editedSurvey,
      originalSurveyFile
  ]);

  return { editedSurvey , saveEditedSurvey, isChanged, editedFile, isUpdating: editedFileUpdating, editLocally};
};
