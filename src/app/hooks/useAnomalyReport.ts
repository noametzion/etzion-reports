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

const ANOMALY_MARKERS = ['Mark DCVG', 'DCVG Anomaly'] as const;

const ANOMALY_SOURCE_MAP: Record<string, DCVGValueSource> = {
  'Mark DCVG': 'SideDrain',
  'DCVG Anomaly': 'Calculated',
};

// Matches "tp8: Pipe To Soil", "tp12: Pipe to Soil", etc.
const DCP_TP_REGEX = /^tp\s*(\d+).*pipe\s+to\s+soil/i;
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

export const useAnomalyReport = (
  surveyData: EditedSurveyDataRow[],
  dcpData: EditedDCPDataRow[]
): AnomalyReport => {
  return useMemo(() => {
    // Group DCP rows by station
    const dcpByStation = new Map<number, EditedDCPDataRow[]>();
    for (const row of dcpData) {
      const station = Number(row[DCPDataStationKey]);
      if (!dcpByStation.has(station)) dcpByStation.set(station, []);
      dcpByStation.get(station)!.push(row);
    }

    // Group survey rows by station
    const surveyByStation = new Map<number, EditedSurveyDataRow[]>();
    for (const row of surveyData) {
      const station = Number(row[SurveyStationKey]);
      if (!surveyByStation.has(station)) surveyByStation.set(station, []);
      surveyByStation.get(station)!.push(row);
    }

    // ── DCVG anomaly stations ─────────────────────────────────────────────────
    const anomalyStations = new Map<number, { source: DCVGValueSource; marker: string }>();

    for (const row of dcpData) {
      const marker = row[DCPDataAnomalyKey];
      if (marker && (ANOMALY_MARKERS as readonly string[]).includes(marker.toString())) {
        const station = Number(row[DCPDataStationKey]);
        if (!anomalyStations.has(station)) {
          anomalyStations.set(station, { source: ANOMALY_SOURCE_MAP[marker] ?? 'Calculated', marker: marker.toString() });
        }
      }
    }

    for (const row of surveyData) {
      const marker = row[SurveyAnomalyKey];
      if (marker && (ANOMALY_MARKERS as readonly string[]).includes(marker.toString())) {
        const station = Number(row[SurveyStationKey]);
        if (!anomalyStations.has(station)) {
          anomalyStations.set(station, { source: ANOMALY_SOURCE_MAP[marker] ?? 'Calculated', marker: marker.toString() });
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

    // Step 1 – DCPData: tp<N>: Pipe To Soil
    for (const row of dcpData) {
      const anomaly = row[DCPDataAnomalyKey];
      if (!anomaly) continue;
      const match = anomaly.toString().match(DCP_TP_REGEX);
      if (!match) continue;
      const tpNumber = parseInt(match[1]);
      const station = Number(row[DCPDataStationKey]);
      const { vOn, vOff } = getVoltages(station, surveyByStation);
      if (!tpMap.has(tpNumber)) {
        tpMap.set(tpNumber, { tpNumber, station, stationSource: 'dcp data', nameSource: 'dcp data', vOn, vOff });
      }
    }

    // Step 2 – SurveyData: Single Test St rows, TP number from comment (±4 rows)
    for (let i = 0; i < surveyData.length; i++) {
      const row = surveyData[i];
      if (row[SurveyAnomalyKey] !== SURVEY_TP_MARKER) continue;

      const station = Number(row[SurveyStationKey]);

      // Try own comment first
      let tpNumber: number | null = null;
      let nameSource: TpNameSource = 'survey data';

      const ownMatch = row[SurveyCommentKey]?.toString().match(COMMENT_TP_REGEX);
      if (ownMatch) {
        tpNumber = parseInt(ownMatch[1]);
      } else {
        // Search ±radius rows by ascending distance; skip rows that are themselves marked as TP
        outer: for (let dist = 1; dist <= TP_SEARCH_RADIUS; dist++) {
          for (const dir of [-1, 1]) {
            const idx = i + dist * dir;
            if (idx < 0 || idx >= surveyData.length) continue;
            const nearRow = surveyData[idx];
            if (nearRow[SurveyAnomalyKey] === SURVEY_TP_MARKER) continue;
            const nearMatch = nearRow[SurveyCommentKey]?.toString().match(COMMENT_TP_REGEX);
            if (nearMatch) {
              tpNumber = parseInt(nearMatch[1]);
              nameSource = 'survey data +-4';
              break outer;
            }
          }
        }
      }

      if (tpNumber === null) continue;
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

    // ── Build anomalies ───────────────────────────────────────────────────────
    const anomalies: Anomaly[] = [];

    for (const [station, { source }] of anomalyStations) {
      const dcpRows = dcpByStation.get(station) ?? [];

      // Collect all non-zero DCVG values from Value1/2/3 across all DCP rows for this station
      const dcvgCandidates: number[] = [];
      for (const row of dcpRows) {
        for (const key of DCPDCVGValueKeys) {
          const val = row[key] as number;
          if (val !== null && val !== undefined && val !== 0) {
            dcvgCandidates.push(val);
          }
        }
      }

      if (dcvgCandidates.length > 1) {
        console.log(`Station ${station}: multiple DCVG values found:`, dcvgCandidates);
      }

      const dcvgValue: DCVGValue = {
        value: dcvgCandidates[0] ?? 0,
        source,
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

      anomalies.push({ station, dcvgValue, coordinate });
    }

    return { anomalies, strengthPoints };
  }, [surveyData, dcpData]);
};
