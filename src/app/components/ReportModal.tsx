"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import styles from './ReportModal.module.css';
import { EditedSurvey, SurveyFile, SurveyStationKey } from '@/app/types/survey';
import { DCVGValue, StrengthPoint } from '@/app/types/report';
import { useAnomalyReportCreator, SuggestedAnomaly } from '@/app/hooks/useAnomalyReportCreator';
import { useAnomalyReport } from '@/app/hooks/useAnomalyReport';
import AnomalyTable from './AnomalyTable';
import StationSelectorEditor from './StationSelectorEditor';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyName: string;
  originalSurveyFile?: SurveyFile | null;
  editedSurvey: EditedSurvey | null;
  stationDiff: number;
}

type AnomalyOverride = { dcvgValue?: DCVGValue; strengthPoint1?: StrengthPoint; strengthPoint2?: StrengthPoint };

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, surveyName, originalSurveyFile, editedSurvey, stationDiff }) => {
  const [irThreshold, setIrThreshold] = useState(35);
  const [overrides, setOverrides] = useState<Map<number, AnomalyOverride>>(new Map());
  const [userAddedAnomalyStations, setUserAddedAnomalyStations] = useState<Set<number>>(new Set());
  const [showAddSelector, setShowAddSelector] = useState(false);
  const addBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOverrides(new Map());
    setUserAddedAnomalyStations(new Set());
  }, [editedSurvey]);

  useEffect(() => {
    if (!showAddSelector) return;
    const close = (e: MouseEvent) => {
      if (addBtnRef.current?.contains(e.target as Node)) return;
      setShowAddSelector(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showAddSelector]);

  const allMeasuredStations = useMemo(() => {
    const map = new Map<number, { vOn: number; vOff: number }>();
    for (const row of editedSurvey?.surveyData ?? []) {
      const station = Number(row[SurveyStationKey]);
      const vOn = (row['On Voltage'] as number | undefined) ?? 0;
      const vOff = (row['Off Voltage'] as number | undefined) ?? 0;
      if ((vOn !== 0 || vOff !== 0) && !map.has(station)) {
        map.set(station, { vOn, vOff });
      }
    }
    return map;
  }, [editedSurvey]);

  const { report, dcvgCandidates, strengthPointsCandidates, suggestedAnomalies } = useAnomalyReportCreator(
    editedSurvey?.surveyData ?? [],
    editedSurvey?.DCPData ?? [],
    stationDiff,
    userAddedAnomalyStations
  );
  const { anomalyReport, saveAnomalyReport, deleteAnomalyReport, isSaving } = useAnomalyReport(originalSurveyFile);

  const baseAnomalies = anomalyReport?.anomalyReport.anomalies ?? report.anomalies;

  const editedAnomalies = useMemo(() => {
    return baseAnomalies.map((a) => {
      const override = overrides.get(a.station);
      if (!override) return a;
      return {
        ...a,
        dcvgValue: override.dcvgValue ?? a.dcvgValue,
        strengthPoint1: override.strengthPoint1 ?? a.strengthPoint1,
        strengthPoint2: override.strengthPoint2 ?? a.strengthPoint2,
      };
    });
  }, [baseAnomalies, overrides]);

  const hasOrphanedStations = useMemo(() => {
    if (!anomalyReport) return false;
    const knownStations = new Set([
      ...report.anomalies.map(a => a.station),
      ...suggestedAnomalies.map(s => s.station),
    ]);
    return anomalyReport.anomalyReport.anomalies.some(a => !knownStations.has(a.station));
  }, [anomalyReport, report.anomalies, suggestedAnomalies]);

  const isValid = useMemo(
    () => editedAnomalies.every(a => a.strengthPoint1 != null && a.strengthPoint2 != null),
    [editedAnomalies]
  );

  const handleEditDcvg = useCallback((station: number, value: DCVGValue) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(station, { ...prev.get(station), dcvgValue: value });
      return next;
    });
  }, []);

  const handleEditStrengthPoint1 = useCallback((station: number, sp: StrengthPoint) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(station, { ...prev.get(station), strengthPoint1: sp });
      return next;
    });
  }, []);

  const handleEditStrengthPoint2 = useCallback((station: number, sp: StrengthPoint) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(station, { ...prev.get(station), strengthPoint2: sp });
      return next;
    });
  }, []);

  const handleAddAnomaly = useCallback((station: number) => {
    setUserAddedAnomalyStations(prev => new Set([...prev, station]));
    setShowAddSelector(false);
  }, []);

  const handleRemoveAnomaly = useCallback((station: number) => {
    setUserAddedAnomalyStations(prev => { const next = new Set(prev); next.delete(station); return next; });
    setOverrides(prev => {
      const next = new Map(prev);
      next.delete(station);
      return next;
    });
  }, []);

  const handleApprove = useCallback(() => {
    if (!anomalyReport) {
      const ok = window.confirm('Once approved, anomalies cannot be added or removed — only values can be edited. Proceed?');
      if (!ok) return;
    }
    saveAnomalyReport({ anomalies: editedAnomalies })?.then((result) => {
      if (result) {
        setOverrides(new Map());
        setUserAddedAnomalyStations(new Set());
      }
    });
  }, [saveAnomalyReport, editedAnomalies, anomalyReport]);

  const addSelectorOptions = suggestedAnomalies.map((s: SuggestedAnomaly) => ({
    station: s.station,
    label: [String(s.station), s.anomalyCol, s.comment].filter(Boolean).join(' - '),
  }));

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Anomaly Report for {surveyName}</h2>
          {anomalyReport && (
            <span className={styles.approvedBadge}>
              ✓ Report Approved
              <FaTrash
                className={styles.deleteReportIcon}
                title="Delete Report"
                onClick={() => { if (window.confirm('Delete the approved report? This cannot be undone.')) deleteAnomalyReport(); }}
              />
            </span>
          )}
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
          {addSelectorOptions.length > 0 && (
            <div ref={addBtnRef} className={styles.addAnomalyWrapper}>
              <button
                className={styles.addAnomalyBtn}
                disabled={!!anomalyReport}
                onClick={anomalyReport ? undefined : () => setShowAddSelector(s => !s)}
                title={anomalyReport
                  ? 'Anomaly report already approved — anomalies cannot be added, just edited'
                  : 'Add suggested anomaly'}
              >
                +
              </button>
              {showAddSelector && (
                <div className={styles.addAnomalyDropdown}>
                  <StationSelectorEditor
                    options={addSelectorOptions}
                    onSelect={handleAddAnomaly}
                    onCancel={() => setShowAddSelector(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {hasOrphanedStations && (
          <div className={styles.stationWarning}>
            <span>⚠ The approved report contains stations that no longer appear in the survey data. The survey may have changed — we recommend deleting this report and re-creating it.</span>
            <button
              className={styles.deleteReportBtn}
              onClick={() => { if (window.confirm('Delete the approved report? This cannot be undone.')) deleteAnomalyReport(); }}
            >
              Delete Report
            </button>
          </div>
        )}
        <AnomalyTable
          anomalies={editedAnomalies}
          stationDiff={stationDiff}
          irThreshold={irThreshold}
          strengthPointsCandidates={strengthPointsCandidates}
          allMeasuredStations={allMeasuredStations}
          dcvgCandidates={dcvgCandidates}
          userAddedStations={userAddedAnomalyStations}
          onEditDcvg={handleEditDcvg}
          onEditStrengthPoint1={handleEditStrengthPoint1}
          onEditStrengthPoint2={handleEditStrengthPoint2}
          onRemoveAnomaly={handleRemoveAnomaly}
        />
        <div className={styles.footer}>
          {isSaving && <span className={styles.savingIndicator}>Saving…</span>}
          <button className={styles.approveBtn} onClick={handleApprove} disabled={!isValid || isSaving}>
            {anomalyReport ? 'Update Report' : 'Approve Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
