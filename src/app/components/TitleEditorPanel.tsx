"use client";

import React, { useState} from 'react';
import styles from './TitleEditorPanel.module.css';

interface TitleEditorPanelProps {
  initialProjectName: string;
  onSave: (title: string, subtitle: string) => void;
}

const TitleEditorPanel: React.FC<TitleEditorPanelProps> = ({ initialProjectName, onSave }) => {
  const [projectName, setProjectName] = useState(initialProjectName);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pipelineSize, setPipelineSize] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
      const title = [
          projectName,
          from && to && `${from}-${to}`,
          from && !to && from,
          to && !from && to,
          pipelineSize && `${pipelineSize}"`,
      ].filter(Boolean).join(' ');
      const subtitle = `${new Date(date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}`
      onSave(
          title,
          subtitle,
      );
  };

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
          <span>"</span>
        </div>
      </div>
      <div className={styles.inputGroup}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button onClick={handleSave} className={styles.saveButton}>Save</button>
    </div>
  );
};

export default TitleEditorPanel;
