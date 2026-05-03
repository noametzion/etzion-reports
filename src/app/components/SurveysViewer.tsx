"use client";

import React, {useMemo, useState} from 'react';
import {FaTrash, FaFolderOpen, FaFileAlt} from 'react-icons/fa';
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
import {DBProject} from "@/app/types/dbTypes";
import LinkToProjectPopover from "@/app/components/LinkToProjectPopover";
import ProjectSummaryPopover from "@/app/components/ProjectSummaryPopover";

interface SurveysViewerProps {
    onSurveySelected: (surveyFile: SurveyFile | null) => void;
    shouldFocus: boolean;
    onShouldFocusDistanceChanges: (shouldFocus: boolean) => void;
    shouldShowMapPoints: boolean;
    onShouldShowMapPointsChanges: (shouldShowPointsOnMap: boolean) => void;
}

interface LinkToProjectPopoverState {
    top: number;
    left: number;
    file: SurveyFile;
    currentSelectedProject?: DBProject;
}

interface ProjectSummaryPopoverState {
    top: number;
    left: number;
    project: DBProject;
    fileCount: number;
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
  const [rescanTrigger, setRescanTrigger] = useState(0);
  const [linkToProjectPopover, setLinkToProjectPopover] = useState<LinkToProjectPopoverState | null>(null);
  const [projectSummaryPopover, setProjectSummaryPopover] = useState<ProjectSummaryPopoverState | null>(null);

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

    const handleLinkToProject = async (e: React.MouseEvent<HTMLButtonElement>, file: SurveyFile, project?: DBProject) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setLinkToProjectPopover({
            file: file,
            currentSelectedProject: project,
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX + rect.width,
        });
    };

  const handleFocusCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
      onShouldFocusDistanceChanges(e.target.checked);
  };

    const handleShowMapPointsCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
        onShouldShowMapPointsChanges(e.target.checked);
    };

  const handleProjectSummary = (e: React.MouseEvent<HTMLButtonElement>, project: DBProject, fileCount: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProjectSummaryPopover({
      project: project,
      fileCount: fileCount,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
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
            onSave={() => { saveEditedSurvey(); setRescanTrigger(t => t + 1); }}
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
            rescanTrigger={rescanTrigger}
            onEdit={editLocally}
        />
      </div>
    );
  }

  const FileTr = ({file, project}: {file: SurveyFile, project?: DBProject}) => {
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
                      onClick={(e) => handleLinkToProject(e, file, project)}
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

  return (<>
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
                    <td>
                      <div className={styles.projectNameContainer}>
                        <span>{projectWithFiles.project.projectName}</span>
                      </div>
                    </td>
                    <td/>
                    <td className={styles.actionsCell}>
                      <div className={styles.projectActionsContainer}>
                        <button
                          onClick={(e) => handleProjectSummary(e, projectWithFiles.project, projectWithFiles.projectFiles.length)}
                          className={styles.projectSummaryButton}
                          title={`View summary for ${projectWithFiles.project.projectName}`}
                        >
                          <FaFileAlt className={styles.summaryIcon} />
                          <span>Summary</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                 {projectWithFiles.projectFiles.map((file) => (
                     <FileTr file={file} project={projectWithFiles.project} key={file.name}/>
                ))}
                  </React.Fragment>
              ))}
              <tr className={styles.separatorRow}><td>No project assigned</td><td/><td/></tr>
              {filesWithoutProject.map((file) => (
                  <FileTr file={file} key={file.name}/>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    {linkToProjectPopover && <LinkToProjectPopover
        onClose={() => setLinkToProjectPopover(null)}
        top={linkToProjectPopover.top}
        left={linkToProjectPopover.left}
        file={linkToProjectPopover.file}
        currentSelectedProject={linkToProjectPopover.currentSelectedProject}
    />}
    {projectSummaryPopover && <ProjectSummaryPopover
        onClose={() => setProjectSummaryPopover(null)}
        top={projectSummaryPopover.top}
        left={projectSummaryPopover.left}
        project={projectSummaryPopover.project}
        fileCount={projectSummaryPopover.fileCount}
    />}
  </>);
};

export default SurveysViewer;
