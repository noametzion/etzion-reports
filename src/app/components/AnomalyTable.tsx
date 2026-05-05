"use client";

import React from 'react';
import styles from './AnomalyTable.module.css';
import { Anomaly } from '@/app/types/report';

// ── Column config types ───────────────────────────────────────────────────────

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

type CalculatedColumnConfig = {
  type: 'calculated';
  key: string;
  label: string;
  tooltip: string;
  getValue: (anomaly: Anomaly) => number | undefined;
  format?: (value: number) => string;
};

type ColumnConfig = SerialColumnConfig | FlatColumnConfig | GroupColumnConfig | CalculatedColumnConfig;

// ── Calculation helpers ───────────────────────────────────────────────────────

const getS1 = (a: Anomaly): number | undefined =>
  a.strengthPoint1 !== undefined ? a.strengthPoint1.vOn - a.strengthPoint1.vOff : undefined;

const getS2 = (a: Anomaly): number | undefined =>
  a.strengthPoint2 !== undefined ? a.strengthPoint2.vOn - a.strengthPoint2.vOff : undefined;

const getD1 = (a: Anomaly): number | undefined => a.strengthPoint1?.station;
const getD2 = (a: Anomaly): number | undefined => a.strengthPoint2?.station;

const getPRE = (a: Anomaly): number | undefined => {
  const s1 = getS1(a), s2 = getS2(a), d1 = getD1(a), d2 = getD2(a);
  if (s1 === undefined || s2 === undefined || d1 === undefined || d2 === undefined || d2 === d1) return undefined;
  const dx = a.station - d1;
  return s1 + dx * (s2 - s1) / (d2 - d1);
};

const getIRPct = (a: Anomaly): number | undefined => {
  const pre = getPRE(a);
  if (pre === undefined || pre === 0) return undefined;
  // Division by 1000 accounts for unit conversion (DCVG value in mV, P/RE in mV → ratio × 100 for %)
  return Math.abs(a.dcvgValue.value / pre / 1000);
};

// ── Column config ─────────────────────────────────────────────────────────────
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
  {
    type: 'calculated',
    key: 's1',
    label: 'S1',
    tooltip: 'vOn − vOff of Strength Point 1',
    getValue: getS1,
    format: v => v.toFixed(3),
  },
  {
    type: 'calculated',
    key: 's2',
    label: 'S2',
    tooltip: 'vOn − vOff of Strength Point 2',
    getValue: getS2,
    format: v => v.toFixed(3),
  },
  {
    type: 'calculated',
    key: 'd1',
    label: 'D1',
    tooltip: 'Station of Strength Point 1',
    getValue: getD1,
  },
  {
    type: 'calculated',
    key: 'd2',
    label: 'D2',
    tooltip: 'Station of Strength Point 2',
    getValue: getD2,
  },
  {
    type: 'calculated',
    key: 'dx',
    label: 'Dx',
    tooltip: 'Station of Anomaly − Station of Strength Point 1',
    getValue: a => a.strengthPoint1 !== undefined ? a.station - a.strengthPoint1.station : undefined,
  },
  {
    type: 'calculated',
    key: 'pre',
    label: 'P/RE',
    tooltip: 'S1 + Dx × (S2 − S1) / (D2 − D1) — interpolated pipe-to-soil potential at anomaly station',
    getValue: getPRE,
    format: v => v.toFixed(3),
  },
  {
    type: 'calculated',
    key: 'ir',
    label: '%IR',
    tooltip: 'ABS(DCVG value / P/RE / 1000) — ÷1000 for unit conversion, verify expected range',
    getValue: getIRPct,
    format: v => `${(v * 100).toFixed(2)}%`,
  },
];

// ── Border / leaf metadata ────────────────────────────────────────────────────

type LeafMeta = { isGroupFirst: boolean; isGroupLast: boolean };

const LEAF_META: LeafMeta[] = COLUMN_CONFIG.flatMap(col => {
  if (col.type === 'serial' || col.type === 'flat' || col.type === 'calculated') {
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

// ── Value helpers ─────────────────────────────────────────────────────────────

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

function formatCalc(col: CalculatedColumnConfig, anomaly: Anomaly): string {
  const val = col.getValue(anomaly);
  if (val === undefined) return '';
  return col.format ? col.format(val) : String(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AnomalyTableProps {
  anomalies: Anomaly[];
  irThreshold?: number;
}

const AnomalyTable: React.FC<AnomalyTableProps> = ({ anomalies, irThreshold }) => {
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
                  {col.label ?? col.key}
                </th>
              );
            }
            if (col.type === 'calculated') {
              return (
                <th key={col.key} rowSpan={2} className={styles.calculatedHeader}>
                  <span className={styles.headerWithInfo}>
                    {col.label}
                    <span className={styles.infoIcon} data-tooltip={col.tooltip}>ⓘ</span>
                  </span>
                </th>
              );
            }
            return (
              <th key={col.key} colSpan={col.subColumns.length} className={styles.groupHeader}>
                {col.label ?? col.key}
              </th>
            );
          })}
        </tr>
        <tr>
          {(() => {
            let leafIdx = 0;
            return COLUMN_CONFIG.flatMap(col => {
              if (col.type === 'serial' || col.type === 'flat' || col.type === 'calculated') {
                leafIdx++;
                return [];
              }
              return col.subColumns.map(sub => {
                const meta = LEAF_META[leafIdx++];
                return (
                  <th key={`${col.key}-${sub.key}`} className={leafClass(meta, styles.subHeader)}>
                    {sub.label ?? sub.key}
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
                  return [<td key="__serial__" className={styles.cell}>{rowIdx + 1}</td>];
                }
                if (col.type === 'flat') {
                  leafIdx++;
                  return [
                    <td key={col.key} className={styles.cell}>
                      {getFlatValue(anomaly, col.key)}
                    </td>,
                  ];
                }
                if (col.type === 'calculated') {
                  leafIdx++;
                  const isIrAboveThreshold =
                    col.key === 'ir' &&
                    irThreshold !== undefined &&
                    (col.getValue(anomaly) ?? 0) * 100 > irThreshold;
                  return [
                    <td
                      key={col.key}
                      className={isIrAboveThreshold ? styles.irHighlight : styles.calculatedCell}
                    >
                      {formatCalc(col, anomaly)}
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
