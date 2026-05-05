"use client";

import { useMemo } from 'react';
import { Anomaly, AnomalyReport, Coordinate, DCVGValue, DCVGValueSource, StrengthPoint } from '@/app/types/report';
import {
  EditedSurveyDataRow,
  EditedDCPDataRow,
  DCPDataStationKey,
  DCPDataAnomalyKey,
  DCPDCVGValueKeys,
  SurveyStationKey,
  SurveyAnomalyKey,
  SurveyCommentKey,
} from '@/app/types/survey';

// Matches any DCP anomaly value that starts with "Mark DCVG" or equals "DCVG Anomaly"
function isDCVGAnomalyMarker(marker: string): boolean {
  const s = marker.trim();
  return s.startsWith('Mark DCVG') || s === 'DCVG Anomaly';
}

// Specific DCP row type that carries the actual measured Side Drain value in Value1
const MARK_DCVG_SIDE_DRAIN = 'Mark DCVG: DCVG Side Drain';
const DCVG_ANOMALY_TOTAL = 'DCVG Anomaly: DCVG Max/Total';

// Matches any DCP anomaly value starting with "tp" (number is optional — may be in survey comments)
const DCP_TP_PREFIX_REGEX = /^tp/i;
const DCP_TP_NUMBER_REGEX = /^tp\s*(\d+)/i;
// Matches "tp6", "tp 6", "TP6" anywhere in a comment string
const COMMENT_TP_REGEX = /\btp\s*(\d+)/i;

const SURVEY_TP_MARKER = 'Single Test St';
const TP_SEARCH_RADIUS = 4;

type TpNameSource = 'dcp data' | 'survey data' | 'survey data +-4';
type TpStationSource = 'dcp data' | 'survey data';

type TpMeta = {
  tpNumber: number;
  station: number;
  stationSource: TpStationSource;
  nameSource: TpNameSource;
  vOn: number;
  vOff: number;
};

function getVoltages(
  station: number,
  surveyByStation: Map<number, EditedSurveyDataRow[]>
): { vOn: number; vOff: number } {
  const rows = surveyByStation.get(station) ?? [];
  const vOn = rows.find(r => r['On Voltage'] !== undefined)?.['On Voltage'] ?? 0;
  const vOff = rows.find(r => r['Off Voltage'] !== undefined)?.['Off Voltage'] ?? 0;
  return { vOn, vOff };
}

const SURVEY_DCVG_VOLTAGE_KEY = 'DCVG Voltage' as keyof EditedSurveyDataRow;

type DCVGCalcResult = { sum: number; from: number; to: number; stoppedBySkip: boolean };

// Returns most common positive gap between consecutive unique station numbers
function computeStationDiff(uniqueStations: number[]): number {
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

function getDCVGVoltageMv(
  station: number,
  surveyByStation: Map<number, EditedSurveyDataRow[]>
): number | null {
  const raw = surveyByStation.get(station)
    ?.find(r => r[SURVEY_DCVG_VOLTAGE_KEY] !== undefined)
    ?.[SURVEY_DCVG_VOLTAGE_KEY] as number | undefined;
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

  // Include the anomaly station itself if its voltage matches the established sign
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
      if (surveyData[idx][SurveyAnomalyKey] === SURVEY_TP_MARKER) continue;
      const nearMatch = surveyData[idx][SurveyCommentKey]?.toString().match(COMMENT_TP_REGEX);
      if (nearMatch) {
        return { tpNumber: parseInt(nearMatch[1]), nameSource: 'survey data +-4' };
      }
    }
  }
  return null;
}

