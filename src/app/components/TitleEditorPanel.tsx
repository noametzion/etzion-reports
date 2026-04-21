"use client";

import React, { useState, useEffect } from 'react';
import styles from './TitleEditorPanel.module.css';
import { TitleInfo } from '@/app/types/reportInformation';
import AutocompleteInput from '@/app/components/General/AutocompleteInput';

interface TitleEditorPanelProps {
  initialValues?: Partial<TitleInfo>;
  projectNameOptions: string[];
  locationOptions: string[];
  onTitleInfoChange: (info: TitleInfo, title: string, subtitle: string) => void;
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

const TitleEditorPanel: React.FC<TitleEditorPanelProps> = ({ initialValues, projectNameOptions, locationOptions, onTitleInfoChange }) => {
  const [projectName, setProjectName] = useState(initialValues?.projectName ?? '');
  const [from, setFrom] = useState(initialValues?.from ?? '');
  const [to, setTo] = useState(initialValues?.to ?? '');
  const [pipelineSize, setPipelineSize] = useState(initialValues?.pipelineSize ?? '');
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().split('T')[0]);

  useEffect(() => {
    onTitleInfoChange(
        { projectName, from, to, pipelineSize, date },
        buildTitle(projectName, from, to, pipelineSize),
        buildSubtitle(date),
    );
  }, [projectName, from, to, pipelineSize, date, onTitleInfoChange]);

  return (
    <div className={styles.panel}>
      <div className={styles.inputGroup}>
        <label>Project Name</label>
        <AutocompleteInput value={projectName} onChange={setProjectName} options={projectNameOptions} />
      </div>
      <div className={styles.inputGroup}>
        <label>From</label>
        <AutocompleteInput value={from} onChange={setFrom} options={locationOptions} />
      </div>
      <div className={styles.inputGroup}>
        <label>To</label>
        <AutocompleteInput value={to} onChange={setTo} options={locationOptions} />
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
