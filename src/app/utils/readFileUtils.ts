"use client";

import { SurveyFile } from "@/app/types/survey";
import { authedFetch } from "@/app/utils/authedFetch";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/app/config/firebase";

// Generic function to fetch file data from local or Firebase
export const fetchFileResponse = async (file: SurveyFile): Promise<Response> => {
  if (file.isLocal) {
    console.log("reading local file...");
    const response = await fetch(`/surveys/${file.name}`);
    if (!response.ok) {
      throw new Error('Failed to fetch local survey file.');
    }
    return response;
  } else {
    console.log("reading firebase file...");
    const fileRef = ref(storage, file.path);
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch file from Firebase");
    }
    return response;
  }
};

// Generic function to fetch files list from API
export const fetchFilesFromAPI = async <T>(apiEndpoint: string): Promise<T[]> => {
  const response = await authedFetch(apiEndpoint);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Failed to fetch files');
  }

  return responseData.files as T[];
};

// Generic function to upload file to API
export const uploadFileToAPI = async (apiEndpoint: string, file: File) => {
  const requestData = new FormData();
  requestData.append('file', file);

  const response = await authedFetch(apiEndpoint, {
    method: 'POST',
    body: requestData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Upload failed');
  }

  return responseData;
};

// Generic function to delete file from API
export const deleteFileFromAPI = async (apiEndpoint: string, fileName: string): Promise<void> => {
  const response = await authedFetch(`${apiEndpoint}?fileName=${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const responseData = await response.json();
    throw new Error(responseData.error || 'Failed to delete file on server');
  }
};

// Generic function to fetch a single file by query parameter
export const fetchFileByQueryParam = async (apiEndpoint: string, queryParam: string, queryValue: string) => {
  const response = await authedFetch(`${apiEndpoint}?${queryParam}=${encodeURIComponent(queryValue)}`);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Failed to fetch file');
  }

  return responseData;
};

// Generic function to upload file with extra form data (for PUT requests)
export const uploadFileWithDataToAPI = async (apiEndpoint: string, file: File, extraData?: Record<string, string>) => {
  const requestData = new FormData();
  requestData.append('file', file);

  if (extraData) {
    Object.entries(extraData).forEach(([key, value]) => {
      requestData.append(key, value);
    });
  }

  const response = await authedFetch(apiEndpoint, {
    method: 'PUT',
    body: requestData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Upload failed');
  }

  return responseData;
};
