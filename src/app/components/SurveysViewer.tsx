import React from 'react';
import { FaTrash, FaFolderOpen } from 'react-icons/fa';
import styles from './SurveysViewer.module.css';
import SurveyUploader from './SurveyUploader';
import { formatDate } from '@/app/utils/dateTimeUtils';
import { useSurveyFiles } from '@/app/hooks/useFileUpload';
import { useSurveyReader } from '@/app/hooks/useSurveyReader';
import SurveySheet from './SurveySheet';
import { SurveyFile } from '@/app/types/survey';

interface SurveysViewerProps {
    onSurveySelected: (surveyFile: SurveyFile | null) => void;
    shouldFocus: boolean;
    onShouldFocusDistanceChanges: (shouldFocus: boolean) => void;
}

const SurveysViewer: React.FC<SurveysViewerProps> = ({
  onSurveySelected,
  onShouldFocusDistanceChanges,
  shouldFocus
 }) => {
  const { files, isLoading, isUploading, error: surveyFilesError, getFile, uploadFile, deleteFile } = useSurveyFiles();
  const [selectedFile, setSelectedFile] = React.useState<SurveyFile | null>(null);
  const { survey, isLoading: isReading, error: surveyReaderError } = useSurveyReader(selectedFile);

  const handleOpenFile = (fileName: string) => {
    const fileToOpen = getFile(fileName);
    if (fileToOpen) {
      setSelectedFile(fileToOpen);
      onSurveySelected(fileToOpen);
    }
  };

  const handleCloseFile = () => {
    setSelectedFile(null);
    onShouldFocusDistanceChanges(false);
    onSurveySelected(null)
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      await deleteFile(fileName);
    }
  };

  const handleFocusCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(e.target.checked);
      onShouldFocusDistanceChanges(e.target.checked);
  };

  if (isReading) {
    return <div className={styles.loading}>Reading survey...</div>;
  }

  if (surveyReaderError) {
    return (
      <div className={styles.errorContainer}>
          <button onClick={handleCloseFile} className={styles.closeButton}>Back to Surveys</button>
          <div className={styles.error}>{surveyReaderError}</div>
      </div>
    );
  }

  if (survey) {
    return (
      <div className={styles.sheetContainer}>
        <button onClick={handleCloseFile} className={styles.closeButton}>Back to Surveys</button>
        <span> Focus on distance: </span><input type={"checkbox"} onChange={handleFocusCheckboxChanges}/>
        <SurveySheet survey={survey} surveyFileName={selectedFile?.name || ''} shouldFocus={shouldFocus}/>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Surveys</h2>
        <SurveyUploader
          isUploading={isUploading}
          error={surveyFilesError}
          uploadFile={uploadFile}
        />
      </div>

      <div className={styles.errorContainer}>
        {surveyFilesError &&
          <div className={styles.error}>{surveyFilesError}</div>
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
