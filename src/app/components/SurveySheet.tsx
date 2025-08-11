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
import {areEqual, FixedSizeGrid as Grid, GridOnScrollProps} from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
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
  selectedRow: number | null;
  suggestedCommentsStations: number[];
  suggestedAnomaliesStations: number[];
}

const SurveySheet: React.FC<SurveySheetProps> = ({
  originalSurvey,
  editedSurvey,
  surveyFileName,
  shouldFocus
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [errorCells, setErrorCells] = useState<ErrorCell[]>([]);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [editedSurveyData, setEditedSurveyData] = useState<EditedSurveyDataRow[]>(editedSurvey.surveyData);
  const surveyName = originalSurvey.surveyInfo[SurveyInfoNameKey]?.toString() || surveyFileName; // ??
  const { focusDistance, setFocusDistance } = useFocusDistance(shouldFocus);
  const [ selectedRow, setSelectedRow ] = useState<number | null>(null);
  const { suggest, suggestedCommentsStations, suggestedAnomaliesStations } = useSuggester(originalSurvey);
  const tableHeaderRef = React.useRef<HTMLDivElement>(null);
  const tableGridRef = React.useRef<Grid>(null);

  const syncing = useRef(false);

  const onBodyScroll = ({ scrollLeft }: GridOnScrollProps) => {
    if (syncing.current) return;
    syncing.current = true;
    if (tableHeaderRef.current) tableHeaderRef.current.scrollLeft = scrollLeft;
    requestAnimationFrame(() => (syncing.current = false));
  };

  const onHeaderScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (syncing.current) return;
    syncing.current = true;
    tableGridRef.current?.scrollTo({ scrollLeft: e.currentTarget.scrollLeft });
    requestAnimationFrame(() => (syncing.current = false));
  };

  useEffect(() => {
    setEditedSurveyData(editedSurvey.surveyData);
    setFocusDistance(null);
  }, [editedSurvey.surveyData, setFocusDistance]);

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

  const Cell = memo(function Cell({rowIndex, columnIndex, style, data}: {rowIndex: number, columnIndex: number, style: React.CSSProperties, data: ItemData}){
    const row = data.items[rowIndex];
    const distance = row[SurveyDistanceKey];
    const station = Number(row[SurveyStationKey]);
    const isFocused = data.focusDistance === distance;
    const isSelected = data.selectedRow === rowIndex;

    const header = data.headers[columnIndex];
    const isError = data.errorCells.some(
        err => err.rowIndex === rowIndex && err.columnName === header
    );

    const isEditable = EditableColumnHeaders.has(header);
    const isSuggested = isEditable && !Number.isNaN(station) &&
      ((header === SurveyCommentKey && data.suggestedCommentsStations.includes(station)) ||
        (header === SurveyAnomalyKey && data.suggestedAnomaliesStations.includes(station)));

    const cellValue = row[header];
    const displayValue = typeof cellValue === "number" ? Number(cellValue.toFixed(6)) : cellValue;

    const cellClassName = [
      styles.tableCell,
      isEditable ? styles.editableCell : styles.nonEditableCell,
      isError ? styles.errorCell : '',
      isFocused ? styles.focusedRow : '',
      isSelected ? styles.selectedRowCell : '',
    ].filter(Boolean).join(' ');

    if (!originalSurvey || !editedSurvey || editedSurveyData.length === 0) {
      return <div>No survey data to display.</div>;
    }

    return (
      <div
        onMouseEnter={() => { setFocusDistance(Number(distance)); setSelectedRow(rowIndex)}}
        onMouseLeave={() => {setFocusDistance(null); setSelectedRow(null)}}
        onClick={(e) => isEditable && data.handleCellClick(e, rowIndex, header)}
        className={cellClassName}
        style={style}
        dir={'rtl'}
      >
        <span className={styles.cellContent}>{displayValue}</span>
        {(isEditable) && <span className={styles.editIcon}><FaPencilAlt/></span>}
        {(isSuggested) && <div className={styles.suggestedMarker}/>}
      </div>
    );
  }, areEqual);

  const itemData = useMemo(() => ({
    items: editedSurveyData,
    headers: originalSurvey.surveyDataHeaders,
    errorCells: errorCells,
    handleCellClick: handleCellClick,
    focusDistance: focusDistance,
    selectedRow: selectedRow,
    suggestedCommentsStations: suggestedCommentsStations,
    suggestedAnomaliesStations: suggestedAnomaliesStations
  }),[
    editedSurveyData,
    originalSurvey.surveyDataHeaders,
    errorCells,
    handleCellClick,
    focusDistance,
    selectedRow,
    suggestedCommentsStations,
    suggestedAnomaliesStations
  ]);

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
        <div className={styles.headerRow} ref={tableHeaderRef} onScroll={onHeaderScroll}>
          {originalSurvey.surveyDataHeaders.map(header => (
            <div key={header} className={styles.headerCell}>{header}</div>
          ))}
        </div>
        <div className={styles.tableBody}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <Grid
                height={300}
                width={width}
                rowCount={editedSurveyData.length}
                columnCount={originalSurvey.surveyDataHeaders.length}
                rowHeight={35}
                columnWidth={150}
                itemData={itemData}
                ref={tableGridRef}
                overscanRowCount={10}
                overscanColumnCount={10}
                onScroll={onBodyScroll}
              >
                {Cell}
              </Grid>
            )}
          </AutoSizer>
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
