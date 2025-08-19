"use client";

import { useState, useEffect, useCallback } from 'react';
import {EditedSurveyFile} from "@/app/types/survey";

interface ResponseEditedSurveyFileData {
  fileName: string;
  filePath: string;
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
    try {
      const response = await fetch(`${EDITED_SURVEYS_API}?originalFileName=${encodeURIComponent(originalFileName)}`);

      const responseData = await response.json();
      if (!response.ok) setError(responseData.error || 'Failed to fetch file');
      else {
        const resFile = (responseData.file as (ResponseEditedSurveyFileData | null));

        if(!resFile)
          setEditedFile(null);
        else
          setEditedFile({
            name: resFile.fileName,
            path: resFile.filePath,
            originalFileName: resFile.originalFileName,
            updatedAt: new Date().toISOString(), // Placeholder, ideally from server
          });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [originalFileName]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  const updateFile = async (file: File, originalFileName: string) => {
    setIsUpdating(true);
    setError(null);
    const requestData = new FormData();
    requestData.append('file', file);
    requestData.append('originalFileName', originalFileName)

    try {
      const response = await fetch(EDITED_SURVEYS_API, {
        method: 'PUT',
        body: requestData,
      });
      const responseData = await response.json();
      if (!response.ok) setError(responseData.error ||'Upload failed');
      else {
        setEditedFile({
              name: responseData.fileName,
              path: responseData.filePath,
              originalFileName: responseData.originalFileName,
              updatedAt: new Date().toISOString()}, //from server
        );
      }
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
      const response = await fetch(`${EDITED_SURVEYS_API}?fileName=${encodeURIComponent(editedFileName)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Revert on error
        setEditedFile(originalEditedFile);
        const responseData = await response.json();
        setError(responseData.error || 'Failed to delete file on server');
      }
    } catch (err) {
      // Revert on error
      setEditedFile(originalEditedFile);
      setError((err as Error).message);
    }
  };

  return { editedFile, isLoading, isUpdating, error, updateFile, deleteFile };
};
