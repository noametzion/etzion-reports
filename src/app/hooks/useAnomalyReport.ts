"use client";

import { useMemo } from 'react';
import { Anomaly, AnomalyReport, Coordinate, DCVGValue, DCVGValueSource } from '@/app/types/report';
import {
  EditedSurveyDataRow,
  EditedDCPDataRow,
  DCPDataStationKey,
  DCPDataAnomalyKey,
  DCPDCVGValueKeys,
  SurveyStationKey,
  SurveyAnomalyKey,
} from '@/app/types/survey';

const ANOMALY_MARKERS = ['Mark DCVG', 'DCVG Anomaly'] as const;

const ANOMALY_SOURCE_MAP: Record<string, DCVGValueSource> = {
  'Mark DCVG': 'SideDrain',
  'DCVG Anomaly': 'Calculated',
};

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

    // Collect anomaly stations from both data sources
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

    return { anomalies };
  }, [surveyData, dcpData]);
};
