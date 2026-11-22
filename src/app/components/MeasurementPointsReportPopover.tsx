"use client";

import React, { useEffect, useState } from 'react';
import popoverStyles from './ProjectReportPopover.module.css';
import styles from './MeasurementPointsReportPopover.module.css';
import { FaTimes, FaFileExcel, FaEye, FaEyeSlash } from 'react-icons/fa';
import { DBProject } from '@/app/types/dbTypes';
import { useReportsInformation } from '@/app/hooks/useReportsInformation';
import { getSurveyDisplayName } from '@/app/utils/surveyNameUtils';
import { useMeasurementPointsSummary } from '@/app/hooks/useMeasurementPointsSummary';

interface MeasurementPointsReportPopoverProps {
  onClose: () => void;
  top: number;
  left: number;
  project: DBProject;
}

const MeasurementPointsReportPopover: React.FC<MeasurementPointsReportPopoverProps> = ({ onClose, top, left, project }) => {
  const { reportsInformation } = useReportsInformation();
  const { summary, calculateMeasurementPointsSummary, toggleMeasurementPoint } = useMeasurementPointsSummary();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    void calculateMeasurementPointsSummary(project);
  }, [project, calculateMeasurementPointsSummary]);

  const toggleExpand = (fileName: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      next.has(fileName) ? next.delete(fileName) : next.add(fileName);
      return next;
    });
  };

  const sortedFiles = [...project.projectFiles]
    .map(file => {
      const reportInfo = reportsInformation.find(r => r.survey?.name === file.name);
      const displayName = getSurveyDisplayName(reportInfo?.projectName, file.name) ?? file.name;
      const fileSummary = summary?.fileSummary.find(f => f.fileName === file.name);
      const expanded = expandedFiles.has(file.name);
      return { file, displayName, fileSummary, expanded };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const isCalculating = summary?.isCalculating ?? true;
  const loadingText = `Calculating… (${summary?.filesProcessed ?? 0}/${summary?.fileCount ?? project.projectFiles.length})`;

  return (
    <div className={popoverStyles.popover} style={{ top: `${top}px`, left: `${left + 8}px` }}>
      <div className={popoverStyles.header}>
        <h4>Measurement Points Report — {project.projectName}</h4>
        <button onClick={onClose} className={popoverStyles.closeButton}><FaTimes /></button>
      </div>
      <table className={popoverStyles.table}>
        <thead>
          <tr>
            <th>Original File</th>
            <th>Edited File Name</th>
            <th>Measurement Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map(({ file, displayName, fileSummary, expanded }) => (
            <React.Fragment key={file.name}>
              <tr>
                <td>{file.name}</td>
                <td>{displayName}</td>
                <td>
                  {summary?.error
                    ? '—'
                    : isCalculating && !fileSummary
                    ? loadingText
                    : fileSummary !== undefined
                    ? (
                      <span className={styles.countCell}>
                        {fileSummary.measurementPointCount}
                        {expanded
                          ? <FaEyeSlash className={styles.eyeIcon} onClick={() => toggleExpand(file.name)} />
                          : <FaEye className={styles.eyeIcon} onClick={() => toggleExpand(file.name)} />
                        }
                      </span>
                    )
                    : '—'}
                </td>
              </tr>
              {expanded && fileSummary && (
                <tr>
                  <td colSpan={3} className={styles.expandedCell}>
                    <div className={styles.expandedList}>
                      {fileSummary.rows.map((row, idx) => (
                        <div
                          key={idx}
                          className={`${styles.mpRow} ${row.isSelected ? styles.mpRowSelected : styles.mpRowUnselected}`}
                          onClick={() => toggleMeasurementPoint(file.name, idx)}
                        >
                          <span>{row.stationNo}</span>
                          <span>-</span>
                          <span>{row.anomalyText}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className={popoverStyles.toolbar}>
        <span />
        <button className={popoverStyles.exportBtn} disabled>
          <FaFileExcel />
          Export Report
        </button>
      </div>
    </div>
  );
};

export default MeasurementPointsReportPopover;
