import XLSX from 'xlsx-js-style';

// ── File colors ───────────────────────────────────────────────────────────────

export const FILE_COLORS = [
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

export function lightenHex(hex: string, t: number): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b]
    .map(c => Math.round(c + (255 - c) * t).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

export function fileColor(fileIdx: number): string {
  const cycle = Math.floor(fileIdx / FILE_COLORS.length);
  const base  = FILE_COLORS[fileIdx % FILE_COLORS.length];
  return cycle === 0 ? base : lightenHex(base, Math.min(cycle * 0.25, 0.8));
}

// ── Border definitions ────────────────────────────────────────────────────────

export const THIN   = { style: 'thin',   color: { rgb: 'CCCCCC' } };
export const MEDIUM = { style: 'medium', color: { rgb: '888888' } };

export const B    = { top: THIN, bottom: THIN, left: THIN,   right: THIN   };
export const BGL  = { top: THIN, bottom: THIN, left: MEDIUM, right: THIN   };
export const BGR  = { top: THIN, bottom: THIN, left: THIN,   right: MEDIUM };
export const BGLR = { top: THIN, bottom: THIN, left: MEDIUM, right: MEDIUM };

// ── Style helpers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type XlsxStyle = Record<string, any>;
export type XlsxBorder = typeof B;

export const CENTER = { horizontal: 'center' };

export const mkHeader = (border: XlsxBorder): XlsxStyle => ({
  font: { bold: true, underline: true },
  border,
  alignment: { horizontal: 'center', wrapText: true },
});

export const mkData = (border: XlsxBorder): XlsxStyle => ({ border, alignment: CENTER });

export const mkFile = (rgb: string, border: XlsxBorder): XlsxStyle => ({
  fill: { fgColor: { rgb } },
  border,
  alignment: CENTER,
});

// ── Cell / sheet utilities ────────────────────────────────────────────────────

export function makeCell(
  v: string | number | undefined | null,
  style: XlsxStyle,
  numFmt?: string,
): XLSX.CellObject {
  const val = v ?? '';
  const t = typeof val === 'number' ? 'n' : 's';
  return { v: val, t, s: numFmt ? { ...style, numFmt } : style } as XLSX.CellObject;
}

export function set(
  ws: XLSX.WorkSheet,
  col: number,
  row: number,
  v: string | number | undefined | null,
  style: XlsxStyle,
  numFmt?: string,
) {
  ws[XLSX.utils.encode_cell({ c: col, r: row })] = makeCell(v, style, numFmt);
}

export function merge(list: XLSX.Range[], r1: number, c1: number, r2: number, c2: number) {
  list.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}
