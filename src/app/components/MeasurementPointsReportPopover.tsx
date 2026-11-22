"use client";

import React, { useEffect, useState } from 'react';
import popoverStyles from './ProjectReportPopover.module.css';
import styles from './MeasurementPointsReportPopover.module.css';
import { FaTimes, FaFileExcel, FaEye, FaEyeSlash, FaPencilAlt } from 'react-icons/fa';
import { DBProject } from '@/app/types/dbTypes';
import { useReportsInformation } from '@/app/hooks/useReportsInformation';
import { getSurveyDisplayName } from '@/app/utils/surveyNameUtils';
import { useMeasurementPointsReport } from '@/app/hooks/useMeasurementPointsReport';

interface MeasurementPointsReportPopoverProps {
  onClose: () => void;
  top: number;
  left: number;
  project: DBProject;
}

const MeasurementPointsReportPopover: React.FC<MeasurementPointsReportPopoverProps> = ({ onClose, top, left, project }) => {
  const { reportsInformation } = useReportsInformation();
  const { report, calculateMeasurementPointsReport, toggleMeasurementPoint, editMeasurementPointName } = useMeasurementPointsReport();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<{ fileName: string; idx: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    void calculateMeasurementPointsReport(project);
  }, [project, calculateMeasurementPointsReport]);

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
      const fileReport = report?.fileReport.find(f => f.fileName === file.name);
      const expanded = expandedFiles.has(file.name);
      return { file, displayName, fileReport, expanded };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const isCalculating = report?.isCalculating ?? true;
  const loadingText = `Calculating… (${report?.filesProcessed ?? 0}/${report?.fileCount ?? project.projectFiles.length})`;

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
          {sortedFiles.map(({ file, displayName, fileReport, expanded }) => (
            <React.Fragment key={file.name}>
              <tr>
                <td>{file.name}</td>
                <td>{displayName}</td>
                <td>
                  {report?.error
                    ? '—'
                    : isCalculating && !fileReport
                    ? loadingText
                    : fileReport !== undefined
                    ? (
                      <span className={styles.countCell}>
                        {fileReport.measurementPointCount}
                        {expanded
                          ? <FaEyeSlash className={styles.eyeIcon} onClick={() => toggleExpand(file.name)} />
                          : <FaEye className={styles.eyeIcon} onClick={() => toggleExpand(file.name)} />
                        }
                      </span>
                    )
                    : '—'}
                </td>
              </tr>
              {expanded && fileReport && (
                <tr>
                  <td colSpan={3} className={styles.expandedCell}>
                    <div className={styles.expandedList}>
                      <table className={styles.expandedTable}>
                        <thead>
                          <tr>
                            <th>Station</th>
                            <th>DCP/Feature/Anomaly</th>
                            <th>Measurement Point Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileReport.points.map((point, idx) => (
                            <tr
                              key={idx}
                              className={
                                point.isSelected
                                  ? styles.mpRowSelected
                                  : point.isSuggested
                                  ? styles.mpRowSuggested
                                  : styles.mpRowUnselected
                              }
                              onClick={() => toggleMeasurementPoint(file.name, idx)}
                            >
                              <td>
                                {point.stationNo}
                                {point.isSuggested && <span className={styles.suggestedMark}>*</span>}
                              </td>
                              <td>{point.anomalyText}</td>
                              <td>
                                {editingKey?.fileName === file.name && editingKey.idx === idx ? (
                                  <input
                                    autoFocus
                                    className={styles.nameInput}
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    onBlur={() => {
                                      editMeasurementPointName(file.name, idx, editingValue);
                                      setEditingKey(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') { editMeasurementPointName(file.name, idx, editingValue); setEditingKey(null); }
                                      if (e.key === 'Escape') setEditingKey(null);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className={styles.nameCell}>
                                    <span>{point.editedName ?? point.comment}</span>
                                    <FaPencilAlt
                                      className={styles.editIcon}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setEditingKey({ fileName: file.name, idx });
                                        setEditingValue(point.editedName ?? point.comment);
                                      }}
                                    />
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
