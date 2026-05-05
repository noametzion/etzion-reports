"use client";

import React from 'react';
import styles from './AnomalyTable.module.css';
import { Anomaly } from '@/app/types/report';

type SubColumnConfig = {
  key: string;
  label?: string;
};

type SerialColumnConfig = {
  type: 'serial';
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

type ColumnConfig = SerialColumnConfig | FlatColumnConfig | GroupColumnConfig;

const toLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d+)/g, ' $1')
    .replace(/^\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/^(.)/, s => s.toUpperCase());

// Edit order and labels here to customize the table
const COLUMN_CONFIG: ColumnConfig[] = [
  { type: 'serial', label: 'Serial No.' },
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

// Precompute which sub-columns are the first/last of their group (for side borders)
type LeafMeta = { isGroupFirst: boolean; isGroupLast: boolean };

const LEAF_META: LeafMeta[] = COLUMN_CONFIG.flatMap(col => {
  if (col.type === 'serial' || col.type === 'flat') {
    return [{ isGroupFirst: false, isGroupLast: false }];
  }
  return col.subColumns.map((_, i) => ({
    isGroupFirst: i === 0,
    isGroupLast: i === col.subColumns.length - 1,
  }));
});

function leafClass(meta: LeafMeta, base: string): string {
  const extra = [
    meta.isGroupFirst ? styles.groupBorderLeft : '',
    meta.isGroupLast ? styles.groupBorderRight : '',
  ].filter(Boolean).join(' ');
  return extra ? `${base} ${extra}` : base;
}

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
          {COLUMN_CONFIG.map(col => {
            if (col.type === 'serial') {
              return (
                <th key="__serial__" rowSpan={2} className={styles.flatHeader}>
                  {col.label ?? 'Serial No.'}
                </th>
              );
            }
            if (col.type === 'flat') {
              return (
                <th key={col.key} rowSpan={2} className={styles.flatHeader}>
                  {col.label ?? toLabel(col.key)}
                </th>
              );
            }
            return (
              <th
                key={col.key}
                colSpan={col.subColumns.length}
                className={styles.groupHeader}
              >
                {col.label ?? toLabel(col.key)}
              </th>
            );
          })}
        </tr>
        <tr>
          {(() => {
            let leafIdx = 0;
            return COLUMN_CONFIG.flatMap(col => {
              if (col.type === 'serial' || col.type === 'flat') {
                leafIdx++;
                return [];
              }
              return col.subColumns.map(sub => {
                const meta = LEAF_META[leafIdx++];
                return (
                  <th key={`${col.key}-${sub.key}`} className={leafClass(meta, styles.subHeader)}>
                    {sub.label ?? toLabel(sub.key)}
                  </th>
                );
              });
            });
          })()}
        </tr>
      </thead>
      <tbody>
        {anomalies.map((anomaly, rowIdx) => {
          let leafIdx = 0;
          return (
            <tr key={rowIdx} className={styles.row}>
              {COLUMN_CONFIG.flatMap(col => {
                if (col.type === 'serial') {
                  leafIdx++;
                  return [
                    <td key="__serial__" className={styles.cell}>
                      {rowIdx + 1}
                    </td>,
                  ];
                }
                if (col.type === 'flat') {
                  leafIdx++;
                  return [
                    <td key={col.key} className={styles.cell}>
                      {getFlatValue(anomaly, col.key)}
                    </td>,
                  ];
                }
                return col.subColumns.map(sub => {
                  const meta = LEAF_META[leafIdx++];
                  return (
                    <td key={`${col.key}-${sub.key}`} className={leafClass(meta, styles.cell)}>
                      {getSubValue(anomaly, col.key, sub.key)}
                    </td>
                  );
                });
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default AnomalyTable;
