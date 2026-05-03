"use client";

import React, { useState } from 'react';
import styles from './ErrorPanel.module.css';
import ErrorNavPanel from './ErrorNavPanel';

const DEFAULT_CIPS_THRESHOLD = 300;
const DEFAULT_DCVG_THRESHOLD = 30;

export type ErrorScanType = 'onoff' | 'dcvg' | 'station';

interface ErrorPanelProps {
  errorRows: number[];
  onScanMeasurementErrors: (threshold: number) => void;
  onScanDCVGErrors: (threshold: number) => void;
  onScanStationGapErrors: () => void;
  onNavigate: (rowIndex: number) => void;
}

const ErrorPanel: React.FC<ErrorPanelProps> = ({
  errorRows,
  onScanMeasurementErrors,
  onScanStationGapErrors,
  onScanDCVGErrors,
  onNavigate,
}) => {
  const [onOffVoltageThreshold, setOnOffVoltageThreshold] = useState(DEFAULT_CIPS_THRESHOLD);
  const [DCVGThreshold, setDCVGThreshold] = useState(DEFAULT_DCVG_THRESHOLD);
  const [lastScanType, setLastScanType] = useState<ErrorScanType | null>(null);

  const handleScanMeasurementErrorsClick = () => {
    setLastScanType('onoff');
    onScanMeasurementErrors(onOffVoltageThreshold);
  };

  const handleScanDCVGErrorsClick = () => {
    setLastScanType('dcvg');
    onScanDCVGErrors(DCVGThreshold);
  };

  const handleScanStationGapErrorsClick = () => {
    setLastScanType('station');
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
          {lastScanType === 'onoff' && (
            <ErrorNavPanel errorRows={errorRows} onNavigate={onNavigate} />
          )}
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
          {lastScanType === 'dcvg' && (
            <ErrorNavPanel errorRows={errorRows} onNavigate={onNavigate} />
          )}
        </div>

        <div className={styles.section}>
          <h4>Stations Gap Errors</h4>
          <span> - Find missing stations </span>
          <button onClick={handleScanStationGapErrorsClick} className={styles.scanButton}>Scan</button>
          {lastScanType === 'station' && (
            <ErrorNavPanel errorRows={errorRows} onNavigate={onNavigate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorPanel;
