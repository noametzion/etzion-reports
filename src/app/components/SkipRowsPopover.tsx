"use client";

import React, {useState} from 'react';
import styles from './SkipRowsPopover.module.css';
import {FaArrowRight, FaSave, FaTimes} from 'react-icons/fa';

interface EditPopoverProps {
  stationOnTop: number;
  stationUnder: number;
  currentSkipValueMeters: number;
  stationDiffDist: number;
  onSave: (newValue: number) => void;
  onClose: () => void;
  top: number;
  left: number;
}

const SkipRowsPopover: React.FC<EditPopoverProps> = ({
  stationOnTop,
  stationUnder,
  currentSkipValueMeters,
  stationDiffDist,
  onSave,
  onClose,
  top,
  left,
}) => {
  const [skipMeters, setSkipMeters] = useState<string>( currentSkipValueMeters?.toString() || '');
  const [cursor, setCursor] = useState<number | null>(null);

  const handleSave = () => {
    onSave(Number(skipMeters));
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkipMeters(e.target.value);
    setCursor(e.target.selectionStart);
  }

  const NumberEditor = () => {
    return (<input
        type="number"
        value={skipMeters}
        inputMode="numeric"
        onChange={handleChange}
        className={styles.input}
        autoFocus
        min={0}
        step={stationDiffDist}
        onFocus={(e) => {
          if(cursor !== null) {
            e.target.setSelectionRange(cursor, cursor);
          }
        }}
    />);
  };

  const skipRows = Number(skipMeters) / stationDiffDist;
  const disableSaveButton = Number.isNaN(Number(skipMeters)) || (Number(skipMeters) < 0) || !Number.isInteger(skipRows);
  const isValidChange = !disableSaveButton && Number(skipMeters) !== currentSkipValueMeters;

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Edit Skipped Rows</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <div className={styles.stationBefore}>station {stationOnTop}</div>
        <div>{"Skip "} <NumberEditor /> {" meters [" + skipRows + " rows]"}</div>
        <div className={styles.stationAfterChange}>
          <div className={styles.stationAfter}>station {stationUnder}</div>
          {isValidChange && <><FaArrowRight/>
          <div className={styles.stationAfter}>station {stationOnTop + Number(skipMeters) + stationDiffDist}</div></>}
        </div>
        <div className={styles.buttonsContainer}>
          <button onClick={handleSave} className={styles.saveButton} disabled={disableSaveButton}><FaSave /></button>
        </div>
      </div>
    </div>
  );
};

export default SkipRowsPopover;
