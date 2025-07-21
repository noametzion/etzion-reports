import React, { useState, useEffect } from 'react';
import {
  SurveyDSVGVoltageKeys,
  InfoSurveyNameKey,
  SurveyOnOffVoltageKeys,
  SurveyStationKeys,
  Survey,
  SurveyDataRow, SurveyCommentKey, SurveyDistanceKey,
} from '@/app/types/survey';
import styles from './SurveySheet.module.css';
import {FaInfoCircle, FaPencilAlt} from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';
import ErrorPanel from './ErrorPanel';
import {EditableType, EditableTypeName} from './EditPopover';
import {useFocusDistance} from "@/app/hooks/useFocusDistance";
import EditPopover from "./EditPopover";

interface SurveySheetProps {
  survey: Survey;
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

const editableHeaders = new Map<keyof SurveyDataRow, EditableTypeName>();
editableHeaders.set('Comment', 'string');
editableHeaders.set('DCP/Feature/DCVG Anomaly', 'string');
editableHeaders.set('DCVG Voltage', 'number');
editableHeaders.set('Off Voltage', 'number');
editableHeaders.set('On Voltage', 'number');
editableHeaders.set('Latitude', 'number');
editableHeaders.set('Longitude', 'number');

const errorableCells = new Map<keyof SurveyDataRow, EditableTypeName>();
errorableCells.set('Off Voltage', 'number');
errorableCells.set('On Voltage', 'number');
errorableCells.set('DCVG Voltage', 'number');

const SurveySheet: React.FC<SurveySheetProps> = ({
  survey,
  shouldFocus
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [errorCells, setErrorCells] = useState<ErrorCell[]>([]);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyDataRow[]>(survey.surveyData);
  const surveyName = survey.surveyInfo[InfoSurveyNameKey];
  const { focusDistance, setFocusDistance } = useFocusDistance(shouldFocus);

  useEffect(() => {
    setSurveyData(survey.surveyData);
    setFocusDistance(null);
  }, [survey.surveyData, setFocusDistance]);

  if (!survey || surveyData.length === 0) {
    return <div>No survey data to display.</div>;
  }

  const handleScanOnOffMeasurementErrors = (threshold: number) => {
    const errors: ErrorCell[] = [];
    const data = surveyData;

    for (let i = 1; i < data.length; i++) {
      const prevRow = data[i - 1];
      const currentRow = data[i];

      for (const key of SurveyOnOffVoltageKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({ rowIndex: i-1, columnName: key });
          errors.push({ rowIndex: i, columnName: key });
        }
      }
    }
    setErrorCells(errors);
  };

  const handleScanDSVGMeasurementErrors = (threshold: number) => {
    const errors: ErrorCell[] = [];
    const data = surveyData;

    for (let i = 0; i < data.length; i++) {
      const currentRow = data[i];

      for (const key of SurveyDSVGVoltageKeys) {

        if (Math.abs(currentRow[key] || 0) > (threshold / 1000)) { // Convert mV to V for comparison
          errors.push({ rowIndex: i, columnName: key });
          errors.push({ rowIndex: i, columnName: SurveyCommentKey });
        }
      }
    }
    setErrorCells(errors);
  };

  const handleScanStationGapErrors = () => {
    const errors: ErrorCell[] = [];
    const data = surveyData;

    for (let i = 1; i < data.length; i++) {
      const prevRow = data[i - 1];
      const currentRow = data[i];

      for (const key of SurveyStationKeys) {
        const voltageDiff = Math.abs((currentRow[key] || 0) - (prevRow[key] || 0));

        if (voltageDiff > 1) { // Convert mV to V for comparison
          errors.push({ rowIndex: i-1, columnName: key });
          errors.push({ rowIndex: i, columnName: key });
        }
      }
    }
    setErrorCells(errors);
  };

  const handleCellClick = (
    e: React.MouseEvent<HTMLTableCellElement>,
    rowIndex: number,
    columnName: keyof SurveyDataRow
  ) => {
    const isError = errorCells.some(
      err => err.rowIndex === rowIndex && err.columnName === columnName
    );
    const isEditable = editableHeaders.has(columnName);
    if (!isError && !isEditable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      rowIndex,
      columnName,
      value: surveyData[rowIndex][columnName],
      type: isEditable ? editableHeaders.get(columnName) : errorableCells.get(columnName),
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  };

  const handleSave = (newValue?: EditableType) => {
    if (!popover) return;

    const updatedData = [...surveyData];
    updatedData[popover.rowIndex] = {
      ...updatedData[popover.rowIndex],
      [popover.columnName]: newValue,
    };
    setSurveyData(updatedData);

    // Optional: Re-scan to see if the error is resolved
    // handleScan(currentThreshold); 

    setPopover(null);
  };

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
              {survey.surveyDataHeaders.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surveyData.map((row, rowIndex) => {
              const distance = row[SurveyDistanceKey];
              const isFocused = focusDistance === distance;

              return (
                <tr 
                  key={rowIndex} 
                  onMouseEnter={() => setFocusDistance(Number(distance))}
                  onMouseLeave={() => setFocusDistance(null)}
                  className={isFocused ? styles.focusedRow : ''}
                >
                  {survey.surveyDataHeaders.map(header => {
                    const isError = errorCells.some(
                      err => err.rowIndex === rowIndex && err.columnName === header
                    );
                    const isEditable = editableHeaders.has(header);

                    const displayValue = row[header];

                    const cellClassName = [
                      styles.cell,
                      isEditable ? styles.editableCell : styles.nonEditableCell,
                      isError ? styles.errorCell : '',
                    ].filter(Boolean).join(' ');

                    if (isError) {
                      console.log(cellClassName, isEditable);
                    }

                    return (
                      <td
                        key={header}
                        onClick={(e) => isEditable && handleCellClick(e, rowIndex, header)}
                        className={cellClassName}
                      >
                        {displayValue}
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
          suggestions={[]}
        />
      )}
      <SurveyInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        surveyName={surveyName}
        surveyInfo={survey.surveyInfo}
      />
    </div>
  );
};

export default SurveySheet;
