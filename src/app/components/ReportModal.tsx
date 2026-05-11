"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import styles from './ReportModal.module.css';
import { EditedSurvey, SurveyStationKey } from '@/app/types/survey';
import { DCVGValue, StrengthPoint } from '@/app/types/report';
import { useAnomalyReport, SuggestedAnomaly } from '@/app/hooks/useAnomalyReport';
import AnomalyTable from './AnomalyTable';
import StationSelectorEditor from './StationSelectorEditor';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyName: string;
  editedSurvey: EditedSurvey | null;
  stationDiff: number;
}

type AnomalyOverride = { dcvgValue?: DCVGValue; strengthPoint1?: StrengthPoint; strengthPoint2?: StrengthPoint };

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, surveyName, editedSurvey, stationDiff }) => {
  const [irThreshold, setIrThreshold] = useState(35);
  const [overrides, setOverrides] = useState<Map<number, AnomalyOverride>>(new Map());
  const [userAddedAnomalyStations, setUserAddedAnomalyStations] = useState<number[]>([]);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const addBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOverrides(new Map());
    setUserAddedAnomalyStations([]);
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

  const { report, dcvgCandidates, strengthPointsCandidates, suggestedAnomalies } = useAnomalyReport(
    editedSurvey?.surveyData ?? [],
    editedSurvey?.DCPData ?? [],
    stationDiff,
    userAddedAnomalyStations
  );

  const editedAnomalies = useMemo(() => {
    return report.anomalies.map((a, idx) => {
      const override = overrides.get(idx);
      if (!override) return a;
      return {
        ...a,
        dcvgValue: override.dcvgValue ?? a.dcvgValue,
        strengthPoint1: override.strengthPoint1 ?? a.strengthPoint1,
        strengthPoint2: override.strengthPoint2 ?? a.strengthPoint2,
      };
    });
  }, [report.anomalies, overrides]);

  const handleEditDcvg = useCallback((rowIdx: number, value: DCVGValue) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(rowIdx, { ...prev.get(rowIdx), dcvgValue: value });
      return next;
    });
  }, []);

  const handleEditStrengthPoint1 = useCallback((rowIdx: number, sp: StrengthPoint) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(rowIdx, { ...prev.get(rowIdx), strengthPoint1: sp });
      return next;
    });
  }, []);

  const handleEditStrengthPoint2 = useCallback((rowIdx: number, sp: StrengthPoint) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(rowIdx, { ...prev.get(rowIdx), strengthPoint2: sp });
      return next;
    });
  }, []);

  const handleAddAnomaly = useCallback((station: number) => {
    setUserAddedAnomalyStations(prev => [...prev, station]);
    setShowAddSelector(false);
  }, []);

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
                onClick={() => setShowAddSelector(s => !s)}
                title="Add suggested anomaly"
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
        <AnomalyTable
          anomalies={editedAnomalies}
          stationDiff={stationDiff}
          irThreshold={irThreshold}
          strengthPointsCandidates={strengthPointsCandidates}
          allMeasuredStations={allMeasuredStations}
          dcvgCandidates={dcvgCandidates}
          onEditDcvg={handleEditDcvg}
          onEditStrengthPoint1={handleEditStrengthPoint1}
          onEditStrengthPoint2={handleEditStrengthPoint2}
        />
      </div>
    </div>
  );
};

export default ReportModal;
