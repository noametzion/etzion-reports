export interface FinalReportMeasurementPoint {
  displayName: string;
  fileColor: string;
  pipelineSize: string;
  testPoint: string;
  vOn?: number;
  vOff?: number;
}

export interface MeasurementPointsFinalReportData {
  title: string;
  hasDate: boolean;
  projectName: string;
  rows: FinalReportMeasurementPoint[];
}
