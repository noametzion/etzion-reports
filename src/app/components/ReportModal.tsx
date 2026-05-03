"use client";

import React from 'react';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyName: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, surveyName }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Anomaly Report for {surveyName}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
