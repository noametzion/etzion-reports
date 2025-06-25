"use client";

import styles from "./page.module.css";
import ResizableView from "@/app/components/ResizableView";
import Survey from "@/app/components/SurveysViewer";
import Reports from "@/app/components/ReportViewer";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ResizableView
          left={<Survey />}
          right={<Reports />}
          defaultSplit={50}
          minWidth={25}
        />
      </main>
    </div>
  );
}
