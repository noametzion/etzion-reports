"use client";

import React, { useState } from 'react';
import styles from './ProjectReportPopover.module.css';
import { FaTimes, FaFileExcel } from 'react-icons/fa';
import { DBProject } from '@/app/types/dbTypes';
import { useReportsInformation } from '@/app/hooks/useReportsInformation';
import { useAnomalyReports } from '@/app/hooks/useAnomalyReports';
import { useProjectAnomalyReportExporter } from '@/app/hooks/useProjectAnomalyReportExporter';
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
  const { exportProjectAnomalyReport, isExporting } = useProjectAnomalyReportExporter();
  const [irThreshold, setIrThreshold] = useState(35);

  const sortedFiles = [...project.projectFiles]
    .map(file => {
      const reportInfo = reportsInformation.find(r => r.survey?.name === file.name);
      const displayName = getSurveyDisplayName(reportInfo?.projectName, file.name) ?? file.name;
      const hasAnomalyReport = anomalyReports.some(r => r.originalSurveyFile?.name === file.name);
      return { file, displayName, hasAnomalyReport };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left + 8}px` }}>
      <div className={styles.header}>
        <h4>Project Anomaly Report — {project.projectName}</h4>
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
          {sortedFiles.map(({ file, displayName, hasAnomalyReport }) => (
            <tr key={file.name}>
              <td>{file.name}</td>
              <td>{displayName}.xlsx</td>
              <td>
                  { hasAnomalyReport && <span className={styles.approvedTag}>✓ Approved</span> }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.toolbar}>
        <label className={styles.thresholdLabel}>
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
        <button
          className={styles.exportBtn}
          disabled={isExporting}
          onClick={() => exportProjectAnomalyReport(project, anomalyReports, reportsInformation, irThreshold)}
        >
          <FaFileExcel />
          {isExporting ? 'Exporting…' : 'Export Report'}
        </button>
      </div>
    </div>
  );
};

export default ProjectReportPopover;
