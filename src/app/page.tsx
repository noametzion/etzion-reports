"use client";

import styles from "./page.module.css";
import ResizableView from "@/app/components/ResizableView";
import SurveysViewer from "@/app/components/SurveysViewer";
import ReportViewer from "@/app/components/ReportViewer";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ResizableView
          left={<SurveysViewer />}
          right={<ReportViewer />}
          defaultSplit={50}
          minWidth={25}
        />
      </main>
    </div>
  );
}
