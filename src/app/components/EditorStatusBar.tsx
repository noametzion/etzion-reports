"use client";

import React from 'react';
import styles from './EditorStatusBar.module.css';
import {FaFile, FaFileExport, FaSave, FaSpinner} from "react-icons/fa";


interface ErrorPanelProps {
  isEditedFileExist: boolean;
  unsavedChangesExists: boolean;
  isUpdating: boolean;
  isExporting: boolean;
  onSave: () => void;
  onExportToExcel: () => void;
}

const EditorStatusBar: React.FC<ErrorPanelProps> = ({
  isEditedFileExist,
  unsavedChangesExists,
  onSave,
  onExportToExcel,
  isUpdating,
  isExporting}) => {

  const spinnerClassName = [
    styles.spinner,
    (isUpdating || isExporting) && styles.updatingSpinner,
  ].filter(Boolean).join(' ');

  const fileIconClassName = [
    styles.fileIcon,
    isEditedFileExist && styles.fileExists,
    isEditedFileExist && unsavedChangesExists && styles.changesExist
  ].filter(Boolean).join(' ');

  const saveClassName = [
    styles.saveIcon,
    unsavedChangesExists && styles.changesExist,
    unsavedChangesExists && styles.saveable
  ].filter(Boolean).join(' ');

  const exportable = isEditedFileExist && !unsavedChangesExists;
  const exportClassName = [
    styles.fileIcon,
    exportable && styles.exportPossible,
    exportable && styles.exporable,
  ].filter(Boolean).join(' ');

  return <div className={styles.statusBar}>
    <FaSpinner className={spinnerClassName} />
    <FaFile className={fileIconClassName}/>
    <FaFileExport className={exportClassName} onClick={onExportToExcel}/>
    <FaSave className={saveClassName} onClick={onSave}/>
  </div>
};

export default EditorStatusBar;
