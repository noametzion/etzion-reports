"use client";

import React, {useCallback, useState} from 'react';
import {SurveyInfoNameKey, SurveyFile, SurveyInfoStationDiffKey} from '@/app/types/survey';
import { useGraphs } from '@/app/hooks/useGraphs';
import GraphDisplay from './GraphDisplay';
import styles from './ReportViewer.module.css';
import {useSurveyReader} from "@/app/hooks/useSurveyReader";
import {useMaps} from "@/app/hooks/useMaps";
import dynamic from "next/dynamic";
import TitleEditorPanel from './TitleEditorPanel';
import { TitleInfo } from '@/app/types/reportInformation';
import {FaAngleDown, FaAngleUp} from "react-icons/fa";
import {useSurveyEditor} from "@/app/hooks/useSurveyEditor";
import {FaArrowsRotate} from "react-icons/fa6";
import ExportReportModal from "@/app/components/ExportReportModal";
import ReportModal from "@/app/components/ReportModal";
import {useSurveyReportInformation} from "@/app/hooks/useSurveyReportInformation";

// Dynamically import MapView only on the client (because using leaflet)
const MapView =
    dynamic(() =>
        import("@/app/components/MapView"), { ssr: false });

interface ReportViewerProps {
  originalSurveyFile: SurveyFile | null;
  shouldFocus: boolean;
  shouldShowMapPoints: boolean;
}

const DEFAULT_SPLIT_DISTANCE = 500;
const DEFAULT_DIST_PER_READING = 1; //m

const ReportViewer: React.FC<ReportViewerProps> = ({ originalSurveyFile, shouldFocus, shouldShowMapPoints }) => {
  const {survey: originalSurvey} = useSurveyReader(originalSurveyFile);
  const {editedSurvey, reload: reloadEditedSurvey} = useSurveyEditor(originalSurveyFile, originalSurvey);
  const [splitDistance, setSplitDistance] = React.useState<number>(DEFAULT_SPLIT_DISTANCE);
  const [includeDCVG, setIncludeDCVG] = useState<boolean>(true);
  const [includeMap, setIncludeMap] = useState<boolean>(true);
  const [isExportMode, setIsExportMode] = useState<boolean>(false);
  const [isReportMode, setIsReportMode] = useState<boolean>(false);
  const [showTitleEditor, setShowTitleEditor] = React.useState<boolean>(false);
  const [titles, setTitles] = React.useState<{primary: string, secondary: string}>({primary: '', secondary: ''});
  const distPerReading = Number(originalSurvey?.surveyInfo[SurveyInfoStationDiffKey]) || DEFAULT_DIST_PER_READING;
  const graphs = useGraphs(editedSurvey?.surveyData || null, splitDistance, distPerReading, titles);
  const maps = useMaps(editedSurvey?.surveyData || null, splitDistance, distPerReading);
  const { reportInfo, updateReportInfo, loaded, projectNameSuggestions, locationSuggestions } = useSurveyReportInformation(originalSurveyFile?.name);

  const surveyName = (originalSurvey?.surveyInfo[SurveyInfoNameKey] || originalSurveyFile?.name || '').toString();
  const surveyNameForReports = reportInfo?.projectName || originalSurveyFile?.name?.replace(/\.[^.]+$/, '') || surveyName;

  const handleTitleInfoChange = useCallback((info: TitleInfo, title: string, subtitle: string) => {
      setTitles({ primary: title, secondary: subtitle });
      updateReportInfo({ survey: originalSurveyFile ?? undefined, ...info });
  }, [originalSurveyFile, updateReportInfo]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaArrowsRotate className={styles.refreshButton} onClick={() => reloadEditedSurvey()}/>
        <h2>Report Viewer - {surveyName}</h2>
        <div className={styles.reportOptions}>
          <div>
            <span>Split Distance:</span>
            <input
              type="number"
              value={splitDistance}
              onChange={(e) => setSplitDistance(Number(e.target.value))}
              className={styles.splitDistanceInput}
            />
          </div>
          <div className={styles.checkboxRow}>
              <input
                  type={"checkbox"}
                  onChange={(e) => setIncludeDCVG(e.target.checked)}
                  checked={includeDCVG}/>
              {" Include DCVG Graph"}
          </div>
          <div className={styles.checkboxRow}>
                <input
                    type={"checkbox"}
                    onChange={(e) => setIncludeMap(e.target.checked)}
                    checked={includeMap}/>
                {" Include map"}
          </div>
        </div>
        <div className={styles.buttonsColumn}>
          <button
              onClick={() => setIsExportMode(true)}
              className={styles.exportButton}
          >EXPORT</button>
          <button
              onClick={() => setIsReportMode(true)}
              className={styles.reportButton}
          >ANOMALY REPORT</button>
        </div>
      </div>
      {originalSurvey && editedSurvey &&
        <div className={styles.titleEditor}>
            <span onClick={() => setShowTitleEditor(!showTitleEditor)}>
              {showTitleEditor ? <FaAngleDown/> : <FaAngleUp/>}
              {' [Title Editor] '}&emsp;
              <span className={styles.primaryTitle}>{titles.primary} </span>
              <span className={styles.secondaryTitle}>{titles.secondary}</span>
            </span>
            <div hidden={!showTitleEditor}>
                {loaded && <TitleEditorPanel
                    key={originalSurveyFile?.name}
                    initialValues={reportInfo ?? undefined}
                    projectNameOptions={projectNameSuggestions}
                    locationOptions={locationSuggestions}
                    onTitleInfoChange={handleTitleInfoChange}
                />}
            </div>
        </div>
      }
      <div className={styles.graphsContainer}>
        {graphs.map((graph, index) => (
          <div key={index}>
            <GraphDisplay
                key={index}
                graphInfo={graph}
                shouldFocus={shouldFocus}
                includeDCVG={includeDCVG}
            />
            <MapView
                mapInfo={maps[index]}
                allMapsInfos={maps}
                shouldFocus={shouldFocus}
                showPointsMode={shouldShowMapPoints}
                includeMap={includeMap}
            />
          </div>
        ))}
      </div>
      <ExportReportModal
          isOpen={isExportMode}
          onClose={() => setIsExportMode(false)}
          surveyName={surveyNameForReports}
          graphs={graphs}
          maps={maps}
          includeDCVG={includeDCVG}
          includeMap={includeMap}
      />
      <ReportModal
        isOpen={isReportMode}
        onClose={() => setIsReportMode(false)}
        surveyName={surveyNameForReports}
        originalSurveyFile={originalSurveyFile}
        editedSurvey={editedSurvey}
        stationDiff={distPerReading}
      />
    </div>
  );
};

export default ReportViewer;
