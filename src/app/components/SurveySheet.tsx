import React, { useState } from 'react';
import {InfoSurveyNameKey, Survey, SurveyDataRow} from '@/app/types/survey';
import styles from './SurveySheet.module.css';
import { FaInfoCircle } from 'react-icons/fa';
import SurveyInfoModal from './SurveyInfoModal';

interface SurveySheetProps {
  survey: Survey;
  surveyFileName: string;
}

const SurveySheet: React.FC<SurveySheetProps> = ({
  survey,
  surveyFileName
}) => {
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const surveyName = survey.surveyInfo[InfoSurveyNameKey] || surveyFileName;

  if (!survey || survey.surveyData.length === 0) {
    return <div>No survey data to display.</div>;
  }

  const headers = Object.keys(survey.surveyData[0]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Survey Data - {surveyName}</h2>
        <button onClick={() => setInfoModalOpen(true)} className={styles.infoButton}>
          <FaInfoCircle />
        </button>
      </div>
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
            {survey.surveyData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map(header => {
                  const value = row[header as keyof SurveyDataRow];
                  const valueString = value !== undefined ? String(value) : '';
                  return (<td key={`${rowIndex}-${header}`}>{valueString}</td>);
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
