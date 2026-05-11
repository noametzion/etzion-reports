import { Anomaly, Coordinate, DCVGValue, DCVGValueSource, StrengthPoint } from '@/app/types/report';
import {
  EditedSurveyDataRow,
  EditedDCPDataRow,
  DCPDataStationKey,
  DCPDataAnomalyKey,
  SurveyStationKey,
  SurveyAnomalyKey,
  SurveyCommentKey, DCPDataAnomaly_MARK_DCVG_SIDE_DRAIN, DCPDataAnomaly_DCVG_ANOMALY_TOTAL, SurveyDSVGVoltageKeys,
  SurveyAnomaly_SURVEY_TP_MARKER, DCPDataDCVGValueKey, SurveyOnVoltageKey, SurveyOffVoltageKey,
} from '@/app/types/survey';

// ── Exported types ────────────────────────────────────────────────────────────

export interface DCVGCandidate {
  value: number;
  source: string;
}

export interface StrengthPointCandidate {
  value: number;   // station number
  source: string;  // e.g., "TP 5", "first station", "last station"
  vOn: number;
  vOff: number;
}

export interface SuggestedAnomaly {
  station: number;
  anomalyCol: string;  // value from DCP/Feature/DCVG Anomaly column
  comment: string;     // value from Comment column
}

// ── Internal types ────────────────────────────────────────────────────────────

export type TpNameSource = 'dcp data' | 'survey data' | 'survey data +-4';
export type TpStationSource = 'dcp data' | 'survey data';

export type TpMeta = {
  tpNumber: number;
  station: number;
  stationSource: TpStationSource;
  nameSource: TpNameSource;
  vOn: number;
  vOff: number;
};

type DCVGCalcResult = { sum: number; from: number; to: number; stoppedBySkip: boolean };

// ── Constants ─────────────────────────────────────────────────────────────────

const DCP_TP_PREFIX_REGEX = /^tp/i;
const DCP_TP_NUMBER_REGEX = /^tp\s*(\d+)/i;
const COMMENT_TP_REGEX = /\btp\s*(\d+)/i;

const TP_SEARCH_RADIUS = 4;

// ── Low-level helpers ─────────────────────────────────────────────────────────

// Matches any DCP anomaly value that starts with "Mark DCVG" or equals "DCVG Anomaly"
function isDCVGAnomalyMarker(marker: string): boolean {
  const s = marker.trim();
  return s.startsWith('Mark DCVG') || s === 'DCVG Anomaly';
}

function getVoltages(
  station: number,
  surveyByStation: Map<number, EditedSurveyDataRow[]>
): { vOn: number; vOff: number } {
  const rows = surveyByStation.get(station) ?? [];
  const vOn = Number(rows.find(r => r[SurveyOnVoltageKey] !== undefined)?.[SurveyOnVoltageKey]) ?? 0;
  const vOff = Number(rows.find(r => r[SurveyOffVoltageKey] !== undefined)?.[SurveyOffVoltageKey]) ?? 0;
  // TODO: should check for mismatch here and log
  return { vOn, vOff };
}

function getDCVGVoltageMv(
  station: number,
  surveyByStation: Map<number, EditedSurveyDataRow[]>
): number | null {
  const raw = surveyByStation.get(station)
    ?.find(r => r[SurveyDSVGVoltageKeys[0]] !== undefined)
    ?.[SurveyDSVGVoltageKeys[0]] as number | undefined;
  return (raw !== undefined && raw !== null && raw !== 0) ? raw * 1000 : null; // V → mV
}

