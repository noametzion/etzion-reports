"use client";

import React from 'react';
import {InfoSurveyNameKey, SurveyFile} from '@/app/types/survey';
import { useGraphs } from '@/app/hooks/useGraphs';
import GraphDisplay from './GraphDisplay';
import styles from './ReportViewer.module.css';
import {useSurveyReader} from "@/app/hooks/useSurveyReader";
import {useMaps} from "@/app/hooks/useMaps";
import dynamic from "next/dynamic";
// Dynamically import MapView only on the client (because using leaflet)
const MapView =
    dynamic(() =>
        import("@/app/components/MapView"), { ssr: false });

interface ReportViewerProps {
  surveyFile: SurveyFile | null;
  shouldFocus: boolean;
}

const DEFAULT_SPLIT_DISTANCE = 500;

const ReportViewer: React.FC<ReportViewerProps> = ({ surveyFile , shouldFocus}) => {
  const {survey} = useSurveyReader(surveyFile);
  const [splitDistance, setSplitDistance] = React.useState<number>(DEFAULT_SPLIT_DISTANCE);
  const graphs = useGraphs(survey?.surveyData || null, splitDistance);
  const maps = useMaps(survey?.surveyData || null, splitDistance);

  const surveyName = survey?.surveyInfo[InfoSurveyNameKey] || surveyFile?.name;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Report Viewer - {surveyName}</h2>
        <span>Split Distance:</span>
        <input
            type="number"
            value={splitDistance}
            onChange={(e) => setSplitDistance(Number(e.target.value))}
        />
      </div>
      <div className={styles.graphsContainer}>
        {graphs.map((graph, index) => (
          <div key={index}>
            <GraphDisplay
                key={index}
                graphInfo={graph}
                shouldFocus={shouldFocus}
            />
            <MapView
                mapInfo={maps[index]}
                allMapsInfos={maps}
                shouldFocus={shouldFocus}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportViewer;
