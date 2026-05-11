"use client";

import React from 'react';
import { StrengthPoint } from '@/app/types/report';
import { StrengthPointCandidate } from '@/app/hooks/useAnomalyReportCreator';
import StationSelectorEditor from './StationSelectorEditor';

export interface StrengthPointCellEditorProps {
  candidates: StrengthPointCandidate[];
  allMeasuredStations?: Map<number, { vOn: number; vOff: number }>;
  stationDiff?: number;
  currentSp: StrengthPoint | undefined;
  onSave: (sp: StrengthPoint) => void;
  onCancel: () => void;
}

const StrengthPointCellEditor: React.FC<StrengthPointCellEditorProps> = ({
  candidates, allMeasuredStations, stationDiff, currentSp, onSave, onCancel,
}) => {
  const options = candidates.map(c => ({ station: c.value, label: `${c.value} - ${c.source}` }));

  const handleSelect = (station: number) => {
    const candidate = candidates.find(c => c.value === station);
    if (candidate) {
      onSave({ station: candidate.value, vOn: candidate.vOn, vOff: candidate.vOff });
      return;
    }
    const v = allMeasuredStations?.get(station);
    if (v) onSave({ station, vOn: v.vOn, vOff: v.vOff });
  };

  return (
    <StationSelectorEditor
      options={options}
      onSelect={handleSelect}
      onCancel={onCancel}
      allMeasuredStations={allMeasuredStations}
      stationDiff={stationDiff}
    />
  );
};

export default StrengthPointCellEditor;
