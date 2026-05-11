import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;
import {Project} from "@/app/types/project";
import {ReportInformation} from "@/app/types/reportInformation";
import {AnomalyReport} from "@/app/types/report";
import {SurveyFile} from "@/app/types/survey";

export interface DBType {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type DBProject = Project & DBType;
export type DBReportInformation = ReportInformation & DBType;
export type DBAnomalyReport = {
    anomalyReport: AnomalyReport;
    originalSurveyFile: SurveyFile;
} & DBType;