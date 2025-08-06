"use client";

import React, {useState, useEffect, useCallback} from 'react';
import {
  SurveyDSVGVoltageKeys,
  SurveyInfoNameKey,
  SurveyOnOffVoltageKeys,
  SurveyStationKeys,
  Survey,
  SurveyDataRow,
  SurveyCommentKey,
  SurveyDistanceKey,
  EditableType,
  EditableTypeName,
  EditableColumnHeaders, EditedSurvey, SurveyStationKey, SurveyAnomalyKey
} from '@/app/types/survey';
import styles from './SurveySheet.module.css';
import {FaInfoCircle, FaPencilAlt} from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';
import ErrorPanel from './ErrorPanel';
import {useFocusDistance} from "@/app/hooks/useFocusDistance";
import EditPopover from "./EditPopover";
import {useSuggester} from "@/app/hooks/useSuggester";

interface SurveySheetProps {
  originalSurvey: Survey;
  editedSurvey: EditedSurvey;
  surveyFileName: string;
  shouldFocus: boolean;
}

interface ErrorCell {
  rowIndex: number;
  columnName: keyof SurveyDataRow;
}

interface PopoverState {
  rowIndex: number;
  columnName: keyof SurveyDataRow;
  value: EditableType | undefined;
  type?: EditableTypeName;
  top: number;
  left: number;
}

const SurveySheet: React.FC<SurveySheetProps> = ({
  originalSurvey,
  editedSurvey,
  shouldFocus
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [errorCells, setErrorCells] = useState<ErrorCell[]>([]);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [editedSurveyData, setEditedSurveyData] = useState<SurveyDataRow[]>(editedSurvey.surveyData);
  const surveyName = originalSurvey.surveyInfo[SurveyInfoNameKey]?.toString();
  const { focusDistance, setFocusDistance } = useFocusDistance(shouldFocus);
  const { suggest, suggestedCommentsStations, suggestedAnomaliesStations } = useSuggester(originalSurvey);

  useEffect(() => {
    setEditedSurveyData(editedSurvey.surveyData);
    setFocusDistance(null);
  }, [editedSurvey.surveyData, setFocusDistance]);

  if (!originalSurvey || !editedSurvey || editedSurveyData.length === 0) {
    return <div>No survey data to display.</div>;
  }

  const handleScanOnOffMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 1; i < editedSurveyData.length; i++) {
      const prevRow = editedSurveyData[i - 1];
      const currentRow = editedSurveyData[i];

      for (const key of SurveyOnOffVoltageKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({ rowIndex: i-1, columnName: key });
          errors.push({ rowIndex: i, columnName: key });
        }
      }
    }
    setErrorCells(errors);
  },[editedSurveyData]);

  const handleScanDSVGMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 0; i < editedSurveyData.length; i++) {
      const currentRow = editedSurveyData[i];

      for (const key of SurveyDSVGVoltageKeys) {

        if (Math.abs(currentRow[key] || 0) > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({ rowIndex: i, columnName: key });
          errors.push({ rowIndex: i, columnName: SurveyAnomalyKey });
        }
      }
    }
    setErrorCells(errors);
  },[editedSurveyData]);

  const handleScanStationGapErrors = useCallback(() => {
    const errors: ErrorCell[] = [];

    for (let i = 1; i < editedSurveyData.length; i++) {
      const prevRow = editedSurveyData[i - 1];
      const currentRow = editedSurveyData[i];

      for (const key of SurveyStationKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > 1) { // Convert mV to V for comparison
          errors.push({ rowIndex: i-1, columnName: key });
          errors.push({ rowIndex: i-1, columnName: SurveyCommentKey });
          errors.push({ rowIndex: i-1, columnName: SurveyAnomalyKey });
          errors.push({ rowIndex: i, columnName: key });
          errors.push({ rowIndex: i, columnName: SurveyCommentKey });
          errors.push({ rowIndex: i, columnName: SurveyAnomalyKey });
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurveyData]);

  const handleCellClick = useCallback((
    e: React.MouseEvent<HTMLTableCellElement>,
    rowIndex: number,
    columnName: keyof SurveyDataRow
  ) => {
    const isError = errorCells.some(
      err => err.rowIndex === rowIndex && err.columnName === columnName
    );
    const isEditable = EditableColumnHeaders.has(columnName);
    if (!isError && !isEditable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      rowIndex,
      columnName,
      value: editedSurveyData[rowIndex][columnName],
      type: EditableColumnHeaders.get(columnName),
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  },[errorCells, editedSurveyData, setPopover]);

  const handleSave = useCallback((newValue?: EditableType) => {
    if (!popover) return;

    const updatedData = [...editedSurveyData];
    updatedData[popover.rowIndex] = {
      ...updatedData[popover.rowIndex],
      [popover.columnName]: newValue,
    };
    setEditedSurveyData(updatedData);

    // Optional: Re-scan to see if the error is resolved
    // handleScan(currentThreshold); 

    setPopover(null);
  },[popover, editedSurveyData, setEditedSurveyData, setPopover]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Survey Data - {surveyName}</h2>
        <button onClick={() => setInfoModalOpen(true)} className={styles.infoButton}>
          <FaInfoCircle />
        </button>
      </div>
      <ErrorPanel
          onScanMeasurementErrors={handleScanOnOffMeasurementErrors}
          onScanDCVGErrors={handleScanDSVGMeasurementErrors}
          onScanStationGapErrors={handleScanStationGapErrors}
      />
      <div className={styles.sheetContainer}>
        <table className={styles.sheetTable}>
          <thead>
            <tr>
              {originalSurvey.surveyDataHeaders.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedSurveyData.map((row, rowIndex) => {
              const distance = row[SurveyDistanceKey];
              const station = Number(row[SurveyStationKey]);
              const isFocused = focusDistance === distance;

              return (
                <tr 
                  key={rowIndex} 
                  onMouseEnter={() => setFocusDistance(Number(distance))}
                  onMouseLeave={() => setFocusDistance(null)}
                  className={isFocused ? styles.focusedRow : ''}
                >
                  {originalSurvey.surveyDataHeaders.map(header => {
                    const isError = errorCells.some(
                      err => err.rowIndex === rowIndex && err.columnName === header
                    );
                    const isEditable = EditableColumnHeaders.has(header);
                    const isSuggested = isEditable && !Number.isNaN(station) &&
                        ((header === SurveyCommentKey && suggestedCommentsStations.includes(station)) ||
                        (header === SurveyAnomalyKey && suggestedAnomaliesStations.includes(station)));

                    const displayValue = row[header];

                    const cellClassName = [
                      styles.cell,
                      isEditable ? styles.editableCell : styles.nonEditableCell,
                      isError ? styles.errorCell : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <td
                        key={header}
                        onClick={(e) => isEditable && handleCellClick(e, rowIndex, header)}
                        className={cellClassName}
                      >
                        {displayValue}
                        {(isSuggested) && <div className={styles.suggestedMarker}/>}
                        {(isEditable) && <span className={styles.editIcon}><FaPencilAlt /></span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {popover && (
        <EditPopover
          top={popover.top}
          left={popover.left}
          initialValue={popover.value}
          onSave={handleSave}
          onClose={() => setPopover(null)}
          type={popover.type}
          suggestions={suggest(popover.columnName, popover.rowIndex)}
        />
      )}
      <SurveyInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        surveyName={surveyName || ''}
        surveyInfo={originalSurvey.surveyInfo}
      />
    </div>
  );
};

export default SurveySheet;
