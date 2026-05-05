"use client";

import React from 'react';
import styles from './AnomalyTable.module.css';
import { Anomaly } from '@/app/types/report';

type SubColumnConfig = {
  key: string;
  label?: string;
};

type FlatColumnConfig = {
  type: 'flat';
  key: keyof Anomaly;
  label?: string;
};

type GroupColumnConfig = {
  type: 'group';
  key: keyof Anomaly;
  label?: string;
  subColumns: SubColumnConfig[];
};

type ColumnConfig = FlatColumnConfig | GroupColumnConfig;

const toLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d+)/g, ' $1')
    .replace(/^\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/^(.)/, s => s.toUpperCase());

// Edit order and labels here to customize the table
const COLUMN_CONFIG: ColumnConfig[] = [
  { type: 'flat', key: 'station' },
  {
    type: 'group',
    key: 'dcvgValue',
    subColumns: [{ key: 'value' }, { key: 'source' }],
  },
  {
    type: 'group',
    key: 'coordinate',
    subColumns: [{ key: 'latitude' }, { key: 'longitude' }, { key: 'altitude' }],
  },
  {
    type: 'group',
    key: 'strengthPoint1',
    subColumns: [{ key: 'station' }, { key: 'vOn' }, { key: 'vOff' }],
  },
  {
    type: 'group',
    key: 'strengthPoint2',
    subColumns: [{ key: 'station' }, { key: 'vOn' }, { key: 'vOff' }],
  },
];

function getFlatValue(anomaly: Anomaly, key: keyof Anomaly): string {
  const val = anomaly[key];
  return val !== null && val !== undefined ? String(val) : '';
}

function getSubValue(anomaly: Anomaly, colKey: keyof Anomaly, subKey: string): string {
  const obj = anomaly[colKey];
  if (obj === null || obj === undefined) return '';
  const val = (obj as Record<string, unknown>)[subKey];
  return val !== null && val !== undefined ? String(val) : '';
}

interface AnomalyTableProps {
  anomalies: Anomaly[];
}

const AnomalyTable: React.FC<AnomalyTableProps> = ({ anomalies }) => {
  if (anomalies.length === 0) {
    return <p className={styles.emptyState}>No anomalies found.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {COLUMN_CONFIG.map(col =>
            col.type === 'flat' ? (
              <th key={col.key} rowSpan={2} className={styles.flatHeader}>
                {col.label ?? toLabel(col.key)}
              </th>
            ) : (
              <th
                key={col.key}
                colSpan={col.subColumns.length}
                className={styles.groupHeader}
              >
                {col.label ?? toLabel(col.key)}
              </th>
            )
          )}
        </tr>
        <tr>
          {COLUMN_CONFIG.flatMap(col => {
            if (col.type === 'flat') return [];
            return col.subColumns.map(sub => (
              <th key={`${col.key}-${sub.key}`} className={styles.subHeader}>
                {sub.label ?? toLabel(sub.key)}
              </th>
            ));
          })}
        </tr>
      </thead>
      <tbody>
        {anomalies.map((anomaly, i) => (
          <tr key={i} className={styles.row}>
            {COLUMN_CONFIG.flatMap(col => {
              if (col.type === 'flat') {
                return [
                  <td key={col.key} className={styles.cell}>
                    {getFlatValue(anomaly, col.key)}
                  </td>,
                ];
              }
              return col.subColumns.map(sub => (
                <td key={`${col.key}-${sub.key}`} className={styles.cell}>
                  {getSubValue(anomaly, col.key, sub.key)}
                </td>
              ));
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AnomalyTable;
