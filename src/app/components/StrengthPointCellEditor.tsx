"use client";

import React, { useState } from 'react';
import styles from './StrengthPointCellEditor.module.css';
import { StrengthPoint } from '@/app/types/report';
import { StrengthPointCandidate } from '@/app/hooks/useAnomalyReport';

const SP_MANUAL_KEY = '__sp_manual__';

export interface StrengthPointCellEditorProps {
  candidates: StrengthPointCandidate[];
  allMeasuredStations?: Map<number, { vOn: number; vOff: number }>;
  stationDiff?: number;
  currentSp: StrengthPoint | undefined;
  onSave: (sp: StrengthPoint) => void;
  onCancel: () => void;
}

const StrengthPointCellEditor: React.FC<StrengthPointCellEditorProps> = ({
  candidates, allMeasuredStations, stationDiff, currentSp, onSave, onCancel,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    currentSp ? String(currentSp.station) : ''
  );
  const [manualVal, setManualVal] = useState('');

  const allStationKeys = allMeasuredStations ? [...allMeasuredStations.keys()] : [];
  const minStation = allStationKeys.length ? Math.min(...allStationKeys) : undefined;
  const maxStation = allStationKeys.length ? Math.max(...allStationKeys) : undefined;
  const candidateByStation = new Map(candidates.map(c => [c.value, c]));

  const buildSp = (station: number): StrengthPoint | null => {
    const c = candidateByStation.get(station);
    if (c) return { station: c.value, vOn: c.vOn, vOff: c.vOff };
    const v = allMeasuredStations?.get(station);
    return v ? { station, vOn: v.vOn, vOff: v.vOff } : null;
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedKey(val);
    if (val === SP_MANUAL_KEY) return;
    const sp = buildSp(Number(val));
    if (sp) onSave(sp);
  };

  const manualNum = Number(manualVal);
  const isValidManual = manualVal !== '' && !isNaN(manualNum) &&
    (allMeasuredStations ? allMeasuredStations.has(manualNum) : candidateByStation.has(manualNum));

  const handleManualSave = () => {
    if (!isValidManual) return;
    const sp = buildSp(manualNum);
    if (sp) onSave(sp);
  };

  return (
    <div className={styles.cellEditor}>
      <select
        className={styles.cellEditorSelect}
        size={Math.min(candidates.length + 1, 8)}
        value={selectedKey}
        autoFocus
        onChange={handleSelectChange}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {candidates.map(c => {
          const label = `${c.value} - ${c.source}`;
          return <option key={c.value} value={String(c.value)} title={label}>{label}</option>;
        })}
        <option value={SP_MANUAL_KEY}>Manual…</option>
      </select>
      {selectedKey === SP_MANUAL_KEY && (
        <div className={styles.cellEditorRow}>
          <input
            type="number"
            className={`${styles.cellEditorInput} ${manualVal !== '' && !isValidManual ? styles.cellEditorInputError : ''}`}
            value={manualVal}
            min={minStation}
            max={maxStation}
            step={stationDiff ?? 1}
            autoFocus
            onChange={e => setManualVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { handleManualSave(); return; }
              if (e.key === 'Escape') { onCancel(); return; }
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const step = stationDiff ?? 1;
                const cur = manualVal !== '' ? Number(manualVal) : (minStation ?? 0);
                const next = e.key === 'ArrowUp' ? cur + step : cur - step;
                if (minStation !== undefined && next < minStation) return;
                if (maxStation !== undefined && next > maxStation) return;
                setManualVal(String(next));
              }
            }}
          />
          <button
            className={styles.cellEditorSaveBtn}
            disabled={!isValidManual}
            onClick={handleManualSave}
          >✓</button>
        </div>
      )}
    </div>
  );
};

export default StrengthPointCellEditor;
