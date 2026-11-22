export interface FinalReportTestPoint {
  displayName: string;
  fileColor: string;
  pipelineSize: string;
  testPoint: string;
  vOn?: number;
  vOff?: number;
}

export interface TestPointsFinalReportData {
  title: string;
  hasDate: boolean;
  projectName: string;
  rows: FinalReportTestPoint[];
}
