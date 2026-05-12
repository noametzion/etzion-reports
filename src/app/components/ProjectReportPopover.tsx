"use client";

import React from 'react';
import styles from './ProjectReportPopover.module.css';
import { FaTimes } from 'react-icons/fa';
import { DBProject } from '@/app/types/dbTypes';
import { useReportsInformation } from '@/app/hooks/useReportsInformation';
import { useAnomalyReports } from '@/app/hooks/useAnomalyReports';
import { getSurveyDisplayName } from '@/app/utils/surveyNameUtils';

interface ProjectReportPopoverProps {
  onClose: () => void;
  top: number;
  left: number;
  project: DBProject;
}

const ProjectReportPopover: React.FC<ProjectReportPopoverProps> = ({ onClose, top, left, project }) => {
  const { reportsInformation } = useReportsInformation();
  const { anomalyReports } = useAnomalyReports();

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left + 8}px` }}>
      <div className={styles.header}>
        <h4>Project Report — {project.projectName}</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Original File</th>
            <th>Edited File</th>
            <th>Anomaly Report</th>
          </tr>
        </thead>
        <tbody>
          {project.projectFiles.map(file => {
            const reportInfo = reportsInformation.find(r => r.survey?.name === file.name);
            const displayName = getSurveyDisplayName(reportInfo?.projectName, file.name);
            const hasAnomalyReport = anomalyReports.some(r => r.originalSurveyFile?.name === file.name);
            return (
              <tr key={file.name}>
                <td>{file.name}</td>
                <td>{displayName}.xlsx</td>
                <td>
                  {hasAnomalyReport && (
                    <span className={styles.approvedTag}>✓ Approved</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectReportPopover;
