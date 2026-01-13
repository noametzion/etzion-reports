"use client";

import React, {useState, useEffect, useCallback, useRef, memo, useMemo} from 'react';
import { Tooltip } from 'react-tooltip';
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
  EditableColumnHeaders,
  EditedSurvey,
  SurveyStationKey,
  SurveyAnomalyKey,
  EditedSurveyDataRow,
  EditedDCPDataRow,
  SurveyDateTimeKeys,
  SwitchableSurveyKeys,
  SurveySwitchablePair,
  SurveyInfoStationDiffKey
} from '@/app/types/survey';
import styles from './SurveySheet.module.css';
import {FaInfoCircle, FaPencilAlt, FaPlus, FaTrash} from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';
import ErrorPanel from './ErrorPanel';
import {areEqual, FixedSizeGrid as Grid, GridOnScrollProps} from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import {useFocusDistance} from '@/app/hooks/useFocusDistance';
import EditPopover from './EditPopover';
import {useSuggester} from '@/app/hooks/useSuggester';
import SkipRowsPopover from "@/app/components/SkipRowsPopover";
import {formatExcelDate} from "@/app/utils/dateTimeUtils";
import {FaArrowRightArrowLeft} from "react-icons/fa6";
import DeleteRowPopover from "@/app/components/DeleteRowPopover";
import {forEach} from "es-toolkit/compat";

interface SurveySheetProps {
  originalSurvey: Survey;
  editedSurvey: EditedSurvey;
  surveyFileName: string;
  shouldFocus: boolean;
  onEdit: (editedSurveyData: EditedSurveyDataRow[], editedDCPData: EditedDCPDataRow[]) => void
}

interface ErrorCell {
  rowIndex: number;
  columnName: keyof SurveyDataRow;
}

interface EditPopoverState {
  rowIndex: number;
  columnName: keyof SurveyDataRow;
  value: EditableType | undefined;
  type?: EditableTypeName;
  top: number;
  left: number;
}

interface SkipPopoverState {
  rowUpIndex: number;
  rowBottomIndex: number;
  stationOnTop: number;
  stationUnder: number;
  currentSkipValueMeters: number;
  stationDiffDist: number;
  top: number;
  left: number;
}

interface DeleteRowPopoverState {
  rowIndex: number;
  top: number;
  left: number;
}

interface PlusRowState {
  rowUpIndex: number;
  rowBottomIndex: number;
  timeout: NodeJS.Timeout;
}

