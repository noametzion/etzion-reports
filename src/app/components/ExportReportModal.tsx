"use client";

import React, {useState} from 'react';
import styles from './ExportReportModal.module.css';
import {jsPDF} from "jspdf";
import {toPng} from "html-to-image";
import {GraphInfo, MapInfo} from "@/app/types/report";
import GraphDisplay from "@/app/components/GraphDisplay";
import dynamic from "next/dynamic";

// Dynamically import MapView only on the client (because using leaflet)
const MapView =
    dynamic(() =>
        import("@/app/components/MapView"), { ssr: false });

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyName: string;
  graphs: GraphInfo[];
  maps: MapInfo[];
  includeDCVG?: boolean;
}

const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  surveyName,
  graphs,
  maps,
  includeDCVG = true
}) => {

  const [loading, setLoading] = useState<boolean>(false);
  if (!isOpen) return null;

  const exportReportAsPdf = async () => {
    setLoading(true);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    for (let index = 0; index < graphs.length; index++) {
      const graph = graphs[index];
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

      const graphElement = document.getElementById(`graph_${index}`);
      if (graphElement) {
        try {
          // Convert to image
          const dataUrl = await toPng(graphElement, {
            style: {
              transform: 'none',
              width: '300px',
              height: '150px',
            }
          });

          // Add the image to the PDF
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = 260; // Width in mm
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(
              dataUrl,
              'PNG',
              (pdf.internal.pageSize.getWidth() - pdfWidth) / 2, // Center the image
              36, // y position
              pdfWidth,
              pdfHeight
          );
        } catch (error) {
          console.error('Error converting graph to image:', error);
        } finally {
        }
      }

      // Page number
      const pageNumberText = `Page ${index + 1} of ${graphs.length}`;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      const pageNumberWidth = pdf.getStringUnitWidth(pageNumberText) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const pageNumberX = (pdf.internal.pageSize.getWidth() - pageNumberWidth) / 2;
      pdf.text(pageNumberText, pageNumberX, pdf.internal.pageSize.getHeight() - 10);
    }

    // Save the PDF
    pdf.save(`${surveyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);

    setLoading(false);
  };

  const containerClassName = [
    styles.graphsContainer,
    loading && styles.containerLoading,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{`Export PDF Report`}</h2>
          <button className={styles.exportButton} onClick={exportReportAsPdf}>Save As PDF</button>
          {loading &&<div className={styles.loader}/>}
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={containerClassName}>
          {graphs.map((graph, index) => (
              <div key={`container_${index}`}>
                <h3 className={styles.title}>{graph.title}</h3>
                <h4 className={styles.subtitle}>{graph.subtitle}</h4>
                <div key={index} id={`graph_${index}`}>
                  <GraphDisplay
                      key={index}
                      graphInfo={graph}
                      shouldFocus={false}
                      mode="export"
                      includeDCVG={includeDCVG}
                  />
                  <div className={styles.mapViewContainer}>
                    <MapView
                        mapInfo={maps[index]}
                        allMapsInfos={maps}
                        shouldFocus={false}
                        mode="export"
                        extendedMap={!includeDCVG}
                    />
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
