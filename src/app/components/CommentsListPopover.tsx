"use client";

import React, { useMemo } from 'react';
import styles from './CommentsListPopover.module.css';
import { EditedSurveyDataRow, SurveyStationKey, SurveyCommentKey, SurveyAnomalyKey } from '@/app/types/survey';

interface CommentsListPopoverProps {
  surveyData: EditedSurveyDataRow[];
  anchorTop: number;
  anchorRight: number;
  onClose: () => void;
}

const CommentsListPopover: React.FC<CommentsListPopoverProps> = ({ surveyData, anchorTop, anchorRight, onClose }) => {
  const rows = useMemo(() =>
    surveyData.filter(row => {
      const comment = row[SurveyCommentKey]?.toString().trim();
      const anomaly = row[SurveyAnomalyKey]?.toString().trim();
      return comment || anomaly;
    }),
    [surveyData]
  );

  return (
    <div
      className={styles.popover}
      style={{ top: anchorTop, right: anchorRight }}
    >
      <div className={styles.header}>
        <span className={styles.title}>Comments</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: 80 }}>Station</th>
              <th className={styles.th}>Comment</th>
              <th className={styles.th}>Anomaly</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className={styles.empty}>No comments found.</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className={styles.row}>
                <td className={styles.td}>{row[SurveyStationKey]}</td>
                <td className={styles.td}>{row[SurveyCommentKey] ?? ''}</td>
                <td className={styles.td}>{row[SurveyAnomalyKey] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommentsListPopover;
