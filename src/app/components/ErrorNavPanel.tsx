"use client";

import React, { useState, useEffect } from 'react';
import styles from './ErrorNavPanel.module.css';

interface ErrorNavPanelProps {
  errorRows: number[];
  onNavigate: (rowIndex: number) => void;
}

const ErrorNavPanel: React.FC<ErrorNavPanelProps> = ({ errorRows, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [errorRows]);

  if (errorRows.length === 0) return null;

  const goTo = (index: number) => {
    setCurrentIndex(index);
    onNavigate(errorRows[index]);
  };

  return (
    <div className={styles.navPanel}>
      <button
        className={styles.navButton}
        onClick={() => goTo((currentIndex - 1 + errorRows.length) % errorRows.length)}
      >◀</button>
      <span className={styles.counter}>{currentIndex + 1}/{errorRows.length}</span>
      <button
        className={styles.navButton}
        onClick={() => goTo((currentIndex + 1) % errorRows.length)}
      >▶</button>
    </div>
  );
};

export default ErrorNavPanel;
