"use client";

import React from 'react';
import styles from './EditorStatusBar.module.css';
import {FaFile, FaSave, FaSpinner} from "react-icons/fa";


interface ErrorPanelProps {
  isEditedFileExist: boolean;
  unsavedChangesExists: boolean;
  isUpdating: boolean;
  onSave: () => void;
}

const EditorStatusBar: React.FC<ErrorPanelProps> = ({
  isEditedFileExist,
  unsavedChangesExists,
  onSave,
  isUpdating}) => {

  const spinnerClassName = [
    styles.spinner,
    isUpdating && styles.updatingSpinner,
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


  return <div className={styles.statusBar}>
    <FaSpinner className={spinnerClassName} />
    <FaFile className={fileIconClassName}/>
    <FaSave className={saveClassName} onClick={onSave}/>
  </div>
};

export default EditorStatusBar;