// Walk forward (direction=1) or backward (direction=-1) from anomalyStation by stationDiff steps,
// summing |DCVG Voltage| (mV) while values share the sign of the first encountered station.
// Stops when the next expected station is missing (skip) or on a sign change.
// Also includes the anomaly station itself if its voltage matches the established sign.
function calcDCVGValue(
  anomalyStation: number,
  surveyByStation: Map<number, EditedSurveyDataRow[]>,
  stationDiff: number,
  direction: 1 | -1
): DCVGCalcResult | null {
  let sum = 0;
  let firstSign: 1 | -1 | null = null;
  let fromStation: number | null = null;
  let toStation: number | null = null;
  let stoppedBySkip = false;

  for (let cur = anomalyStation + direction * stationDiff; ; cur += direction * stationDiff) {
    if (!surveyByStation.has(cur)) {
      stoppedBySkip = toStation !== null;
      break;
    }

    const voltageMv = getDCVGVoltageMv(cur, surveyByStation);
    if (voltageMv === null) continue;

    const sign: 1 | -1 = voltageMv > 0 ? 1 : -1;
    if (firstSign === null) {
      firstSign = sign;
      fromStation = cur;
    } else if (sign !== firstSign) {
      break;
    }

    sum += Math.abs(voltageMv);
    toStation = cur;
  }

  if (firstSign === null) return null;

  // if DCVG voltage of the anomaly point has the same sign as all the next ones in this direction - add it to the sum
  const anomalyVoltageMv = getDCVGVoltageMv(anomalyStation, surveyByStation);
  if (anomalyVoltageMv !== null && (anomalyVoltageMv > 0 ? 1 : -1) === firstSign) {
    sum += Math.abs(anomalyVoltageMv);
    fromStation = anomalyStation;
  }

  return { sum, from: fromStation!, to: toStation!, stoppedBySkip };
}

// Search for TP number in survey comment at centerIdx, then ±TP_SEARCH_RADIUS rows
function findTpNumberFromSurvey(
  surveyData: EditedSurveyDataRow[],
  centerIdx: number
): { tpNumber: number; nameSource: TpNameSource } | null {
  const ownMatch = surveyData[centerIdx][SurveyCommentKey]?.toString().match(COMMENT_TP_REGEX);
  if (ownMatch) {
    return { tpNumber: parseInt(ownMatch[1]), nameSource: 'survey data' };
  }
  for (let dist = 1; dist <= TP_SEARCH_RADIUS; dist++) {
    for (const dir of [-1, 1]) {
      const idx = centerIdx + dist * dir;
      if (idx < 0 || idx >= surveyData.length) continue;
      if (surveyData[idx][SurveyAnomalyKey] === SurveyAnomaly_SURVEY_TP_MARKER) continue;
      const nearMatch = surveyData[idx][SurveyCommentKey]?.toString().match(COMMENT_TP_REGEX);
      if (nearMatch) {
        return { tpNumber: parseInt(nearMatch[1]), nameSource: 'survey data +-4' };
      }
    }
  }
  return null;
}

// ── Grouping ──────────────────────────────────────────────────────────────────

export function groupDcpByStation(dcpData: EditedDCPDataRow[]): Map<number, EditedDCPDataRow[]> {
  const map = new Map<number, EditedDCPDataRow[]>();
  for (const row of dcpData) {
    const station = Number(row[DCPDataStationKey]);
    if (!map.has(station)) map.set(station, []);
    map.get(station)!.push(row);
  }
  return map;
}

export function groupSurveyByStation(surveyData: EditedSurveyDataRow[]): {
  surveyByStation: Map<number, EditedSurveyDataRow[]>;
  surveyIndexByStation: Map<number, number[]>;
} {
  const surveyByStation = new Map<number, EditedSurveyDataRow[]>();
  const surveyIndexByStation = new Map<number, number[]>();
  for (let i = 0; i < surveyData.length; i++) {
    const station = Number(surveyData[i][SurveyStationKey]);
    if (!surveyByStation.has(station)) {
      surveyByStation.set(station, []);
      surveyIndexByStation.set(station, []);
    }
    surveyByStation.get(station)!.push(surveyData[i]);
    surveyIndexByStation.get(station)!.push(i);
  }
  return { surveyByStation, surveyIndexByStation };
}

// ── Anomaly stations ──────────────────────────────────────────────────────────

