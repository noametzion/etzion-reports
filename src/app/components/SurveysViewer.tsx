import React, { useState, useEffect } from 'react';
import { FaTrash, FaFolderOpen } from 'react-icons/fa';
import styles from './SurveysViewer.module.css';
import SurveyUploader from './SurveyUploader';
import {formatDate, getNow} from '@/app/utils/dateTimeUtils';

interface ResponseSurveyFileData {
  fileName: string;
  filePath: string
}

interface SurveyFile {
  name: string;
  path: string;
  uploadedAt: string;
}

const SURVEYS_API = '/api/surveys';

const SurveysViewer = () => {
  const [files, setFiles] = useState<SurveyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(SURVEYS_API);
      if (!response.ok)
        setError('Failed to fetch files');

      const data = await response.json();
      const fileList = (data.files as ResponseSurveyFileData[]).map((file) => ({
        name: file.fileName,
        path: file.filePath,
        uploadedAt: new Date().toISOString() // In a real app, you'd get this from the file stats
      }));

      setFiles(fileList);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load surveys. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadSuccess = (fileName: string, filePath: string) => {
    setFiles(prev => [
      {
        name: fileName,
        path: filePath,
        uploadedAt: getNow()
      },
      ...prev
    ]);
  };

  const handleOpenFile = (fileName: string) => {
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${SURVEYS_API}?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete file');
      } else {
        setFiles(prev => prev.filter(file => file.name !== fileName));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Surveys</h2>
        <SurveyUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      <div className={styles.filesList}>
        {isLoading ? (
          <div className={styles.loading}>Loading surveys...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : files.length === 0 ? (
          <div className={styles.emptyState}>No surveys uploaded yet</div>
        ) : (
          <table className={styles.filesTable}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={index}>
                  <td>{file.name}</td>
                  <td>{formatDate(file.uploadedAt)}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsContainer}>
                      <button
                        onClick={() => handleOpenFile(file.name)}
                        className={styles.openButton}
                        title={`Open ${file.name}`}
                      >
                        <FaFolderOpen className={styles.openIcon} />
                        <span>Open</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.name)}
                        className={styles.deleteButton}
                        title={`Delete ${file.name}`}
                      >
                        <FaTrash className={styles.deleteIcon} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SurveysViewer;
