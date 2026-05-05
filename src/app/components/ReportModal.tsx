"use client";

import React from 'react';
import styles from './ReportModal.module.css';
import {EditedSurvey} from '@/app/types/survey';
import {useAnomalyReport} from '@/app/hooks/useAnomalyReport';
import AnomalyTable from './AnomalyTable';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyName: string;
  editedSurvey: EditedSurvey | null;
  stationDiff: number;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, surveyName, editedSurvey, stationDiff }) => {
  const anomalies = useAnomalyReport(
    editedSurvey?.surveyData ?? [],
    editedSurvey?.DCPData ?? [],
    stationDiff
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Anomaly Report for {surveyName}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <AnomalyTable anomalies={anomalies.anomalies} />
      </div>
    </div>
  );
};

export default ReportModal;
