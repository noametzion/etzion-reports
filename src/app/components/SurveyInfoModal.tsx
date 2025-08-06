"use client";

import React from 'react';
import styles from './SurveyInfoModal.module.css';
import {SurveyInfo} from "@/app/types/survey";

interface SurveyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyInfo: SurveyInfo;
  surveyName: string;
}

const SurveyInfoModal: React.FC<SurveyInfoModalProps> = ({
  isOpen,
  onClose,
  surveyInfo,
  surveyName,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{`Survey Information - ${surveyName}`}</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.content}>
          {Object.entries(surveyInfo).map(([key, value]) => (
              <div key={key} className={styles.infoRow}>
                <strong className={styles.infoKey}>{key}:</strong>
                <span className={styles.infoValue}>{String(value)}</span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SurveyInfoModal;