export const useAnomalyReport = (
  surveyData: EditedSurveyDataRow[],
  dcpData: EditedDCPDataRow[],
  stationDiff: number
): AnomalyReport => {
  return useMemo(() => {
    // Group DCP rows by station
    const dcpByStation = new Map<number, EditedDCPDataRow[]>();
    for (const row of dcpData) {
      const station = Number(row[DCPDataStationKey]);
      if (!dcpByStation.has(station)) dcpByStation.set(station, []);
      dcpByStation.get(station)!.push(row);
    }

    // Group survey rows by station, also tracking array indices for ±4 searches
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

    // ── DCVG anomaly stations ─────────────────────────────────────────────────
    const anomalyStations = new Map<number, { marker: string }>();

    for (const row of dcpData) {
      const marker = row[DCPDataAnomalyKey]?.toString() ?? '';
      if (marker && isDCVGAnomalyMarker(marker)) {
        const station = Number(row[DCPDataStationKey]);
        if (!anomalyStations.has(station)) {
          anomalyStations.set(station, { marker });
        }
      }
    }

    for (const row of surveyData) {
      const marker = row[SurveyAnomalyKey]?.toString() ?? '';
      if (marker && isDCVGAnomalyMarker(marker)) {
        const station = Number(row[SurveyStationKey]);
        if (!anomalyStations.has(station)) {
          anomalyStations.set(station, { marker });
        }
      }
    }

    console.log('[useAnomalyReport] dcpData length:', dcpData.length, '| surveyData length:', surveyData.length);
    console.log('[useAnomalyReport] unique DCP/Feature/Anomaly values:', [...new Set(dcpData.map(r => r[DCPDataAnomalyKey]))]);
    console.log('[useAnomalyReport] unique DCP/Feature/DCVG Anomaly values:', [...new Set(surveyData.map(r => r[SurveyAnomalyKey]))]);
    console.log('[useAnomalyReport] anomaly stations found:', [...anomalyStations.entries()].map(([s, v]) => `${s}: ${v.marker}`));

    // ── Strength points (test points) ─────────────────────────────────────────
    // Key: TP number. DCP entries take precedence over survey entries.
    const tpMap = new Map<number, TpMeta>();

    // Step 1 – DCPData: any row whose DCP/Feature/Anomaly starts with "tp"
    for (const row of dcpData) {
      const anomaly = row[DCPDataAnomalyKey]?.toString() ?? '';
      if (!DCP_TP_PREFIX_REGEX.test(anomaly)) continue;

      const station = Number(row[DCPDataStationKey]);

      // Try to get TP number from the DCP anomaly value itself
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

      if (tpNumber === null) continue;
      if (tpMap.has(tpNumber)) continue;

      const { vOn, vOff } = getVoltages(station, surveyByStation);
      tpMap.set(tpNumber, { tpNumber, station, stationSource: 'dcp data', nameSource, vOn, vOff });
    }

    // Step 2 – SurveyData: Single Test St rows, TP number from comment (±4 rows)
    for (let i = 0; i < surveyData.length; i++) {
      const row = surveyData[i];
      if (row[SurveyAnomalyKey] !== SURVEY_TP_MARKER) continue;

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

    const strengthPoints: StrengthPoint[] = [...tpMap.values()]
      .sort((a, b) => a.tpNumber - b.tpNumber)
      .map(({ station, vOn, vOff }) => ({ station, vOn, vOff }));

    // Sorted by station for flanking lookup
    const tpsByStation = [...tpMap.values()].sort((a, b) => a.station - b.station);

    function toStrengthPoint(tp: TpMeta): StrengthPoint {
      return { station: tp.station, vOn: tp.vOn, vOff: tp.vOff };
    }

    // ── Build anomalies ───────────────────────────────────────────────────────
    type DCVGCandidate = { value: number; source: string };
    const isCalcSource = (source: string) => source.startsWith('calculated');
    const isValid = (c: DCVGCandidate) => !String(c.value).includes('e');

    const anomalies: Anomaly[] = [];

    for (const [station] of anomalyStations) {
      const dcpRows = dcpByStation.get(station) ?? [];
      const dcvgCandidates: DCVGCandidate[] = [];

      // Mark DCVG: DCVG Side Drain (highest priority)
      const markDrainRow = dcpRows.find(r => r[DCPDataAnomalyKey]?.toString() === MARK_DCVG_SIDE_DRAIN);
      const markDrainValue = markDrainRow?.['Value1'] as number | undefined;
      if (markDrainValue !== undefined && markDrainValue !== 0) {
        dcvgCandidates.push({ value: markDrainValue, source: MARK_DCVG_SIDE_DRAIN });
      }

      // DCVG Anomaly: DCVG Side Drain (second priority)
      const anomalyDrainRow = dcpRows.find(r => r[DCPDataAnomalyKey]?.toString() === DCVG_ANOMALY_TOTAL);
      const anomalyDrainValue = anomalyDrainRow?.['Value1'] as number | undefined;
      if (anomalyDrainValue !== undefined && anomalyDrainValue !== 0) {
        dcvgCandidates.push({ value: anomalyDrainValue, source: DCVG_ANOMALY_TOTAL });
      }

      // Calculated DCVG from survey DCVG Voltage (forward and backward from anomaly station)
      const fwd = calcDCVGValue(station, surveyByStation, stationDiff, 1);
      const bwd = calcDCVGValue(station, surveyByStation, stationDiff, -1);

      if (fwd !== null) {
        const toLabel = fwd.stoppedBySkip ? `${fwd.to} (before skip)` : `${fwd.to}`;
        dcvgCandidates.push({ value: fwd.sum, source: `calculated after (sum from station ${fwd.from} to ${toLabel})` });
      }
      if (bwd !== null) {
        const toLabel = bwd.stoppedBySkip ? `${bwd.to} (before skip)` : `${bwd.to}`;
        dcvgCandidates.push({ value: bwd.sum, source: `calculated before (sum from station ${bwd.from} to ${toLabel})` });
      }

      console.log(`Station ${station}: DCVG candidates:`, dcvgCandidates);

      // Selection: prefer side drain sources in order; fall back to max of calculated if invalid
      const markSideDrain = dcvgCandidates.find(c => c.source === MARK_DCVG_SIDE_DRAIN && isValid(c));
      const anomalyTotal = dcvgCandidates.find(c => c.source === DCVG_ANOMALY_TOTAL && isValid(c));
      const calcCandidates = dcvgCandidates.filter(c => isCalcSource(c.source) && isValid(c));
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

    return { anomalies, strengthPoints };
  }, [surveyData, dcpData, stationDiff]);
};
