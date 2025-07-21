"use client";

import styles from "./page.module.css";
import ResizableView from "@/app/components/ResizableView";
import SurveysViewer from "@/app/components/SurveysViewer";
import ReportViewer from "@/app/components/ReportViewer";
import {useState} from "react";
import {SurveyFile} from "@/app/types/survey";
import {FocusPointProvider} from "@/app/context/FocusDistanceContext";

export default function Home() {
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyFile | null>(null);
  const [shouldFocus, setShouldFocus] = useState<boolean>(false);

  const handleSurveySelected = (surveyFile: SurveyFile | null) => {
    setSelectedSurvey(surveyFile);
  }

  return (
    <FocusPointProvider>
      <div className={styles.page}>
        <main className={styles.main}>
          <ResizableView
            left={<SurveysViewer onSurveySelected={handleSurveySelected} shouldFocus={shouldFocus} onShouldFocusDistanceChanges={setShouldFocus}/>}
            right={<ReportViewer surveyFile={selectedSurvey} shouldFocus={shouldFocus}/>}
            defaultSplit={50}
            minWidth={25}
          />
        </main>
      </div>
    </FocusPointProvider>
  );
}