export function findAnomalyStations(
  dcpData: EditedDCPDataRow[],
  surveyData: EditedSurveyDataRow[]
): Map<number, { marker: string }> {
  const anomalyStations = new Map<number, { marker: string }>();

  for (const row of dcpData) {
    const marker = row[DCPDataAnomalyKey]?.toString() ?? '';
    if (marker && isDCVGAnomalyMarker(marker)) {
      const station = Number(row[DCPDataStationKey]);
      if (!anomalyStations.has(station)) anomalyStations.set(station, { marker });
    }
  }

  for (const row of surveyData) {
    const marker = row[SurveyAnomalyKey]?.toString() ?? '';
    if (marker && isDCVGAnomalyMarker(marker)) {
      const station = Number(row[SurveyStationKey]);
      if (!anomalyStations.has(station)) anomalyStations.set(station, { marker });
    }
  }

  console.log('[useAnomalyReport] dcpData length:', dcpData.length, '| surveyData length:', surveyData.length);
  console.log('[useAnomalyReport] unique DCP/Feature/Anomaly values:', [...new Set(dcpData.map(r => r[DCPDataAnomalyKey]))]);
  console.log('[useAnomalyReport] unique DCP/Feature/DCVG Anomaly values:', [...new Set(surveyData.map(r => r[SurveyAnomalyKey]))]);
  console.log('[useAnomalyReport] anomaly stations found:', [...anomalyStations.entries()].map(([s, v]) => `${s}: ${v.marker}`));

  return anomalyStations;
}

// Stations in surveyData that mention "Mark DCVG" or "DCVG Anomaly" in either the
// anomaly column or the comment column, but are NOT already in anomalyStations.
export function findAdditionalSuggestedAnomalies(
  surveyData: EditedSurveyDataRow[],
  anomalyStations: Map<number, { marker: string }>
): SuggestedAnomaly[] {
  const seen = new Set<number>();
  const additional: SuggestedAnomaly[] = [];

  for (const row of surveyData) {
    const station = Number(row[SurveyStationKey]);
    if (anomalyStations.has(station) || seen.has(station)) continue;

    const anomalyCol = row[SurveyAnomalyKey]?.toString() ?? '';
    const comment = row[SurveyCommentKey]?.toString() ?? '';

    const matchedInAnomalyCol = anomalyCol && isDCVGAnomalyMarker(anomalyCol);
    const matchedInComment = comment.includes('Mark DCVG') || comment.includes('DCVG Anomaly');

    if (matchedInAnomalyCol || matchedInComment) {
      seen.add(station);
      additional.push({ station, anomalyCol, comment });
    }
  }

  additional.sort((a, b) => a.station - b.station);
  console.log('[useAnomalyReport] additional suggested anomaly stations:', additional.map(a => `${a.station}: ${a.anomalyCol} / ${a.comment}`));
  return additional;
}

// ── Test points (strength points) ─────────────────────────────────────────────

export function buildTpMap(
  dcpData: EditedDCPDataRow[],
  surveyData: EditedSurveyDataRow[],
  surveyByStation: Map<number, EditedSurveyDataRow[]>,
  surveyIndexByStation: Map<number, number[]>
): Map<number, TpMeta> {
  // Key: TP number. DCP entries take precedence over survey entries.
  const tpMap = new Map<number, TpMeta>();

  // Step 1 – DCPData: any row whose DCP/Feature/Anomaly starts with "tp"
  for (const row of dcpData) {
    const anomaly = row[DCPDataAnomalyKey]?.toString() ?? '';
    if (!DCP_TP_PREFIX_REGEX.test(anomaly)) continue;

    const station = Number(row[DCPDataStationKey]);
    const numberMatch = anomaly.match(DCP_TP_NUMBER_REGEX);
    let tpNumber: number | null = null;
    let nameSource: TpNameSource = 'dcp data';

    if (numberMatch) {
      tpNumber = parseInt(numberMatch[1]);
    } else {
      // No number in DCP value → search survey comments for this station
      const indices = surveyIndexByStation.get(station) ?? [];
      for (const idx of indices) {
        const result = findTpNumberFromSurvey(surveyData, idx);
        if (result) {
          tpNumber = result.tpNumber;
          nameSource = result.nameSource;
          break;
        }
      }
    }

    if (tpNumber === null || tpMap.has(tpNumber)) continue;
    const { vOn, vOff } = getVoltages(station, surveyByStation);
    tpMap.set(tpNumber, { tpNumber, station, stationSource: 'dcp data', nameSource, vOn, vOff });
  }

  // Step 2 – SurveyData: Single Test St rows, TP number from comment (±4 rows)
  for (let i = 0; i < surveyData.length; i++) {
    const row = surveyData[i];
    if (row[SurveyAnomalyKey] !== SurveyAnomaly_SURVEY_TP_MARKER) continue;

    const station = Number(row[SurveyStationKey]);
    const result = findTpNumberFromSurvey(surveyData, i);
    if (!result) continue;

    const { tpNumber, nameSource } = result;
    if (tpMap.has(tpNumber)) continue; // DCP takes precedence

    const { vOn, vOff } = getVoltages(station, surveyByStation);
    tpMap.set(tpNumber, { tpNumber, station, stationSource: 'survey data', nameSource, vOn, vOff });
  }

  console.log(
    '[useAnomalyReport] strength points found:',
    [...tpMap.values()]
      .sort((a, b) => a.tpNumber - b.tpNumber)
      .map(tp => ({
        name: `tp ${tp.tpNumber}`,
        station: tp.station,
        stationSource: tp.stationSource,
        nameSource: tp.nameSource,
        vOn: tp.vOn,
        vOff: tp.vOff,
      }))
  );

  return tpMap;
}

