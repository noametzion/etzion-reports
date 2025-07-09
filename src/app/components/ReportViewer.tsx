import React from 'react';
import {InfoSurveyNameKey, SurveyFile} from '@/app/types/survey';
import { useGraphs } from '@/app/hooks/useGraphs';
import GraphDisplay from './GraphDisplay';
import styles from './ReportViewer.module.css';
import {useSurveyReader} from "@/app/hooks/useSurveyReader";

interface ReportViewerProps {
  surveyFile: SurveyFile | null;
}

const SPLIT_DISTANCE = 500;

const ReportViewer: React.FC<ReportViewerProps> = ({ surveyFile }) => {
  const {survey} = useSurveyReader(surveyFile);
  const graphs = useGraphs(survey?.surveyData || null, SPLIT_DISTANCE);

  const surveyName = survey?.surveyInfo[InfoSurveyNameKey] || surveyFile?.name;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Report Viewer - {surveyName}</h2>
      </div>
      <div className={styles.graphsContainer}>
        {graphs.map((graph, index) => (
          <GraphDisplay key={index} graphInfo={graph} />
        ))}
      </div>
    </div>
  );
};

export default ReportViewer;
