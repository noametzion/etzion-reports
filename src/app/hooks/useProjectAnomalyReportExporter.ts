"use client";

import XLSX from "xlsx-js-style";
import { useState } from "react";
import { DBProject, DBAnomalyReport, DBReportInformation } from "@/app/types/dbTypes";
import { Anomaly } from "@/app/types/report";
import { getSurveyDisplayName } from "@/app/utils/surveyNameUtils";

// ── Calculation helpers ───────────────────────────────────────────────────────

const getS1 = (a: Anomaly) =>
  a.strengthPoint1 !== undefined ? a.strengthPoint1.vOn - a.strengthPoint1.vOff : undefined;
const getS2 = (a: Anomaly) =>
  a.strengthPoint2 !== undefined ? a.strengthPoint2.vOn - a.strengthPoint2.vOff : undefined;
const getD1 = (a: Anomaly) => a.strengthPoint1?.station;
const getD2 = (a: Anomaly) => a.strengthPoint2?.station;
const getDx = (a: Anomaly) =>
  a.strengthPoint1 !== undefined ? a.station - a.strengthPoint1.station : undefined;
const getPRE = (a: Anomaly): number | undefined => {
  const s1 = getS1(a), s2 = getS2(a), d1 = getD1(a), d2 = getD2(a);
  if (s1 === undefined || s2 === undefined || d1 === undefined || d2 === undefined || d2 === d1) return undefined;
  return s1 + (a.station - d1) * (s2 - s1) / (d2 - d1);
};
const getIRRatio = (a: Anomaly): number | undefined => {
  const pre = getPRE(a);
  if (pre === undefined || pre === 0) return undefined;
  return Math.abs(a.dcvgValue.value / pre / 1000);
};

// ── File colors ───────────────────────────────────────────────────────────────
// 30 soft Material-Design-100-level pastels.
// When files exceed 30, the palette cycles and each subsequent round is lightened
// 25% toward white so colors stay distinct across rounds.

const FILE_COLORS = [
  'FFCCFF', 'CCFF33', 'CCCCFF', 'CCFFFF', '66FFCC',
  'CCFF99', 'D4D4D4', '9AF927', 'CCFFCC', 'C5D3FF',
  '000000',
  'FFCDD2', 'F8BBD0', 'FFCCBC', 'FFE0B2', 'FFECB3',
  'FFF9C4', 'F0F4C3', 'DCEDC8', 'C8E6C9', 'B2DFDB',
  'B2EBF2', 'B3E5FC', 'BBDEFB', 'C5CAE9', 'D1C4E9',
  'E1BEE7', 'D7CCC8', 'CFD8DC', 'E8F5E9', 'E3F2FD',
  'EDE7F6', 'FCE4EC', 'FFF3E0', 'F9FBE7', 'E0F7FA',
  'E8EAF6', 'F3E5F5', 'FBE9E7', 'E0F2F1', 'FFF8E1',
];

