"use client";

import React, {useMemo} from 'react';
import {FaTrash, FaFolderOpen} from 'react-icons/fa';
import styles from './SurveysViewer.module.css';
import SurveyUploader from './SurveyUploader';
import { formatDate } from '@/app/utils/dateTimeUtils';
import { useSurveyFiles } from '@/app/hooks/useSurveyFiles';
import { useSurveyReader } from '@/app/hooks/useSurveyReader';
import SurveySheet from './SurveySheet';
import { SurveyFile } from '@/app/types/survey';
import {useSurveyEditor} from "@/app/hooks/useSurveyEditor";
import EditorStatusBar from "@/app/components/EditorStatusBar";
import {useExcelExporter} from "@/app/hooks/useExcelExporter";
import ProjectsArranger from "@/app/components/ProjectsArranger";
import {useProjects} from "@/app/hooks/useProjects";
import {FaFolderTree} from "react-icons/fa6";

interface SurveysViewerProps {
    onSurveySelected: (surveyFile: SurveyFile | null) => void;
    shouldFocus: boolean;
    onShouldFocusDistanceChanges: (shouldFocus: boolean) => void;
    shouldShowMapPoints: boolean;
    onShouldShowMapPointsChanges: (shouldShowPointsOnMap: boolean) => void;
}

const SurveysViewer: React.FC<SurveysViewerProps> = ({
  onSurveySelected,
  onShouldFocusDistanceChanges,
  shouldFocus,
  shouldShowMapPoints,
  onShouldShowMapPointsChanges
 }) => {
  const {projects} = useProjects();
  const { files: originalFiles, isLoading, isUploading, error: surveyFilesError, getFile, uploadFile, deleteFile } = useSurveyFiles();
  const [selectedOriginalFile, setSelectedOriginalFile] = React.useState<SurveyFile | null>(null);
  const { survey: originalSurvey, isLoading: isReading, error: surveyReaderError } = useSurveyReader(selectedOriginalFile);
  const { editedSurvey, saveEditedSurvey , isChanged, editedFileExists, isUpdating, editLocally} = useSurveyEditor(selectedOriginalFile, originalSurvey);
  const { exportToExcel, isExporting } = useExcelExporter();

  const filesByProjects = useMemo(() => {
      return projects.map((project) => ({
          project: project,
          projectFiles: originalFiles.filter((file) =>
              (project.projectFiles.some((pf) => pf.path === file.path)))
      }));
  },[projects, originalFiles]);

  const filesWithoutProject = useMemo(() => {
      return originalFiles.filter((file) => !filesByProjects.some((projectWithFiles) => projectWithFiles.projectFiles.some((pf) => pf.path === file.path)));
  },[filesByProjects, originalFiles]);

  const handleOpenFile = (fileName: string) => {
    const fileToOpen = getFile(fileName);
    if (fileToOpen) {
      setSelectedOriginalFile(fileToOpen);
      onSurveySelected(fileToOpen);
    }
  };

  const handleCloseFile = () => {
    setSelectedOriginalFile(null);
    onShouldFocusDistanceChanges(false);
    onShouldShowMapPointsChanges(false);
    onSurveySelected(null)
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      await deleteFile(fileName);
    }
  };

    const handleLinkToProject = async (fileName: string) => {
        console.log("link " + fileName + " to project..");
    };

  const handleFocusCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
      onShouldFocusDistanceChanges(e.target.checked);
  };

    const handleShowMapPointsCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
        onShouldShowMapPointsChanges(e.target.checked);
    };

  if (isReading || (originalSurvey && !editedSurvey)) {
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

  if (originalSurvey && editedSurvey) {
    return (
      <div className={styles.sheetContainer}>
        <button onClick={handleCloseFile} className={styles.closeButton}>Back to Surveys</button>
        <span> Focus on distance: </span><input type={"checkbox"} checked={shouldFocus} onChange={handleFocusCheckboxChanges}/>
        <span> Show map points: </span><input type={"checkbox"} checked={shouldShowMapPoints} onChange={handleShowMapPointsCheckboxChanges}/>
        <EditorStatusBar
            isEditedFileExist={editedFileExists}
            unsavedChangesExists={isChanged}
            isUpdating={isUpdating}
            isExporting={isExporting}
            onSave={() => saveEditedSurvey()}
            onExportToExcel={() => exportToExcel(
                editedSurvey,
                originalSurvey.surveyInfo,
                originalSurvey.surveyDataHeaders,
                originalSurvey.dcpDataHeaders
            )}
        />
        <SurveySheet
            originalSurvey={originalSurvey}
            editedSurvey={editedSurvey}
            surveyFileName={selectedOriginalFile?.name || ''}
            shouldFocus={shouldFocus}
            onEdit={editLocally}
        />
      </div>
    );
  }

  const FileTr = ({file}: {file: SurveyFile}) => {
    return (
      <tr key={file.name} className={styles.fileRow}>
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
                      onClick={() => handleLinkToProject(file.name)}
                      className={styles.addToProjectButton}
                      title={`Delete ${file.name}`}
                  >
                      <FaFolderTree className={styles.addToProjectIcon} />
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
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Surveys</h2>
        <ProjectsArranger />
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
        ) : originalFiles.length === 0 ? (
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
              {filesByProjects.map((projectWithFiles) => (
                  <React.Fragment key={projectWithFiles.project.projectName+"_section"}>
                  <tr key={projectWithFiles.project.projectName} className={styles.projectSection}>
                    <td>{projectWithFiles.project.projectName}</td>
                    <td/>
                    <td/>
                  </tr>
                 {projectWithFiles.projectFiles.map((file) => (
                     <FileTr file={file} key={file.name}/>
                ))}
                  </React.Fragment>
              ))}
              {filesWithoutProject.map((file) => (
                  <FileTr file={file} key={file.name}/>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SurveysViewer;
