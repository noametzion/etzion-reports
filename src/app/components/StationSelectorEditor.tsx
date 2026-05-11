"use client";

import React, { useState } from 'react';
import styles from './StationSelectorEditor.module.css';

const MANUAL_KEY = '__manual__';

export interface StationOption {
  station: number;
  label: string;
}

export interface StationSelectorEditorProps {
  options: StationOption[];
  currentStation?: number;
  onSelect: (station: number) => void;
  onCancel: () => void;
  // Optional: enables manual entry validated against all measured stations
  allMeasuredStations?: Map<number, { vOn: number; vOff: number }>;
  stationDiff?: number;
}

const StationSelectorEditor: React.FC<StationSelectorEditorProps> = ({
  options, currentStation, onSelect, onCancel, allMeasuredStations, stationDiff,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    currentStation !== undefined ? String(currentStation) : ''
  );
  const [manualVal, setManualVal] = useState('');

  const allStationKeys = allMeasuredStations ? [...allMeasuredStations.keys()] : [];
  const minStation = allStationKeys.length ? Math.min(...allStationKeys) : undefined;
  const maxStation = allStationKeys.length ? Math.max(...allStationKeys) : undefined;

  const manualNum = Number(manualVal);
  const isValidManual = manualVal !== '' && !isNaN(manualNum) &&
    (allMeasuredStations ? allMeasuredStations.has(manualNum) : false);

  const showManual = !!allMeasuredStations;
  const selectSize = Math.min(options.length + (showManual ? 1 : 0), 8);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedKey(val);
    if (val === MANUAL_KEY) return;
    onSelect(Number(val));
  };

  const handleManualSave = () => {
    if (!isValidManual) return;
    onSelect(manualNum);
  };

  return (
    <div className={styles.editor}>
      <select
        className={styles.select}
        size={Math.max(selectSize, 1)}
        value={selectedKey}
        autoFocus
        onChange={handleSelectChange}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {options.map(o => (
          <option key={o.station} value={String(o.station)} title={o.label}>{o.label}</option>
        ))}
        {showManual && <option value={MANUAL_KEY}>Manual…</option>}
      </select>
      {showManual && selectedKey === MANUAL_KEY && (
        <div className={styles.row}>
          <input
            type="number"
            className={`${styles.input} ${manualVal !== '' && !isValidManual ? styles.inputError : ''}`}
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
            className={styles.saveBtn}
            disabled={!isValidManual}
            onClick={handleManualSave}
          >✓</button>
        </div>
      )}
    </div>
  );
};

export default StationSelectorEditor;