function lightenHex(hex: string, t: number): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b]
    .map(c => Math.round(c + (255 - c) * t).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

function fileColor(fileIdx: number): string {
  const cycle = Math.floor(fileIdx / FILE_COLORS.length);
  const base  = FILE_COLORS[fileIdx % FILE_COLORS.length];
  return cycle === 0 ? base : lightenHex(base, Math.min(cycle * 0.25, 0.8));
}

// ── Border definitions ────────────────────────────────────────────────────────

const THIN = { style: 'thin', color: { rgb: 'CCCCCC' } };
const MEDIUM = { style: 'medium', color: { rgb: '888888' } };

const B    = { top: THIN, bottom: THIN, left: THIN,   right: THIN   };
const BGL  = { top: THIN, bottom: THIN, left: MEDIUM, right: THIN   };  // group left edge
const BGR  = { top: THIN, bottom: THIN, left: THIN,   right: MEDIUM };  // group right edge
const BGLR = { top: THIN, bottom: THIN, left: MEDIUM, right: MEDIUM };  // merged group header

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = Record<string, any>;
type Border = typeof B;

const mkHeader = (border: Border): Style => ({
  font: { bold: true, underline: true },
  border,
  alignment: { horizontal: 'center', wrapText: true },
});
const CENTER = { horizontal: 'center' };
const mkData   = (border: Border): Style => ({ border, alignment: CENTER });
const mkCalc   = (border: Border): Style => ({ fill: { fgColor: { rgb: 'FFFDE7' } }, border, alignment: CENTER });
const mkIr     = (border: Border, hi: boolean): Style =>
  hi ? { fill: { fgColor: { rgb: 'FFFF00' } }, border, alignment: CENTER } : { border, alignment: CENTER };
const mkFile   = (rgb: string, border: Border): Style => ({ fill: { fgColor: { rgb } }, border, alignment: CENTER });

const r4 = (v: number | undefined): number | undefined =>
  v !== undefined ? Math.round(v * 10000) / 10000 : undefined;

function makeCell(v: string | number | undefined | null, style: Style, numFmt?: string): XLSX.CellObject {
  const val = v ?? '';
  const t = typeof val === 'number' ? 'n' : 's';
  return { v: val, t, s: numFmt ? { ...style, numFmt } : style } as XLSX.CellObject;
}

function set(ws: XLSX.WorkSheet, col: number, row: number, v: string | number | undefined | null, style: Style, numFmt?: string) {
  ws[XLSX.utils.encode_cell({ c: col, r: row })] = makeCell(v, style, numFmt);
}

function merge(list: XLSX.Range[], r1: number, c1: number, r2: number, c2: number) {
  list.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

type SortedFile = { displayName: string; report: DBAnomalyReport };

// ── Summary sheet ─────────────────────────────────────────────────────────────
// 0  Serial No.  (rowspan 2)
// 1  File Name   (rowspan 2)
// 2  Section     (rowspan 2)
// 3  Station     (rowspan 2)
// 4  DCVG Value (mV) (rowspan 2)
// 5  Latitude    } Coordinate (colspan 2) ← bold group borders
// 6  Longitude   }
// 7  %IR         (rowspan 2)

const SUMMARY_COLS = 8;
const SUMMARY_WIDTHS = [10, 32, 10, 12, 16, 12, 12, 10];

function buildSummarySheet(files: SortedFile[], irThreshold: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  for (const [col, label] of [[0, 'Serial No.'], [1, 'File'], [2, 'Section'], [3, 'Station'], [4, 'DCVG Value (mV)'], [7, '%IR']] as [number, string][]) {
    set(ws, col, 0, label, mkHeader(B));
    set(ws, col, 1, '', mkHeader(B));
    merge(merges, 0, col, 1, col);
  }

  // Coordinate group header (merged, medium on both sides)
  for (let c = 5; c <= 6; c++) set(ws, c, 0, c === 5 ? 'Coordinate' : '', mkHeader(BGLR));
  merge(merges, 0, 5, 0, 6);

  set(ws, 5, 1, 'Latitude',  mkHeader(BGL));
  set(ws, 6, 1, 'Longitude', mkHeader(BGR));

  let serial = 1, row = 2;
  files.forEach(({ displayName, report }, fi) => {
    const fc = fileColor(fi);
    for (const a of [...report.anomalyReport.anomalies].sort((x, y) => x.station - y.station)) {
      const ir = getIRRatio(a);
      const hi = ir !== undefined && ir * 100 >= irThreshold;
      set(ws, 0, row, serial++,                    mkData(B));
      set(ws, 1, row, displayName,       mkFile(fc, B));
      set(ws, 2, row, '',                          mkData(B));
      set(ws, 3, row, a.station,                   mkData(B));
      set(ws, 4, row, r4(a.dcvgValue.value),       mkData(B));
      set(ws, 5, row, a.coordinate?.latitude,      mkData(BGL));
      set(ws, 6, row, a.coordinate?.longitude,     mkData(BGR));
      set(ws, 7, row, ir,                          mkIr(B, hi), '0.##%');
      row++;
    }
  });

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row - 1, c: SUMMARY_COLS - 1 } });
  ws['!merges'] = merges;
  ws['!cols'] = SUMMARY_WIDTHS.map(wch => ({ wch }));
  return ws;
}

// ── Detailed sheet ────────────────────────────────────────────────────────────
// 0  Serial No.   (rowspan 2)
// 1  File Name    (rowspan 2)
// 2  Section      (rowspan 2)
// 3  Station      (rowspan 2)
// 4  DCVG Value (mV) (rowspan 2)
// 5  Latitude     } Coordinate (colspan 2) ← bold group borders
// 6  Longitude    }
// 7  SP1 station  } Strength Point 1 (colspan 3) ← bold group borders
// 8  SP1 vOn      }
// 9  SP1 vOff     }
// 10 SP2 station  } Strength Point 2 (colspan 3) ← bold group borders
// 11 SP2 vOn      }
// 12 SP2 vOff     }
// 13 S1           (rowspan 2, calc)
// 14 S2           (rowspan 2, calc)
// 15 D1           (rowspan 2, calc)
// 16 D2           (rowspan 2, calc)
// 17 Dx           (rowspan 2, calc)
// 18 P/RE         (rowspan 2, calc)
// 19 %IR          (rowspan 2)

const DETAILED_COLS = 20;
const DETAILED_WIDTHS = [10, 32, 10, 12, 16, 12, 12, 12, 10, 10, 12, 10, 10, 10, 10, 10, 10, 10, 10, 10];

// First col of each group: 5 (coord), 7 (SP1), 10 (SP2) → left medium border
// Last col of each group:  6 (coord), 9 (SP1), 12 (SP2) → right medium border
function db(col: number): Border {
  if (col === 5 || col === 7 || col === 10) return BGL;
  if (col === 6 || col === 9 || col === 12) return BGR;
  return B;
}