export function toStrengthPoint(tp: TpMeta): StrengthPoint {
  return { station: tp.station, vOn: tp.vOn, vOff: tp.vOff };
}

// ── Anomalies ─────────────────────────────────────────────────────────────────

const isCalcSource = (source: string) => source.startsWith('calculated');
const isValidDCVGValue = (c: DCVGCandidate) => c.value !== 0 && !String(c.value).includes('e');

export function buildAnomalies(
  anomalyStations: Map<number, { marker: string }>,
  dcpByStation: Map<number, EditedDCPDataRow[]>,
  surveyByStation: Map<number, EditedSurveyDataRow[]>,
  tpsByStation: TpMeta[],
  stationDiff: number
): { anomalies: Anomaly[]; dcvgCandidates: Map<number, DCVGCandidate[]> } {
  const anomalies: Anomaly[] = [];
  const dcvgCandidates = new Map<number, DCVGCandidate[]>();

  for (const [station] of anomalyStations) {
    const dcpRows = dcpByStation.get(station) ?? [];
    const candidates: DCVGCandidate[] = [];

    // Mark DCVG: DCVG Side Drain (highest priority)
    const markDrainRow = dcpRows.find(r => r[DCPDataAnomalyKey]?.toString() === DCPDataAnomaly_MARK_DCVG_SIDE_DRAIN);
    const markDrainValue = markDrainRow?.[DCPDataDCVGValueKey] as number | undefined;
    if (markDrainValue != null) {
      candidates.push({ value: markDrainValue, source: DCPDataAnomaly_MARK_DCVG_SIDE_DRAIN });
    }

    // DCVG Anomaly: DCVG Max/Total (second priority) // TODO: check again
    const anomalyDrainRow = dcpRows.find(r => r[DCPDataAnomalyKey]?.toString() === DCPDataAnomaly_DCVG_ANOMALY_TOTAL);
    const anomalyDrainValue = anomalyDrainRow?.[DCPDataDCVGValueKey] as number | undefined;
    if (anomalyDrainValue != null) {
      candidates.push({ value: anomalyDrainValue, source: DCPDataAnomaly_DCVG_ANOMALY_TOTAL });
    }

    // Calculated DCVG from survey DCVG Voltage (forward and backward from anomaly station)
    const fwd = calcDCVGValue(station, surveyByStation, stationDiff, 1);
    const bwd = calcDCVGValue(station, surveyByStation, stationDiff, -1);

    if (fwd !== null) {
      const toLabel = fwd.stoppedBySkip ? `${fwd.to} (before skip)` : `${fwd.to}`;
      candidates.push({ value: fwd.sum, source: `calculated after (sum from station ${fwd.from} to ${toLabel})` });
    }
    if (bwd !== null) {
      const toLabel = bwd.stoppedBySkip ? `${bwd.to} (before skip)` : `${bwd.to}`;
      candidates.push({ value: bwd.sum, source: `calculated before (sum from station ${bwd.from} to ${toLabel})` });
    }

    console.log(`Station ${station}: DCVG candidates:`, candidates);
    dcvgCandidates.set(station, candidates);

    // Selection: prefer side drain sources in order; fall back to max of calculated if invalid
    const markSideDrain = candidates.find(c => c.source === DCPDataAnomaly_MARK_DCVG_SIDE_DRAIN && isValidDCVGValue(c));
    const anomalyTotal = candidates.find(c => c.source === DCPDataAnomaly_DCVG_ANOMALY_TOTAL && isValidDCVGValue(c));
    const calcCandidates = candidates.filter(c => isCalcSource(c.source) && isValidDCVGValue(c));
    const maxCalc = calcCandidates.length > 0 ? calcCandidates.reduce((a, b) => a.value >= b.value ? a : b) : undefined;

    const selectedCandidate = markSideDrain ?? anomalyTotal ?? maxCalc;

    const dcvgValue: DCVGValue = {
      value: selectedCandidate?.value ?? 0,
      source: (selectedCandidate && !isCalcSource(selectedCandidate.source) ? 'Side Drain' : 'Calculated') as DCVGValueSource,
    };

    // Collect coordinates from all DCP and survey rows for this station
    const allCoords: { origin: string; coord: Coordinate }[] = [];

    for (const row of dcpRows) {
      const lat = row['Latitude'] as number | undefined;
      const lon = row['Longitude'] as number | undefined;
      const alt = row['Altitude'] as number | undefined;
      if (lat !== undefined || lon !== undefined || alt !== undefined) {
        allCoords.push({ origin: 'dcp data', coord: { latitude: lat, longitude: lon, altitude: alt } });
      }
    }

    for (const row of surveyByStation.get(station) ?? []) {
      const lat = row['Latitude'] as number | undefined;
      const lon = row['Longitude'] as number | undefined;
      const alt = row['Altitude'] as number | undefined;
      if (lat !== undefined || lon !== undefined || alt !== undefined) {
        allCoords.push({ origin: 'survey data', coord: { latitude: lat, longitude: lon, altitude: alt } });
      }
    }

    let coordinate: Coordinate | undefined;
    if (allCoords.length > 0) {
      coordinate = allCoords[0].coord;
      const mismatch = allCoords.some(
        ({ coord: c }) =>
          c.latitude !== coordinate!.latitude ||
          c.longitude !== coordinate!.longitude ||
          c.altitude !== coordinate!.altitude
      );
      if (mismatch) {
        console.log(
          `Station ${station}: coordinate mismatch across rows:`,
          allCoords.map(({ origin, coord }) => ({ origin, ...coord }))
        );
      }
    }

    // Flanking strength points: closest TP with station ≤ anomaly (left) and > anomaly (right)
    const leftTp = [...tpsByStation].reverse().find(tp => tp.station <= station);
    const rightTp = tpsByStation.find(tp => tp.station > station);

    anomalies.push({
      station,
      dcvgValue,
      coordinate,
      strengthPoint1: leftTp ? toStrengthPoint(leftTp) : undefined,
      strengthPoint2: rightTp ? toStrengthPoint(rightTp) : undefined,
    });
  }

  return { anomalies, dcvgCandidates };
}