interface SwitchCellsState {
  rowIndex: number;
  switchPair: SurveySwitchablePair;
  timeout: NodeJS.Timeout;
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
  shouldFocus,
  onEdit
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [errorCells, setErrorCells] = useState<ErrorCell[]>([]);
  const [editPopover, setEditPopover] = useState<EditPopoverState | null>(null);
  const [skipPopover, setSkipPopover] = useState<SkipPopoverState | null>(null);
  const [deleteRowPopover, setDeleteRowPopover] = useState<DeleteRowPopoverState | null>(null);
  const [plusRow, setPlusRow] = useState<PlusRowState | null>(null);
  const [switchCells, setSwitchCells] = useState<SwitchCellsState | null>(null);
  const surveyName = originalSurvey.surveyInfo[SurveyInfoNameKey]?.toString() || surveyFileName; // ??
  const { focusDistance, setFocusDistance } = useFocusDistance(shouldFocus);
  const [ selectedRow, setSelectedRow ] = useState<number | null>(null);
  const { suggest, suggestedCommentsStations, suggestedAnomaliesStations } = useSuggester(editedSurvey);
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
    // setEditedSurveyData(editedSurvey.surveyData);
    setFocusDistance(null);
  }, [originalSurvey, setFocusDistance]);

  const handleScanOnOffMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 1; i < editedSurvey.surveyData.length; i++) {
      const prevRow = editedSurvey.surveyData[i - 1];
      const currentRow = editedSurvey.surveyData[i];

      for (const key of SurveyOnOffVoltageKeys) {
        const voltageDiff = Math.abs((Number(currentRow[key]) || 0) - (Number(prevRow[key]) || 0));

        if (voltageDiff > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({rowIndex: i - 1, columnName: key});
          errors.push({rowIndex: i, columnName: key});
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurvey.surveyData]);

  const handleScanDSVGMeasurementErrors = useCallback((threshold: number) => {
    const errors: ErrorCell[] = [];

    for (let i = 0; i < editedSurvey.surveyData.length; i++) {
      const currentRow = editedSurvey.surveyData[i];

      for (const key of SurveyDSVGVoltageKeys) {

        if (Math.abs(Number(currentRow[key]) || 0) > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({rowIndex: i, columnName: key});
          errors.push({rowIndex: i, columnName: SurveyAnomalyKey});
        }
      }
    }
    setErrorCells(errors);
  }, [editedSurvey.surveyData]);

  const handleScanStationGapErrors = useCallback(() => {
    const errors: ErrorCell[] = [];
    const stationDiff = Number(originalSurvey.surveyInfo[SurveyInfoStationDiffKey]);

    for (let i = 1; i < editedSurvey.surveyData.length; i++) {
      const prevRow = editedSurvey.surveyData[i - 1];
      const currentRow = editedSurvey.surveyData[i];

      for (const key of SurveyStationKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > stationDiff) { // Convert mV to V for comparison
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
  }, [editedSurvey.surveyData, originalSurvey.surveyInfo]);

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
    setEditPopover({
      rowIndex,
      columnName,
      value: editedSurvey.surveyData[rowIndex][columnName],
      type: EditableColumnHeaders.get(columnName),
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  }, [errorCells, editedSurvey.surveyData, setEditPopover]);

  const handleSaveCellValue = useCallback((newValue?: EditableType) => {
    if (!editPopover) return;

    const updatedData = [...editedSurvey.surveyData];
    updatedData[editPopover.rowIndex] = {
      ...updatedData[editPopover.rowIndex],
      [editPopover.columnName]: newValue,
    };
    onEdit(updatedData, editedSurvey.DCPData);

    // Optional: Re-scan to see if the error is resolved
    // handleScan(currentThreshold); 

    setEditPopover(null);
  }, [editPopover, editedSurvey.surveyData, editedSurvey.DCPData, onEdit, setEditPopover]);

  const handleSaveSkippedRowsValue = useCallback((newSkippedValue: number) => {
    if (!skipPopover) return;

    const diffSkipped = newSkippedValue - skipPopover.currentSkipValueMeters;
    const minStationToChange = editedSurvey.surveyData[skipPopover.rowBottomIndex]["Station No"];

    const updatedSurveyData = [...editedSurvey.surveyData];
    for (let i = skipPopover.rowBottomIndex; i < updatedSurveyData.length; i++) {
      updatedSurveyData[i] = {
        ...updatedSurveyData[i],
        "Station No": updatedSurveyData[i]["Station No"] + diffSkipped,
        "Dist From Start": updatedSurveyData[i]["Dist From Start"] + diffSkipped,
      };
    }

    const updatedDCPData = [...editedSurvey.DCPData];
    for (let i = 0; i < updatedDCPData.length; i++) {
      if (updatedDCPData[i]["Station No"] >= minStationToChange) {
        updatedDCPData[i] = {
          ...updatedDCPData[i],
          "Station No": updatedDCPData[i]["Station No"] + diffSkipped,
        }
      }
    }

    onEdit(updatedSurveyData, updatedDCPData);

    setSkipPopover(null);
  }, [skipPopover, editedSurvey.surveyData, editedSurvey.DCPData, onEdit, setSkipPopover]);


  const handlePlusRowClicked = useCallback((e: React.MouseEvent<SVGElement>) => {
    if(!plusRow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const stationOnTop = Number(editedSurvey.surveyData[plusRow.rowUpIndex][SurveyStationKey]);
    const stationUnder = Number(editedSurvey.surveyData[plusRow.rowBottomIndex][SurveyStationKey]);
    const stationDiff = Number(originalSurvey.surveyInfo[SurveyInfoStationDiffKey]);
    setSkipPopover({
      rowUpIndex: plusRow.rowUpIndex,
      rowBottomIndex: plusRow.rowBottomIndex,
      stationOnTop: stationOnTop,
      stationUnder: stationUnder,
      currentSkipValueMeters: stationUnder - stationOnTop - stationDiff,
      stationDiffDist: stationDiff,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  },[plusRow, editedSurvey.surveyData, originalSurvey.surveyInfo]);

  const handleDeleteRowClicked = useCallback((e: React.MouseEvent<SVGElement>, rowIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDeleteRowPopover({
      rowIndex: rowIndex,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  },[])

  const handleApproveDeleteRowClicked = useCallback(() => {
    if (!deleteRowPopover) return;

    const updatedSurveyData = [...editedSurvey.surveyData];
    updatedSurveyData.splice(deleteRowPopover.rowIndex, 1);

    const updatedDCPData = [...editedSurvey.DCPData];
    console.log(updatedDCPData);
    const stationOfRowToDelete = editedSurvey.surveyData[deleteRowPopover.rowIndex][SurveyStationKey];
    const indexesOfDCPDataToDelete = updatedDCPData
        .map((item, index) => item["Station No"] === stationOfRowToDelete ? index : -1)
        .filter(index => index !== -1);
    console.log(indexesOfDCPDataToDelete);
    forEach(indexesOfDCPDataToDelete, index => updatedDCPData.splice(index, 1));
    console.log(updatedDCPData);
    console.log("------");

    onEdit(updatedSurveyData, updatedDCPData);

    setDeleteRowPopover(null);
  },[deleteRowPopover, editedSurvey.surveyData, editedSurvey.DCPData, onEdit, setDeleteRowPopover])

  const switchCellsValue = useCallback((rowIndex: number, switchPair: SurveySwitchablePair) => {

    const switchPairKeyToValue = editedSurvey.surveyData[rowIndex][switchPair[0]];
    const switchPairValueToKey = editedSurvey.surveyData[rowIndex][switchPair[1]];

    const updatedSurveyData = [...editedSurvey.surveyData];
    updatedSurveyData[rowIndex] = {
      ...updatedSurveyData[rowIndex],
      [switchPair[0]]: switchPairValueToKey,
      [switchPair[1]]: switchPairKeyToValue,
    };

    onEdit(updatedSurveyData, editedSurvey.DCPData);

  }, [editedSurvey.surveyData, editedSurvey.DCPData, onEdit]);


  const handleSwitchCellsClicked = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    if(!switchCells) return

    switchCellsValue(switchCells.rowIndex, switchCells.switchPair);
    setTimeout(() => setSwitchCells(null), 1000)

  },[switchCellsValue, switchCells, setSwitchCells]);

  const PlusRowButton = memo(function PlusRowButton() {
    return (
      <>
        <FaPlus className={styles.addRowsButton} onClick={(e) => handlePlusRowClicked(e)}/>
        <div className={styles.addRowsButtonLine}/>
      </>
    );
  }, areEqual);

  const SwitchCellsButton = memo(function SwitchCellsButton() {
    return (
        <FaArrowRightArrowLeft className={styles.switchCellsButton} onClick={(e) => handleSwitchCellsClicked(e)}/>
    );
  }, areEqual);

  const SetPlus = useCallback((plus: {rowUpIndex: number, rowBottomIndex: number} | null) => {
    setPlusRow(prevState => {
      if(prevState !== null){
        clearTimeout(prevState.timeout);
      }
      return plus !== null ? {
        rowUpIndex: plus.rowUpIndex,
        rowBottomIndex: plus.rowBottomIndex,
        timeout: setTimeout(() => setPlusRow(null), 5000)
      } : null;
    });
  }, []);

  const SetSwitch = useCallback((switchDetails: {rowIndex: number, switchPair: SurveySwitchablePair} | null) => {
    setSwitchCells(prevState => {
      if(prevState !== null){
        clearTimeout(prevState.timeout);
      }
      return switchDetails !== null ? {
        rowIndex: switchDetails.rowIndex,
        switchPair: switchDetails.switchPair,
        timeout: setTimeout(() => setSwitchCells(null), 5000)
      } : null;
    });
  }, []);

  const Cell = memo(function Cell({rowIndex, columnIndex, style, data}: {rowIndex: number, columnIndex: number, style: React.CSSProperties, data: ItemData}){
    const row = data.items[rowIndex];
    const distance = row[SurveyDistanceKey];
    const station = Number(row[SurveyStationKey]);
    const header = data.headers[columnIndex];
    const isFirstColumn = columnIndex === 0;
    const isFirstRow = rowIndex === 0;
    const switchPair = SwitchableSurveyKeys.findLast(([headerKey, headerValue]) => {
      return header === headerKey || header === headerValue;
    });

    const isFocused = data.focusDistance === distance;
    const isSelected = data.selectedRow === rowIndex;
    const isError = data.errorCells.some(
        err => err.rowIndex === rowIndex && err.columnName === header
    );
    const isEditable = EditableColumnHeaders.has(header);
    const isSuggested = isEditable && !Number.isNaN(station) &&
      ((header === SurveyCommentKey && data.suggestedCommentsStations.includes(station)) ||
        (header === SurveyAnomalyKey && data.suggestedAnomaliesStations.includes(station)));
    let isOverflow = false;

    const isHoverForPlusDetectable = isFirstColumn || columnIndex === 1;
    const isHoverForSwitchDetectableAtEnd = switchPair && switchPair[0] === header;
    const isHoverForSwitchDetectableAtStart = switchPair && switchPair[1] === header;

    const cellValue = row[header];
    let displayValue = typeof cellValue === "number" ? Number(cellValue.toFixed(6)) : cellValue;
    if (SurveyDateTimeKeys.includes(header)) {
      displayValue = formatExcelDate(displayValue?.toString() || "");
      isOverflow = true;
    }

    const cellClassName = [
      styles.tableCell,
      isEditable ? styles.editableCell : styles.nonEditableCell,
      isFirstColumn && styles.deletableCell,
      isError && styles.errorCell,
      isFocused && styles.focusedRow,
      isSelected && styles.selectedRowCell,
    ].filter(Boolean).join(' ');
    const isPlusVisible = isFirstColumn && !isFirstRow && plusRow && rowIndex === plusRow.rowBottomIndex;
    const isSwitchVisible = switchPair && switchPair[1] === header && switchCells && switchCells.rowIndex === rowIndex;
    const isSwitchVisibleOnPair = switchPair && switchPair[0] === header && switchCells && switchCells.rowIndex === rowIndex;

    if (!originalSurvey || !editedSurvey || editedSurvey.surveyData.length === 0) {
      return <div>No survey data to display.</div>;
    }

    return (
      <div
        onMouseEnter={() => { setFocusDistance(Number(distance)); setSelectedRow(rowIndex) }}
        onMouseLeave={() => { setFocusDistance(null); setSelectedRow(null) }}
        onClick={(e) => isEditable && data.handleCellClick(e, rowIndex, header)}
        className={cellClassName}
        style={style}
        dir={'rtl'}
      >
        {(isPlusVisible) && <PlusRowButton/>}
        {(isSwitchVisible) && <SwitchCellsButton/>}
        <span
            className={styles.cellContent}
            data-tooltip-id={isOverflow ? 'extended-value' : ''}
            data-tooltip-content={displayValue?.toString() || ""}
        >
          {displayValue}
        </span>
        {(isEditable && !isSwitchVisibleOnPair) && <span className={styles.editIcon}><FaPencilAlt/></span>}
        {(isFirstColumn) && <span className={styles.deleteIcon}><FaTrash onClick={(e) => handleDeleteRowClicked(e, rowIndex)}/></span> }
        {(isSuggested) && <div className={styles.suggestedMarker}/>}
        {(isHoverForPlusDetectable) && <div className={styles.hoverBorderCellZoneTop} onMouseMove={() => SetPlus({rowUpIndex: rowIndex-1, rowBottomIndex: rowIndex})}/>}
        {(isHoverForPlusDetectable) && <div className={styles.hoverBorderCellZoneBottom} onMouseMove={() => SetPlus({rowUpIndex: rowIndex, rowBottomIndex: rowIndex+1})}/>}
        {(isHoverForSwitchDetectableAtEnd) && <div className={styles.hoverBorderCellZoneRight} onMouseMove={() => SetSwitch({rowIndex, switchPair})}/>}
        {(isHoverForSwitchDetectableAtStart) && <div className={styles.hoverBorderCellZoneLeft} onMouseMove={() => SetSwitch({rowIndex, switchPair})}/>}
      </div>
    );
  }, areEqual);

  const itemData = useMemo(() => ({
    items: editedSurvey.surveyData,
    headers: originalSurvey.surveyDataHeaders,
    errorCells: errorCells,
    handleCellClick: handleCellClick,
    focusDistance: focusDistance,
    selectedRow: selectedRow,
    suggestedCommentsStations: suggestedCommentsStations,
    suggestedAnomaliesStations: suggestedAnomaliesStations
  }),[
    editedSurvey.surveyData,
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
                rowCount={editedSurvey.surveyData.length}
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
      <Tooltip
          id="extended-value"
          place="left"
          render={({ activeAnchor }) =>
              activeAnchor?.getAttribute("data-tooltip-content") ?? ""
          }
      />
      {editPopover && (
        <EditPopover
          top={editPopover.top}
          left={editPopover.left}
          initialValue={editPopover.value}
          onSave={handleSaveCellValue}
          onClose={() => setEditPopover(null)}
          type={editPopover.type}
          suggestions={suggest(editPopover.columnName, editPopover.rowIndex)}
        />
      )}
      {skipPopover && (
          <SkipRowsPopover
            top={skipPopover.top}
            left={skipPopover.left}
            stationOnTop={skipPopover.stationOnTop}
            stationUnder={skipPopover.stationUnder}
            stationDiffDist={skipPopover.stationDiffDist}
            currentSkipValueMeters={skipPopover.currentSkipValueMeters}
            onSave={handleSaveSkippedRowsValue}
            onClose={() => setSkipPopover(null)}
          />
      )}
      {deleteRowPopover && (
          <DeleteRowPopover
              top={deleteRowPopover.top}
              left={deleteRowPopover.left}
              onApproveDelete={handleApproveDeleteRowClicked}
              onClose={() => setDeleteRowPopover(null)}
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
