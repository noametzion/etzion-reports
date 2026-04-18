"use client";

import { useState, useEffect, useCallback } from 'react';
import {SurveyFile} from "@/app/types/survey";
import { fetchFilesFromAPI, uploadFileToAPI, deleteFileFromAPI } from "@/app/utils/readFileUtils";

interface ResponseSurveyFileData {
  fileName: string;
  filePath: string;
  isLocal: boolean;
}

const SURVEYS_API = '/api/surveys';

export const useSurveyFiles = () => {
  const [files, setFiles] = useState<SurveyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseFiles = await fetchFilesFromAPI<ResponseSurveyFileData>(SURVEYS_API);
      const fileList = responseFiles.map((file: ResponseSurveyFileData) => ({
        name: file.fileName,
        path: file.filePath,
        isLocal: file.isLocal,
        uploadedAt: new Date().toISOString(), // Placeholder, ideally from server
      }));
      setFiles(fileList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const getFile = (fileName: string) => {
    return files.find(f => f.name === fileName);
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const responseData = await uploadFileToAPI(SURVEYS_API, file);
      setFiles(prev => [
        {
          name: responseData.fileName,
          path: responseData.filePath,
          uploadedAt: new Date().toISOString(),
          isLocal: responseData.isLocal,
        }, ...prev,
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    const originalFiles = [...files];
    // Optimistic update
    setFiles(prev => prev.filter(file => file.name !== fileName));

    try {
      await deleteFileFromAPI(SURVEYS_API, fileName);
    } catch (err) {
      // Revert on error
      setFiles(originalFiles);
      setError((err as Error).message);
    }
  };

  return { files, isLoading, isUploading, error, getFile, uploadFile, deleteFile };
};
