"use client";

import React, {useState, useEffect, useCallback, useRef, memo, useMemo} from 'react';
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
  EditableColumnHeaders, EditedSurvey, SurveyStationKey, SurveyAnomalyKey, EditedSurveyDataRow
} from '@/app/types/survey';
import styles from './SurveySheet.module.css';
import {FaInfoCircle, FaPencilAlt} from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';
import ErrorPanel from './ErrorPanel';
import {areEqual, FixedSizeList as List} from 'react-window';
import {useFocusDistance} from '@/app/hooks/useFocusDistance';
import EditPopover from './EditPopover';
import {useSuggester} from '@/app/hooks/useSuggester';

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

interface ItemData {
  items: EditedSurveyDataRow[];
  headers: (keyof SurveyDataRow)[];
  errorCells: ErrorCell[];
  handleCellClick: (e: React.MouseEvent<HTMLDivElement>, rowIndex: number, columnName: keyof SurveyDataRow) => void;
  focusDistance: number | null;
  suggestedCommentsStations: number[];
  suggestedAnomaliesStations: number[];
}

const SurveySheet: React.FC<SurveySheetProps> = ({
  originalSurvey,
  editedSurvey,
  shouldFocus
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [errorCells, setErrorCells] = useState<ErrorCell[]>([]);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [editedSurveyData, setEditedSurveyData] = useState<EditedSurveyDataRow[]>(editedSurvey.surveyData);
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

  // useEffect(() => {
  //
  //   function syncScroll(sourceElement: any, targetElement: any) {
  //     console.log('Syncing scroll');
  //     console.log(sourceElement.scrollLeft);
  //     targetElement.scrollLeft = sourceElement.scrollLeft;
  //   }
  //
  //   const tableContent = document.querySelector(`.${styles.tableBody} > div`);
  //   console.log('Content:', tableContent);
  //
  //   const tableHeader = document.querySelector(`.${styles.headerRow} > div`);
  //   console.log('Header:', tableHeader);
  //
  //   // tableContent?.addEventListener('scroll', () => syncScroll(tableContent, tableHeader));
  // },[]);

  const handleScanOnOffMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 1; i < editedSurveyData.length; i++) {
      const prevRow = editedSurveyData[i - 1];
      const currentRow = editedSurveyData[i];

      for (const key of SurveyOnOffVoltageKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({rowIndex: i - 1, columnName: key});
          errors.push({rowIndex: i, columnName: key});
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurveyData]);

  const handleScanDSVGMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 0; i < editedSurveyData.length; i++) {
      const currentRow = editedSurveyData[i];

      for (const key of SurveyDSVGVoltageKeys) {

        if (Math.abs(currentRow[key] || 0) > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({rowIndex: i, columnName: key});
          errors.push({rowIndex: i, columnName: SurveyAnomalyKey});
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurveyData]);

  const handleScanStationGapErrors = useCallback(() => {
    const errors: ErrorCell[] = [];

    for (let i = 1; i < editedSurveyData.length; i++) {
      const prevRow = editedSurveyData[i - 1];
      const currentRow = editedSurveyData[i];

      for (const key of SurveyStationKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > 1) { // Convert mV to V for comparison
          errors.push({rowIndex: i - 1, columnName: key});
          errors.push({rowIndex: i - 1, columnName: SurveyCommentKey});
          errors.push({rowIndex: i - 1, columnName: SurveyAnomalyKey});
          errors.push({rowIndex: i, columnName: key});
          errors.push({rowIndex: i, columnName: SurveyCommentKey});
          errors.push({rowIndex: i, columnName: SurveyAnomalyKey});
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurveyData]);

  const handleCellClick = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
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
  }, [errorCells, editedSurveyData, setPopover]);

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
  }, [popover, editedSurveyData, setEditedSurveyData, setPopover]);

  const Row = memo((({index: rowIndex, style, data}: {index: number, style: React.CSSProperties, data: ItemData}) => {
    const row = data.items[rowIndex];
    const distance = row[SurveyDistanceKey];
    const station = Number(row[SurveyStationKey]);
    const isFocused = data.focusDistance === distance;

    const rowClassName = [
      styles.tableRow,
      isFocused ? styles.focusedRow : '',
    ].filter(Boolean).join(' ');

    return <div
        style={style}
        onMouseEnter={() => setFocusDistance(Number(distance))}
        onMouseLeave={() => setFocusDistance(null)}
        className={rowClassName}
    >
      {data.headers.map((header) => {
        const isError = data.errorCells.some(
            err => err.rowIndex === rowIndex && err.columnName === header
        );
        const isEditable = EditableColumnHeaders.has(header);
        const isSuggested = isEditable && !Number.isNaN(station) &&
          ((header === SurveyCommentKey && data.suggestedCommentsStations.includes(station)) ||
            (header === SurveyAnomalyKey && data.suggestedAnomaliesStations.includes(station)));

        const cellValue = row[header];
        const displayValue = typeof cellValue === "number" ? Number(cellValue.toFixed(4)) : cellValue;;

        const cellClassName = [
          styles.tableCell,
          isEditable ? styles.editableCell : styles.nonEditableCell,
          isError ? styles.errorCell : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={`${rowIndex}_${header}`}
            onClick={(e) => isEditable && data.handleCellClick(e, rowIndex, header)}
            className={cellClassName}
          >
            {displayValue}
            {(isSuggested) && <div className={styles.suggestedMarker}/>}
            {(isEditable) && <span className={styles.editIcon}><FaPencilAlt/></span>}
          </div>
        );
      })}
    </div>;
  }), areEqual);

  const itemData = useMemo(() => ({
    items: editedSurveyData,
    headers: originalSurvey.surveyDataHeaders,
    errorCells: errorCells,
    handleCellClick: handleCellClick,
    focusDistance: focusDistance,
    suggestedCommentsStations: suggestedCommentsStations,
    suggestedAnomaliesStations: suggestedAnomaliesStations
  }),[
    editedSurveyData,
    originalSurvey.surveyDataHeaders,
    errorCells,
    handleCellClick,
    focusDistance,
    suggestedCommentsStations,
    suggestedAnomaliesStations
  ]);

  const itemKey = useCallback(
      (index: number, data: ItemData) => data.items[index]["Data No"],   // <- must be stable & unique
      []
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Survey Data - {surveyName}</h2>
        <button onClick={() => setInfoModalOpen(true)} className={styles.infoButton}>
          <FaInfoCircle/>
        </button>
      </div>
      <ErrorPanel
        onScanMeasurementErrors={handleScanOnOffMeasurementErrors}
        onScanDCVGErrors={handleScanDSVGMeasurementErrors}
        onScanStationGapErrors={handleScanStationGapErrors}
      />
      <div className={styles.sheetContainer}>
        <div className={styles.headerRow}>
          {originalSurvey.surveyDataHeaders.map(header => (
            <div key={header} className={styles.headerCell}>{header}</div>
          ))}
        </div>
        <div className={styles.tableBody}>
          <List
            height={300}
            itemCount={editedSurveyData.length}
            itemSize={35}
            width="100%"
            itemData={itemData}
            itemKey={itemKey}
          >
            {Row}
          </List>
        </div>
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
