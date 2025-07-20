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
import { FaInfoCircle } from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';
import ErrorPanel from './ErrorPanel';
import ErrorPopover from './ErrorPopover';
import {useFocusDistance} from "@/app/hooks/useFocusDistance";

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
  value: number | undefined;
  top: number;
  left: number;
}

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
  }, [survey.surveyData]);

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
    if (!isError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      rowIndex,
      columnName,
      value: surveyData[rowIndex][columnName] as number | undefined,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width,
    });
  };

  const handleSave = (newValue: number) => {
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

  const headers = Object.keys(surveyData[0]) as (keyof SurveyDataRow)[];

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
              {headers.map(header => (
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
                  {headers.map(header => {
                    const isError = errorCells.some(
                      err => err.rowIndex === rowIndex && err.columnName === header
                    );
                    const value = row[header as keyof SurveyDataRow];
                    const valueString = value !== undefined ? String(value) : '';
                    return (
                      <td 
                        key={`${rowIndex}-${header}`}
                        className={isError ? styles.errorCell : ''}
                        onClick={(e) => handleCellClick(e, rowIndex, header)}
                      >
                        {valueString}
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
        <ErrorPopover
          top={popover.top}
          left={popover.left}
          initialValue={popover.value}
          onSave={handleSave}
          onClose={() => setPopover(null)}
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
