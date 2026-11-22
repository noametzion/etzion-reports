"use client";

import XLSX from 'xlsx-js-style';
import { useState } from 'react';
import { MeasurementPointsFinalReportData } from '@/app/types/measurementPointsReport';
import {
  B, BGL, BGR, BGLR,
  mkHeader, mkData, mkFile, set, merge,
} from '@/app/utils/excelStyleUtils';

// 0 Serial No. | 1 File | 2 Pipeline | 3 Test Point | 4-5 Potential (mV) [On, Ins. Off] | 6 Current (mA) | 7 Comments
const COLS = 8;
const WIDTHS = [10, 28, 12, 22, 12, 12, 14, 24];

function buildSheet(data: MeasurementPointsFinalReportData): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  const TITLE_STYLE = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' },
    fill: { fgColor: { rgb: data.hasDate ? 'FFFFFF' : 'FF0000' } },
  };
  for (let c = 0; c < COLS; c++) set(ws, c, 0, c === 0 ? data.title : '', TITLE_STYLE);
  merge(merges, 0, 0, 0, COLS - 1);

  for (let c = 0; c < COLS; c++) set(ws, c, 1, '', {});

  for (const [col, label] of [
    [0, 'Serial No.'], [1, 'File'], [2, 'Pipe'], [3, 'Test Point'], [6, 'Current (mA)'], [7, 'Comments'],
  ] as [number, string][]) {
    set(ws, col, 2, label, mkHeader(B));
    set(ws, col, 3, '', mkHeader(B));
    merge(merges, 2, col, 3, col);
  }

  for (let c = 4; c <= 5; c++) set(ws, c, 2, c === 4 ? 'Potential (mV)' : '', mkHeader(BGLR));
  merge(merges, 2, 4, 2, 5);

  set(ws, 4, 3, 'On',       mkHeader(BGL));
  set(ws, 5, 3, 'Ins. Off', mkHeader(BGR));

  let row = 4;
  data.rows.forEach((r, i) => {
    set(ws, 0, row, i + 1,          mkData(B));
    set(ws, 1, row, r.displayName,  mkFile(r.fileColor, B));
    set(ws, 2, row, r.pipelineSize, mkData(B));
    set(ws, 3, row, r.testPoint,    mkData(B));
    set(ws, 4, row, r.vOn,          mkData(BGL));
    set(ws, 5, row, r.vOff,         mkData(BGR));
    set(ws, 6, row, '',             mkData(B));
    set(ws, 7, row, '',             mkData(B));
    row++;
  });

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row - 1, c: COLS - 1 } });
  ws['!merges'] = merges;
  ws['!cols'] = WIDTHS.map(wch => ({ wch }));
  return ws;
}

export function useMeasurementPointsReportExporter() {
  const [isExporting, setIsExporting] = useState(false);

  const exportMeasurementPointsReport = (data: MeasurementPointsFinalReportData) => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, buildSheet(data), 'Measurement Points');
      XLSX.writeFile(wb, `${data.projectName}_measurement_points.xlsx`);
    } catch (error) {
      console.error('Error exporting measurement points report:', error);
      throw error;
    } finally {
      setTimeout(() => setIsExporting(false), 3000);
    }
  };

  return { exportMeasurementPointsReport, isExporting };
}
