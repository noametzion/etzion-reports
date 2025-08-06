"use client";

import React, { useState } from 'react';
import styles from './ErrorPanel.module.css';

interface ErrorPanelProps {
  onScanMeasurementErrors: (threshold: number) => void;
  onScanDCVGErrors: (threshold: number) => void;
  onScanStationGapErrors: () => void;
}

const ErrorPanel: React.FC<ErrorPanelProps> = ({ onScanMeasurementErrors, onScanStationGapErrors, onScanDCVGErrors}) => {
  const [onOffVoltageThreshold, setOnOffVoltageThreshold] = useState(300);
  const [DCVGThreshold, setDCVGThreshold] = useState(5);

  const handleScanMeasurementErrorsClick = () => {
    onScanMeasurementErrors(onOffVoltageThreshold);
  };

  const handleScanDCVGErrorsClick = () => {
    onScanDCVGErrors(DCVGThreshold);
  };

  const handleScanStationGapErrorsClick = () => {
    onScanStationGapErrors();
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <span>Error Panel</span>
      </div>
      <div className={styles.content}>

        <div className={styles.section}>
          <h4>Measurement Errors</h4>
          <span> - Find voltage difference of </span>
          <input
              type="number"
              value={onOffVoltageThreshold}
              onChange={(e) => setOnOffVoltageThreshold(Number(e.target.value))}
              className={styles.input}
          />
          <span> mV</span>
          <button onClick={handleScanMeasurementErrorsClick} className={styles.scanButton}>Scan</button>
        </div>

        <div className={styles.section}>
          <h4>DCVG Errors</h4>
          <span> - Find DCVG difference of </span>
          <input
              type="number"
              value={DCVGThreshold}
              onChange={(e) => setDCVGThreshold(Number(e.target.value))}
              className={styles.input}
          />
          <span> mV</span>
          <button onClick={handleScanDCVGErrorsClick} className={styles.scanButton}>Scan</button>
        </div>

        <div className={styles.section}>
          <h4>Stations Gap Errors</h4>
          <span> - Find missing stations </span>
          <button onClick={handleScanStationGapErrorsClick} className={styles.scanButton}>Scan</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPanel;
