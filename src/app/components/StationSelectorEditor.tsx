"use client";

import React, { useState } from 'react';
import styles from './StationSelectorEditor.module.css';

export interface StationOption {
  station: number;
  label: string;
}

export interface StationSelectorEditorProps {
  options: StationOption[];
  onSelect: (station: number) => void;
  onCancel: () => void;
  // Optional: enables manual entry validated against all measured stations
  allMeasuredStations?: Map<number, { vOn: number; vOff: number }>;
  stationDiff?: number;
}

const StationSelectorEditor: React.FC<StationSelectorEditorProps> = ({
  options, onSelect, onCancel, allMeasuredStations, stationDiff,
}) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualVal, setManualVal] = useState('');

  const allStationKeys = allMeasuredStations ? [...allMeasuredStations.keys()] : [];
  const minStation = allStationKeys.length ? Math.min(...allStationKeys) : undefined;
  const maxStation = allStationKeys.length ? Math.max(...allStationKeys) : undefined;

  const manualNum = Number(manualVal);
  const isValidManual = manualVal !== '' && !isNaN(manualNum) &&
    (allMeasuredStations ? allMeasuredStations.has(manualNum) : false);

  const showManual = !!allMeasuredStations;

  const handleManualSave = () => {
    if (!isValidManual) return;
    onSelect(manualNum);
  };

  return (
    <div className={styles.editor}>
      <div
        className={styles.list}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        autoFocus
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {options.map(o => (
          <button
            key={o.station}
            type="button"
            className={styles.listItem}
            title={o.label}
            onMouseDown={e => e.preventDefault()}
            onClick={() => onSelect(o.station)}
          >
            {o.label}
          </button>
        ))}
        {showManual && (
          <button
            type="button"
            className={styles.listItem}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowManualInput(s => !s)}
          >
            Manual…
          </button>
        )}
      </div>
      {showManualInput && (
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
            type="button"
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
