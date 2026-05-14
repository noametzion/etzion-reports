"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './AnomalyTable.module.css';
import { Anomaly, DCVGValue, Landmark, StrengthPoint } from '@/app/types/report';
import { DCVGCandidate, StrengthPointCandidate } from '@/app/hooks/useAnomalyReportCreator';
import { FaPencilAlt } from 'react-icons/fa';
import DCVGCellEditor from './DCVGCellEditor';
import StrengthPointCellEditor from './StrengthPointCellEditor';
import StationSelectorEditor from './StationSelectorEditor';

// ── Column config types ───────────────────────────────────────────────────────

type SubColumnConfig = {
  key: string;
  label?: string;
  format?: (val: number) => string;
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

type SectionColumnConfig = {
  type: 'section';
  label?: string;
};

type ColumnConfig = SerialColumnConfig | FlatColumnConfig | GroupColumnConfig | CalculatedColumnConfig | SectionColumnConfig;

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

const fmt4 = (v: number) => String(parseFloat(v.toFixed(4)));

const COLUMN_CONFIG: ColumnConfig[] = [
  { type: 'serial', label: 'Serial No.' },
  { type: 'flat', key: 'station' },
  { type: 'section', label: 'Section' },
  {
    type: 'group',
    key: 'dcvgValue',
    label: 'DCVG Value',
    subColumns: [{ key: 'value', label: 'value (mV)', format: fmt4 }, { key: 'source' }],
  },
  {
    type: 'group',
    key: 'coordinate',
    subColumns: [{ key: 'latitude' }, { key: 'longitude' }],
  },
  {
    type: 'group',
    key: 'strengthPoint1',
    subColumns: [{ key: 'station' }, { key: 'vOn', format: fmt4 }, { key: 'vOff', format: fmt4 }],
  },
  {
    type: 'group',
    key: 'strengthPoint2',
    subColumns: [{ key: 'station' }, { key: 'vOn', format: fmt4 }, { key: 'vOff', format: fmt4 }],
  },
  {
    type: 'calculated',
    key: 's1',
    label: 'S1',
    tooltip: 'vOn − vOff of Strength Point 1',
    getValue: getS1,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 's2',
    label: 'S2',
    tooltip: 'vOn − vOff of Strength Point 2',
    getValue: getS2,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 'd1',
    label: 'D1',
    tooltip: 'Station of Strength Point 1',
    getValue: getD1,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 'd2',
    label: 'D2',
    tooltip: 'Station of Strength Point 2',
    getValue: getD2,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 'dx',
    label: 'Dx',
    tooltip: 'Station of Anomaly − Station of Strength Point 1',
    getValue: a => a.strengthPoint1 !== undefined ? a.station - a.strengthPoint1.station : undefined,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 'pre',
    label: 'P/RE',
    tooltip: 'S1 + Dx × (S2 − S1) / (D2 − D1) — interpolated pipe-to-soil potential at anomaly station',
    getValue: getPRE,
    format: fmt4,
  },
  {
    type: 'calculated',
    key: 'ir',
    label: '%IR',
    tooltip: 'ABS(DCVG value / P/RE / 1000) — ÷1000 for unit conversion, verify expected range',
    getValue: getIRPct,
    format: v => `${parseFloat((v * 100).toFixed(2))}%`,
  },
];

// ── Border / leaf metadata ────────────────────────────────────────────────────

type LeafMeta = { isGroupFirst: boolean; isGroupLast: boolean };

const LEAF_META: LeafMeta[] = COLUMN_CONFIG.flatMap(col => {
  if (col.type === 'serial' || col.type === 'flat' || col.type === 'calculated' || col.type === 'section') {
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

function getSubValue(anomaly: Anomaly, colKey: keyof Anomaly, sub: SubColumnConfig): string {
  const obj = anomaly[colKey];
  if (obj === null || obj === undefined) return '';
  const val = (obj as Record<string, unknown>)[sub.key];
  if (val === null || val === undefined) return '';
  if (sub.format && typeof val === 'number') return sub.format(val);
  return String(val);
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
  strengthPointsCandidates?: StrengthPointCandidate[];
  allMeasuredStations?: Map<number, { vOn: number; vOff: number }>;
  stationDiff?: number;
  dcvgCandidates?: Map<number, DCVGCandidate[]>;
  userAddedStations?: Set<number>;
  suggestedLandmarks?: Landmark[];
  onEditDcvg?: (station: number, value: DCVGValue) => void;
  onEditStrengthPoint1?: (station: number, sp: StrengthPoint) => void;
  onEditStrengthPoint2?: (station: number, sp: StrengthPoint) => void;
  onRemoveAnomaly?: (station: number) => void;
  onEditSectionFrom?: (station: number, landmark: Landmark) => void;
  onEditSectionTo?: (station: number, landmark: Landmark) => void;
}

type EditState = { rowIdx: number; field: 'dcvg' | 'strengthPoint1' | 'strengthPoint2' | 'sectionFrom' | 'sectionTo' };

const AnomalyTable: React.FC<AnomalyTableProps> = ({
  anomalies, irThreshold, strengthPointsCandidates, allMeasuredStations, stationDiff, dcvgCandidates,
  userAddedStations, suggestedLandmarks, onEditDcvg, onEditStrengthPoint1, onEditStrengthPoint2, onRemoveAnomaly, onEditSectionFrom, onEditSectionTo,
}) => {
  const [editState, setEditState] = useState<EditState | null>(null);
  const editCellRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    if (!editState) return;
    const close = (e: MouseEvent) => {
      if (editCellRef.current?.contains(e.target as Node)) return;
      setEditState(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [editState]);

  useEffect(() => {
    if (editState?.field !== 'sectionFrom' && editState?.field !== 'sectionTo') return;
    editCellRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [editState]);

  if (anomalies.length === 0) {
    return <p className={styles.emptyState}>No anomalies found.</p>;
  }

  const openEdit = (rowIdx: number, field: EditState['field']) => {
    setEditState({ rowIdx, field });
  };

  const handleLandmarkSelect = (
    selectedStation: number,
    anomalyStation: number,
    isEditingFrom: boolean,
  ) => {
    const landmark = suggestedLandmarks?.find(lm => lm.station === selectedStation);
    if (!landmark) return;
    if (isEditingFrom) onEditSectionFrom!(anomalyStation, landmark);
    else onEditSectionTo!(anomalyStation, landmark);
    setEditState(null);
  };

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
            if (col.type === 'section') {
              return (
                <th key="__section__" rowSpan={2} className={styles.flatHeader}>
                  {col.label ?? 'Section'}
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
              if (col.type === 'serial' || col.type === 'flat' || col.type === 'calculated' || col.type === 'section') {
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
                  const isStationColumn = col.key === 'station';
                  const showRemove = isStationColumn && onRemoveAnomaly && userAddedStations?.has(anomaly.station);
                  return [
                    <td key={col.key} className={styles.cell}>
                      {getFlatValue(anomaly, col.key)}
                      {showRemove && (
                        <button className={styles.removeBtn} onClick={() => onRemoveAnomaly!(anomaly.station)}>−</button>
                      )}
                    </td>,
                  ];
                }
                if (col.type === 'section') {
                  leafIdx++;
                  const section = anomaly.section;
                  const isEditingFrom = editState?.rowIdx === rowIdx && editState.field === 'sectionFrom';
                  const isEditingTo = editState?.rowIdx === rowIdx && editState.field === 'sectionTo';
                  const isEditing = isEditingFrom || isEditingTo;
                  const isEditable = !!(onEditSectionFrom && onEditSectionTo) && !!suggestedLandmarks?.length;
                  return [(
                    <td
                      key="__section__"
                      ref={isEditing ? editCellRef : undefined}
                      className={`${styles.cell} ${isEditing ? styles.editingCell : ''}`}
                    >
                      <div className={styles.sectionWrapper}>
                        <span
                          className={`${styles.sectionPart}${isEditable ? ` ${styles.sectionPartEditable}` : ''}${isEditingFrom ? ` ${styles.sectionPartActive}` : ''}`}
                          onClick={isEditable ? () => openEdit(rowIdx, 'sectionFrom') : undefined}
                        >
                          {section?.from?.label ?? '—'}
                          {isEditable && <FaPencilAlt className={styles.editIcon} />}
                        </span>
                        {' → '}
                        <span
                          className={`${styles.sectionPart}${isEditable ? ` ${styles.sectionPartEditable}` : ''}${isEditingTo ? ` ${styles.sectionPartActive}` : ''}`}
                          onClick={isEditable ? () => openEdit(rowIdx, 'sectionTo') : undefined}
                        >
                          {section?.to?.label ?? '—'}
                          {isEditable && <FaPencilAlt className={styles.editIcon} />}
                        </span>
                        {isEditing && suggestedLandmarks && (
                          <div className={styles.sectionDropdown}>
                            <StationSelectorEditor
                              options={suggestedLandmarks.map(lm => ({ station: lm.station, label: `${lm.label} (${lm.station})` }))}
                              onSelect={selectedStation => handleLandmarkSelect(selectedStation, anomaly.station, isEditingFrom)}
                              onCancel={() => setEditState(null)}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  )];
                }

                if (col.type === 'calculated') {
                  leafIdx++;
                  const isIrAboveThreshold =
                    col.key === 'ir' &&
                    irThreshold !== undefined &&
                    (col.getValue(anomaly) ?? 0) * 100 >= irThreshold;
                  const cellClass = isIrAboveThreshold
                    ? styles.irHighlight
                    : col.key === 'ir'
                      ? styles.cell
                      : styles.calculatedCell;
                  return [
                    <td
                      key={col.key}
                      className={cellClass}
                    >
                      {formatCalc(col, anomaly)}
                    </td>,
                  ];
                }
                return col.subColumns.map(sub => {
                  const meta = LEAF_META[leafIdx++];

                  const isEditableDcvg = col.key === 'dcvgValue' && sub.key === 'value' && !!onEditDcvg;
                  const isEditableSp1 = col.key === 'strengthPoint1' && sub.key === 'station' && !!onEditStrengthPoint1 && !!strengthPointsCandidates?.length;
                  const isEditableSp2 = col.key === 'strengthPoint2' && sub.key === 'station' && !!onEditStrengthPoint2 && !!strengthPointsCandidates?.length;
                  const isEditable = isEditableDcvg || isEditableSp1 || isEditableSp2;

                  const isEditing = isEditable && editState?.rowIdx === rowIdx && (
                    (isEditableDcvg && editState.field === 'dcvg') ||
                    (isEditableSp1 && editState.field === 'strengthPoint1') ||
                    (isEditableSp2 && editState.field === 'strengthPoint2')
                  );

                  const openField: EditState['field'] = isEditableDcvg ? 'dcvg' : isEditableSp1 ? 'strengthPoint1' : 'strengthPoint2';

                  return (
                    <td
                      key={`${col.key}-${sub.key}`}
                      ref={isEditing ? editCellRef : undefined}
                      className={leafClass(meta, isEditing ? `${styles.cell} ${styles.editingCell}` : isEditable ? `${styles.cell} ${styles.editableCell}` : styles.cell)}
                      onClick={isEditable && !isEditing ? () => openEdit(rowIdx, openField) : undefined}
                    >
                      {isEditing && isEditableDcvg ? (
                        <DCVGCellEditor
                          candidates={dcvgCandidates?.get(anomaly.station) ?? []}
                          currentValue={anomaly.dcvgValue}
                          onSave={v => { onEditDcvg!(anomaly.station, v); setEditState(null); }}
                          onCancel={() => setEditState(null)}
                        />
                      ) : isEditing && (isEditableSp1 || isEditableSp2) ? (
                        <StrengthPointCellEditor
                          candidates={strengthPointsCandidates!}
                          allMeasuredStations={allMeasuredStations}
                          stationDiff={stationDiff}
                          onSave={sp => {
                            if (isEditableSp1) onEditStrengthPoint1!(anomaly.station, sp);
                            else onEditStrengthPoint2!(anomaly.station, sp);
                            setEditState(null);
                          }}
                          onCancel={() => setEditState(null)}
                        />
                      ) : (
                        <>
                          {getSubValue(anomaly, col.key, sub)}
                          {isEditable && <FaPencilAlt className={styles.editIcon} />}
                        </>
                      )}
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
