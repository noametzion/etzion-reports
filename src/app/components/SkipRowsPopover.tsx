"use client";

import React, {useState} from 'react';
import styles from './SkipRowsPopover.module.css';
import { FaSave, FaTimes} from 'react-icons/fa';
import {EditableType, } from "@/app/types/survey";

interface EditPopoverProps {
  stationOnTop: number;
  stationUnder: number;
  currentSkipValue: number;
  onSave: (newValue: EditableType | undefined) => void;
  onClose: () => void;
  top: number;
  left: number;
}

const SkipRowsPopover: React.FC<EditPopoverProps> = ({
  stationOnTop,
  stationUnder,
  currentSkipValue,
  onSave,
  onClose,
  top,
  left,
}) => {
  const [value, setValue] = useState<string>(currentSkipValue?.toString() || '');
  const [cursor, setCursor] = useState<number | null>(null);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setCursor(e.target.selectionStart);
  }

  const NumberEditor = () => {
    return (<input
        type="number"
        value={value}
        inputMode="numeric"
        onChange={handleChange}
        className={styles.input}
        autoFocus
        min={0}
        onFocus={(e) => {
          if(cursor !== null) {
            e.target.setSelectionRange(cursor, cursor);
          }
        }}
    />);
  };

  const disableSaveButton = Number.isNaN(Number(value)) || (Number(value) < 0);

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Edit Skipped Rows</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <div className={styles.stationBefore}>station {stationOnTop}</div>
        <div>{"Skip "} <NumberEditor /> {" rows"}</div>
        <div className={styles.stationAfter}>station {stationUnder}</div>
        <div className={styles.buttonsContainer}>
          <button onClick={handleSave} className={styles.saveButton} disabled={disableSaveButton}><FaSave /></button>
        </div>
      </div>
    </div>
  );
};

export default SkipRowsPopover;
