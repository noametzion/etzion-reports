"use client";

import React, { useState } from 'react';
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
  const [irThreshold, setIrThreshold] = useState(35);
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
        <div className={styles.toolbar}>
          <label className={styles.toolbarLabel}>
            %IR Threshold
            <span className={styles.inputWithSuffix}>
              <input
                type="number"
                min={0}
                max={100}
                value={irThreshold}
                onChange={e => setIrThreshold(Number(e.target.value))}
                className={styles.thresholdInput}
              />
              <span className={styles.inputSuffix}>%</span>
            </span>
          </label>
        </div>
        <AnomalyTable anomalies={anomalies.anomalies} irThreshold={irThreshold} />
      </div>
    </div>
  );
};

export default ReportModal;
