"use client";

import React, { useState } from 'react';
import styles from './DCVGCellEditor.module.css';
import { DCVGValue, DCVGValueSource } from '@/app/types/report';
import { DCVGCandidate } from '@/app/hooks/useAnomalyReport';

const MANUAL_KEY = '__manual__';

function isCalcSource(source: string) { return source.startsWith('calculated'); }

export interface DCVGCellEditorProps {
  candidates: DCVGCandidate[];
  currentValue: DCVGValue;
  onSave: (value: DCVGValue) => void;
  onCancel: () => void;
}

const DCVGCellEditor: React.FC<DCVGCellEditorProps> = ({ candidates, currentValue, onSave, onCancel }) => {
  const initKey = candidates.findIndex(c => c.value === currentValue.value);
  const [selectedKey, setSelectedKey] = useState(initKey >= 0 ? String(initKey) : MANUAL_KEY);
  const [manualVal, setManualVal] = useState(initKey < 0 ? String(currentValue.value) : '');

  const commitCandidate = (key: string) => {
    if (key === MANUAL_KEY) return;
    const c = candidates[Number(key)];
    onSave({ value: c.value, source: (isCalcSource(c.source) ? 'Calculated' : 'Side Drain') as DCVGValueSource });
  };

  return (
    <div className={styles.cellEditor}>
      <select
        className={styles.cellEditorSelect}
        size={Math.min(candidates.length + 1, 7)}
        value={selectedKey}
        autoFocus
        onChange={e => { setSelectedKey(e.target.value); commitCandidate(e.target.value); }}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {candidates.map((c, i) => {
          const label = `${c.value} (${c.source})`;
          return <option key={i} value={String(i)} title={label}>{label}</option>;
        })}
        <option value={MANUAL_KEY}>Manual…</option>
      </select>
      {selectedKey === MANUAL_KEY && (
        <input
          type="number"
          className={styles.cellEditorInput}
          value={manualVal}
          autoFocus
          onChange={e => setManualVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isNaN(Number(manualVal))) {
              onSave({ value: Number(manualVal), source: 'Calculated' as DCVGValueSource });
            } else if (e.key === 'Escape') onCancel();
          }}
        />
      )}
    </div>
  );
};

export default DCVGCellEditor;