// ── Strength point candidates ─────────────────────────────────────────────────

// Build strengthPointsCandidates: TPs with "TP N" label, plus first/last station only if not already a TP.
export function buildStrengthPointsCandidates(
  strengthPoints: StrengthPoint[],
  allStations: number[],
  surveyByStation: Map<number, EditedSurveyDataRow[]>
): StrengthPointCandidate[] {
  const firstStation = allStations[0];
  const lastStation = allStations[allStations.length - 1];

  const candidateLabels = new Map<number, string>();
  strengthPoints.forEach((sp, i) => candidateLabels.set(sp.station, `TP ${i + 1}`));
  if (firstStation !== undefined && !candidateLabels.has(firstStation)) {
    candidateLabels.set(firstStation, 'first station');
  }
  if (lastStation !== undefined && lastStation !== firstStation && !candidateLabels.has(lastStation)) {
    candidateLabels.set(lastStation, 'last station');
  }

  return [...candidateLabels.entries()]
    .sort(([a], [b]) => a - b)
    .map(([station, source]) => {
      const v = getVoltages(station, surveyByStation);
      return { value: station, source, vOn: v.vOn, vOff: v.vOff };
    });
}

// Returns most common positive gap between consecutive unique station numbers
export function computeStationDiff(uniqueStations: number[]): number {
  if (uniqueStations.length < 2) return 1;
  const counts = new Map<number, number>();
  for (let i = 1; i < uniqueStations.length; i++) {
    const d = Math.round(uniqueStations[i] - uniqueStations[i - 1]);
    if (d > 0) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let best = 1, bestCount = 0;
  for (const [d, c] of counts) {
    if (c > bestCount || (c === bestCount && d < best)) { bestCount = c; best = d; }
  }
  return best;
}
