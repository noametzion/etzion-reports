"use client";

import { useState, useEffect, useCallback } from 'react';
import {EditedSurveyFile} from "@/app/types/survey";
import { fetchFileByQueryParam, uploadFileWithDataToAPI, deleteFileFromAPI } from "@/app/utils/readFileUtils";

interface ResponseEditedSurveyFileData {
  fileName: string;
  filePath: string;
  isLocal: boolean;
  originalFileName: string;
}

const EDITED_SURVEYS_API = '/api/editedSurveys';

export const useEditedSurveyFile = (originalFileName?: string) => {
  const [editedFile, setEditedFile] = useState<EditedSurveyFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = useCallback(async () => {
    if(!originalFileName) return;

    setIsLoading(true);
    setError(null);
    try {
      const responseData = await fetchFileByQueryParam(EDITED_SURVEYS_API, 'originalFileName', originalFileName);
      const resFile = responseData.file as ResponseEditedSurveyFileData | null;

      if (!resFile) {
        setEditedFile(null);
      } else {
        setEditedFile({
          name: resFile.fileName,
          path: resFile.filePath,
          isLocal: resFile.isLocal,
          originalFileName: resFile.originalFileName,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setEditedFile(null);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [originalFileName]);

  useEffect(() => {
    setEditedFile(null);
    fetchFile();
  }, [fetchFile]);

  const updateFile = async (file: File, originalFileName: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      const responseData = await uploadFileWithDataToAPI(EDITED_SURVEYS_API, file, { originalFileName });
      setEditedFile({
        name: responseData.fileName,
        path: responseData.filePath,
        isLocal: responseData.isLocal,
        originalFileName: responseData.originalFileName,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteFile = async (editedFileName: string) => {
    const originalEditedFile = editedFile;
    // Optimistic update
    setEditedFile(null);

    try {
      await deleteFileFromAPI(EDITED_SURVEYS_API, editedFileName);
    } catch (err) {
      // Revert on error
      setEditedFile(originalEditedFile);
      setError((err as Error).message);
    }
  };

  const reload = useCallback(() => {
    setEditedFile(null);
    fetchFile();
  }, [setEditedFile, fetchFile]);

  return { editedFile, isLoading, isUpdating, error, updateFile, deleteFile, reload };
};
