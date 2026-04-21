"use client";

import React, { useState, useEffect } from 'react';
import styles from './TitleEditorPanel.module.css';

interface TitleEditorPanelProps {
  initialValues?: {
    projectName?: string;
    from?: string;
    to?: string;
    pipelineSize?: string;
    date?: string;
  };
  onSave: (title: string, subtitle: string) => void;
  onInfoChange: (info: { projectName: string; from: string; to: string; pipelineSize: string; date: string }) => void;
}

const buildTitle = (projectName: string, from: string, to: string, pipelineSize: string) =>
    [
        projectName,
        from && to && `${from}-${to}`,
        from && !to && from,
        to && !from && to,
        pipelineSize && `${pipelineSize}"`,
    ].filter(Boolean).join(' ');

const buildSubtitle = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const TitleEditorPanel: React.FC<TitleEditorPanelProps> = ({ initialValues, onSave, onInfoChange }) => {
  const [projectName, setProjectName] = useState(initialValues?.projectName ?? '');
  const [from, setFrom] = useState(initialValues?.from ?? '');
  const [to, setTo] = useState(initialValues?.to ?? '');
  const [pipelineSize, setPipelineSize] = useState(initialValues?.pipelineSize ?? '');
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().split('T')[0]);

  useEffect(() => {
    onSave(buildTitle(projectName, from, to, pipelineSize), buildSubtitle(date));
    onInfoChange({ projectName, from, to, pipelineSize, date });
  }, [projectName, from, to, pipelineSize, date, onSave, onInfoChange]);

  return (
    <div className={styles.panel}>
      <div className={styles.inputGroup}>
        <label>Project Name</label>
        <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
      </div>
      <div className={styles.inputGroup}>
        <label>From</label>
        <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className={styles.inputGroup}>
        <label>To</label>
        <input type="text" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className={styles.inputGroup}>
        <label>Pipeline Size</label>
        <div className={styles.pipelineInput}>
          <input type="number" value={pipelineSize} onChange={(e) => setPipelineSize(e.target.value)} />
          <span>{'"'}</span>
        </div>
      </div>
      <div className={styles.inputGroup}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
    </div>
  );
};

export default TitleEditorPanel;
