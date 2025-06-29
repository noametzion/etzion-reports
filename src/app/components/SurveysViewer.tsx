import React from 'react';
import { FaTrash, FaFolderOpen } from 'react-icons/fa';
import styles from './SurveysViewer.module.css';
import SurveyUploader from './SurveyUploader';
import { formatDate } from '@/app/utils/dateTimeUtils';
import { useSurveyFiles } from '@/app/hooks/useFileUpload';

const SurveysViewer = () => {
  const { files, isLoading, isUploading, error, uploadFile, deleteFile } = useSurveyFiles();

  const handleOpenFile = (fileName: string) => {
    // TODO: Implement file opening logic
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      await deleteFile(fileName);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Surveys</h2>
        <SurveyUploader
          isUploading={isUploading}
          error={error}
          uploadFile={uploadFile}
        />
      </div>

      <div className={styles.errorContainer}>
        {error &&
          <div className={styles.error}>{error}</div>
        }
      </div>
      <div className={styles.filesList}>
        {isLoading ? (
          <div className={styles.loading}>Loading surveys...</div>
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
              {files.map((file) => (
                <tr key={file.name}>
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
                        onClick={() => handleDelete(file.name)}
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
