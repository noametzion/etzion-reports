"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './ProjectSummaryPopover.module.css';
import {FaInfoCircle, FaTimes} from "react-icons/fa";
import {DBProject} from "@/app/types/dbTypes";
import {useProjectSummary} from "@/app/hooks/useProjectSummary";


interface ProjectSummaryPopoverProps {
  onClose: () => void;
  top: number;
  left: number;
  project: DBProject;
  fileCount: number;
}

const ProjectSummaryPopover: React.FC<ProjectSummaryPopoverProps> = ({
  onClose,
  top,
  left,
  project,
  fileCount,
}) => {
  const { summary, calculateProjectSummary } = useProjectSummary();
  const [thresholdMeters, setThresholdMeters] = useState(35);
  const [showGpsDistTooltip, setShowGpsDistTooltip] = useState(false);
  const [showExtendedGpsDistTooltip, setShowExtendedGpsDistTooltip] = useState(false);
  const [showStationNoTooltip, setShowStationNoTooltip] = useState(false);
  const [showStationDistCalcTooltip, setShowStationDistCalcTooltip] = useState(false);
  const summaryTooltipAreaRef = useRef<HTMLDivElement | null>(null);
  const loadingProgress = `Calculating... (${summary?.filesProcessed ?? 0}/${summary?.fileCount ?? fileCount})`;

  const gpsDistValue = summary?.isCalculating
    ? loadingProgress
    : summary?.error
      ? summary.error
      : `${summary?.totalGpsDist.toFixed(3)} km`;

  const extendedGpsDistValue = summary?.isCalculating
    ? loadingProgress
    : summary?.error
      ? summary.error
      : `${summary?.totalExtendedGpsDist.toFixed(3)} km`;

  const stationNoValue = summary?.isCalculating
    ? loadingProgress
    : summary?.error
      ? summary.error
      : `${summary?.totalStationNo.toFixed(2)} m`;

  const stationDistCalcValue = summary?.isCalculating
    ? loadingProgress
    : summary?.error
      ? summary.error
      : `${summary?.totalStationDistCalc.toFixed(2)} m`;

  useEffect(() => {
    void calculateProjectSummary(project, thresholdMeters);
  }, [project, calculateProjectSummary, thresholdMeters]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!summaryTooltipAreaRef.current?.contains(event.target as Node)) {
        setShowGpsDistTooltip(false);
        setShowExtendedGpsDistTooltip(false);
        setShowStationNoTooltip(false);
        setShowStationDistCalcTooltip(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left + 8}px` }}>
      <div className={styles.header}>
        <h4>Project Summary - {project.projectName} [{fileCount} files]</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <div className={styles.summaryContent} ref={summaryTooltipAreaRef}>
          <div className={`${styles.summaryRow} ${styles.summaryRowInline}`}>
            <div className={styles.summaryField}>
              <div className={styles.summaryLabelWithInfoButton}>
                <strong>Station No:</strong>
                <button
                  type="button"
                  className={styles.summaryInfoButton}
                  onClick={() => {
                    setShowStationNoTooltip(prev => {
                      const next = !prev;
                      if (next) {
                        setShowGpsDistTooltip(false);
                        setShowExtendedGpsDistTooltip(false);
                        setShowStationDistCalcTooltip(false);
                      }
                      return next;
                    });
                  }}
                >
                  <FaInfoCircle />
                </button>
                {showStationNoTooltip && (
                  <div className={styles.summaryInfoTooltip}>
                    <div>Max station number from each file, then summed.</div>
                    {summary?.fileSummary.map((fileSummary) => (
                      <div key={fileSummary.fileName} className={styles.summaryInfoRow}>
                        <span>{fileSummary.fileName}</span>
                        <span>{fileSummary.stationNo.toFixed(2)} m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className={summary?.error ? styles.summaryErrorText : undefined}>{stationNoValue}</span>
            </div>
            <div className={styles.summaryField}>
              <div className={styles.summaryLabelWithInfoButton}>
                <strong>Station dist calc:</strong>
                <button
                  type="button"
                  className={styles.summaryInfoButton}
                  onClick={() => {
                    setShowStationDistCalcTooltip(prev => {
                      const next = !prev;
                      if (next) {
                        setShowGpsDistTooltip(false);
                        setShowExtendedGpsDistTooltip(false);
                        setShowStationNoTooltip(false);
                      }
                      return next;
                    });
                  }}
                >
                  <FaInfoCircle />
                </button>
                {showStationDistCalcTooltip && (
                  <div className={styles.summaryInfoTooltip}>
                    <div>Calculated as station no x dist per reading for each file.</div>
                    {summary?.fileSummary.map((fileSummary) => (
                      <div key={fileSummary.fileName} className={styles.summaryInfoRow}>
                        <span>{fileSummary.fileName}</span>
                        <span>{fileSummary.stationNo.toFixed(2)} x {fileSummary.distPerReading.toFixed(2)} = {fileSummary.stationDistCalc.toFixed(2)} m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className={summary?.error ? styles.summaryErrorText : undefined}>{stationDistCalcValue}</span>
            </div>
            <div className={styles.summaryField}>
              <strong>Dist per reading:</strong>
              {summary?.isCalculating ? (
                  <span>Calculating...</span>
              ) : summary?.error ? (
                  <span className={styles.summaryErrorText}>{summary.error}</span>
              ) : (
                  <span>[{summary?.distPerReadingValues.join(" ,")}] m</span>
              )}
            </div>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryRowInline}`}>
            {/*both gps dist calculations ignore distance between 2 points which is above the threshold*/}
            {/*the difference is that the extended also calculate skips smaller than the threshold*/}
            <div className={styles.summaryField}>
              <div className={styles.summaryLabelWithInfoButton}>
                <strong>GPS dist:</strong>
                <button
                  type="button"
                  className={styles.summaryInfoButton}
                  onClick={() => {
                    setShowGpsDistTooltip(prev => {
                      const next = !prev;
                      if (next) {
                        setShowExtendedGpsDistTooltip(false);
                        setShowStationNoTooltip(false);
                        setShowStationDistCalcTooltip(false);
                      }
                      return next;
                    });
                  }}
                >
                  <FaInfoCircle />
                </button>
                {showGpsDistTooltip && (
                  <div className={styles.summaryInfoTooltip}>
                    <div>Summarize only segments distance.</div>
                    {summary?.fileSummary.map((fileSummary) => (
                      <div key={fileSummary.fileName} className={styles.summaryInfoRow}>
                        <span>{fileSummary.fileName}</span>
                        <span>{fileSummary.gpsDist.toFixed(3)} km</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className={summary?.error ? styles.summaryErrorText : undefined}>{gpsDistValue}</span>
            </div>
            <div className={styles.summaryField}>
              <div className={styles.summaryLabelWithInfoButton}>
                <strong>Extended GPS dist:</strong>
                <button
                  type="button"
                  className={styles.summaryInfoButton}
                  onClick={() => {
                    setShowExtendedGpsDistTooltip(prev => {
                      const next = !prev;
                      if (next) {
                        setShowGpsDistTooltip(false);
                        setShowStationNoTooltip(false);
                        setShowStationDistCalcTooltip(false);
                      }
                      return next;
                    });
                  }}
                >
                  <FaInfoCircle />
                </button>
                {showExtendedGpsDistTooltip && (
                  <div className={styles.summaryInfoTooltip}>
                    <div>Summarize segments distance + small skips.</div>
                    <div>*Skips above {summary?.gpsThreshold ?? thresholdMeters} m are still ignored.</div>
                    {summary?.fileSummary.map((fileSummary) => (
                      <div key={fileSummary.fileName} className={styles.summaryInfoRow}>
                        <span>{fileSummary.fileName}</span>
                        <span>{fileSummary.extendedGpsDist.toFixed(3)} km</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className={summary?.error ? styles.summaryErrorText : undefined}>{extendedGpsDistValue}</span>
            </div>
            <div className={styles.summaryField}>
              <strong>GPS Threshold:</strong>
              <div className={styles.gpsThresholdInputWrap}>
                <input
                    type="number"
                    min={0}
                    step={1}
                    value={thresholdMeters}
                    onChange={(e) => setThresholdMeters(Number(e.target.value) || 0)}
                    className={styles.gpsThresholdInput}
                />
                <span className={styles.gpsThresholdSuffix}>m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryPopover;