function buildDetailedSheet(files: SortedFile[], irThreshold: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  for (const [col, label] of [
    [0, 'Serial No.'], [1, 'File'], [2, 'Section'], [3, 'Station'], [4, 'DCVG Value (mV)'],
    [13, 'S1'], [14, 'S2'], [15, 'D1'], [16, 'D2'], [17, 'Dx'], [18, 'P/RE'], [19, '%IR'],
  ] as [number, string][]) {
    set(ws, col, 0, label, mkHeader(B));
    set(ws, col, 1, '', mkHeader(B));
    merge(merges, 0, col, 1, col);
  }

  for (const [from, to, label] of [[5, 6, 'Coordinate'], [7, 9, 'Strength Point 1'], [10, 12, 'Strength Point 2']] as [number, number, string][]) {
    for (let c = from; c <= to; c++) set(ws, c, 0, c === from ? label : '', mkHeader(BGLR));
    merge(merges, 0, from, 0, to);
  }

  for (const [col, label] of [
    [5, 'Latitude'], [6, 'Longitude'],
    [7, 'Station'], [8, 'vOn'], [9, 'vOff'],
    [10, 'Station'], [11, 'vOn'], [12, 'vOff'],
  ] as [number, string][]) {
    set(ws, col, 1, label, mkHeader(db(col)));
  }

  let serial = 1, row = 2;
  files.forEach(({ displayName, report }, fi) => {
    const fc = fileColor(fi);
    for (const a of [...report.anomalyReport.anomalies].sort((x, y) => x.station - y.station)) {
      const ir = getIRRatio(a);
      const hi = ir !== undefined && ir * 100 >= irThreshold;
      set(ws, 0,  row, serial++,                       mkData(B));
      set(ws, 1,  row, displayName,          mkFile(fc, B));
      set(ws, 2,  row, '',                             mkData(B));
      set(ws, 3,  row, a.station,                      mkData(B));
      set(ws, 4,  row, r4(a.dcvgValue.value),          mkData(B));
      set(ws, 5,  row, a.coordinate?.latitude,         mkData(BGL));
      set(ws, 6,  row, a.coordinate?.longitude,        mkData(BGR));
      set(ws, 7,  row, a.strengthPoint1?.station,      mkData(BGL));
      set(ws, 8,  row, r4(a.strengthPoint1?.vOn),      mkData(B));
      set(ws, 9,  row, r4(a.strengthPoint1?.vOff),     mkData(BGR));
      set(ws, 10, row, a.strengthPoint2?.station,      mkData(BGL));
      set(ws, 11, row, r4(a.strengthPoint2?.vOn),      mkData(B));
      set(ws, 12, row, r4(a.strengthPoint2?.vOff),     mkData(BGR));
      set(ws, 13, row, r4(getS1(a)),                   mkCalc(B));
      set(ws, 14, row, r4(getS2(a)),                   mkCalc(B));
      set(ws, 15, row, r4(getD1(a)),                   mkCalc(B));
      set(ws, 16, row, r4(getD2(a)),                   mkCalc(B));
      set(ws, 17, row, r4(getDx(a)),                   mkCalc(B));
      set(ws, 18, row, r4(getPRE(a)),                  mkCalc(B));
      set(ws, 19, row, ir,                             mkIr(B, hi), '0.##%');
      row++;
    }
  });

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row - 1, c: DETAILED_COLS - 1 } });
  ws['!merges'] = merges;
  ws['!cols'] = DETAILED_WIDTHS.map(wch => ({ wch }));
  return ws;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectAnomalyReportExporter() {
  const [isExporting, setIsExporting] = useState(false);

  const exportProjectAnomalyReport = (
    project: DBProject,
    anomalyReports: DBAnomalyReport[],
    reportsInformation: DBReportInformation[],
    irThreshold: number,
  ) => {
    setIsExporting(true);
    try {
      const sortedFiles = [...project.projectFiles]
        .map(file => {
          const reportInfo = reportsInformation.find(r => r.survey?.name === file.name);
          const displayName = getSurveyDisplayName(reportInfo?.projectName, file.name) ?? file.name;
          const report = anomalyReports.find(r => r.originalSurveyFile?.name === file.name);
          return { displayName, report };
        })
        .filter(f => f.report != null)
        .sort((a, b) => a.displayName.localeCompare(b.displayName)) as SortedFile[];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, buildSummarySheet(sortedFiles, irThreshold), 'Anomaly Report');
      XLSX.utils.book_append_sheet(wb, buildDetailedSheet(sortedFiles, irThreshold), 'Anomaly Report - Detailed');
      XLSX.writeFile(wb, `${project.projectName}_anomaly_report.xlsx`);
    } catch (error) {
      console.error('Error exporting project anomaly report:', error);
      throw error;
    } finally {
      setTimeout(() => setIsExporting(false), 3000);
    }
  };

  return { exportProjectAnomalyReport, isExporting };
}
