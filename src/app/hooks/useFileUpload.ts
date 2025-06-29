import { useState, useEffect, useCallback } from 'react';

// It's good practice to define shared types in a separate file (e.g., types.ts)
// For now, we'll define them here.
export interface SurveyFile {
  name: string;
  path: string;
  uploadedAt: string;
}

interface ResponseSurveyFileData {
  fileName: string;
  filePath: string;
}

const SURVEYS_API = '/api/surveys';

export const useSurveyFiles = () => {
  const [files, setFiles] = useState<SurveyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(SURVEYS_API);
      const responseData = await response.json();
      if (!response.ok) setError(responseData.error || 'Failed to fetch files');
      else {
        const fileList = (responseData.files as ResponseSurveyFileData[]).map((file) => ({
          name: file.fileName,
          path: file.filePath,
          uploadedAt: new Date().toISOString(), // Placeholder, ideally from server
        }));
        setFiles(fileList);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    const requestData = new FormData();
    requestData.append('file', file);

    try {
      const response = await fetch(SURVEYS_API, {
        method: 'POST',
        body: requestData,
      });
      const responseData = await response.json();
      if (!response.ok) setError(responseData.error ||'Upload failed');
      else {
        setFiles(prev => [
          {name: responseData.fileName, path: responseData.filePath, uploadedAt: new Date().toISOString()},
          ...prev,
        ]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    const originalFiles = [...files];
    // Optimistic update
    setFiles(prev => prev.filter(file => file.name !== fileName));

    try {
      const response = await fetch(`${SURVEYS_API}?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Revert on error
        setFiles(originalFiles);
        const responseData = await response.json();
        setError(responseData.error || 'Failed to delete file on server');
      }
    } catch (err: any) {
      // Revert on error
      setFiles(originalFiles);
      setError(err.message);
    }
  };

  return { files, isLoading, isUploading, error, uploadFile, deleteFile, fetchFiles };
};
