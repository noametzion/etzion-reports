"use client";

import React from 'react';
import {SurveyInfoNameKey, SurveyFile} from '@/app/types/survey';
import { useGraphs } from '@/app/hooks/useGraphs';
import GraphDisplay from './GraphDisplay';
import styles from './ReportViewer.module.css';
import {useSurveyReader} from "@/app/hooks/useSurveyReader";
import {useMaps} from "@/app/hooks/useMaps";
import dynamic from "next/dynamic";
import TitleEditorPanel from './TitleEditorPanel';
import {FaAngleDown, FaAngleUp} from "react-icons/fa";
import {useSurveyEditor} from "@/app/hooks/useSurveyEditor";
import {FaArrowsRotate} from "react-icons/fa6";
import { jsPDF } from 'jspdf';
// Dynamically import MapView only on the client (because using leaflet)
const MapView =
    dynamic(() =>
        import("@/app/components/MapView"), { ssr: false });

interface ReportViewerProps {
  originalSurveyFile: SurveyFile | null;
  shouldFocus: boolean;
}

const DEFAULT_SPLIT_DISTANCE = 500;

const ReportViewer: React.FC<ReportViewerProps> = ({ originalSurveyFile , shouldFocus}) => {
  const {survey: originalSurvey} = useSurveyReader(originalSurveyFile);
  const {editedSurvey, reload: reloadEditedSurvey} = useSurveyEditor(originalSurveyFile, originalSurvey);
  const [splitDistance, setSplitDistance] = React.useState<number>(DEFAULT_SPLIT_DISTANCE);
  const [showTitleEditor, setShowTitleEditor] = React.useState<boolean>(false);
  const [titles, setTitles] = React.useState<{primary: string, secondary: string}>({primary: '', secondary: ''});
  const graphs = useGraphs(editedSurvey?.surveyData || null, splitDistance, titles);
  const maps = useMaps(editedSurvey?.surveyData || null, splitDistance);

  const surveyName = (originalSurvey?.surveyInfo[SurveyInfoNameKey] || originalSurveyFile?.name || '').toString();

  const handleTitleSave = (title: string, subtitle: string) => {
      setTitles({ primary: title, secondary: subtitle})
      setShowTitleEditor(false);
  };

  const exportReportAsPdf = () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    graphs.forEach((graph, index) => {
      if (index > 0) {  // Add a new page for each graph after the first one
        pdf.addPage([pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()], 'landscape');
      }

      // Titles
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(24);
      const titleWidth = pdf.getStringUnitWidth(graph.title) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const titleX = (pdf.internal.pageSize.getWidth() - titleWidth) / 2; // Center the text
      pdf.text(graph.title, titleX, 20);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(16);
      const subTitleWidth = pdf.getStringUnitWidth(graph.subtitle) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const subTitleX = (pdf.internal.pageSize.getWidth() - subTitleWidth) / 2;
      pdf.text(graph.subtitle, subTitleX, 30);

      // Page number
      const pageNumberText = `Page ${index + 1} of ${graphs.length}`;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      const pageNumberWidth = pdf.getStringUnitWidth(pageNumberText) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const pageNumberX = (pdf.internal.pageSize.getWidth() - pageNumberWidth) / 2;
      pdf.text(pageNumberText, pageNumberX, pdf.internal.pageSize.getHeight() - 10);

    });

    // Save the PDF
    pdf.save(`${surveyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaArrowsRotate className={styles.refreshButton} onClick={() => reloadEditedSurvey()}/>
        <h2>Report Viewer - {surveyName}</h2>
        <span>Split Distance:</span>
        <input
          type="number"
          value={splitDistance}
          onChange={(e) => setSplitDistance(Number(e.target.value))}
          className={styles.splitInput}
        />
        <button
            onClick={exportReportAsPdf}
            className={styles.exportButton}
        >EXPORT</button>
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
                <TitleEditorPanel
                    initialProjectName={surveyName}
                    onSave={handleTitleSave}
                />
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
