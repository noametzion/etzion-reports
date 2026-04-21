import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;
import {Project} from "@/app/types/project";
import {ReportInformation} from "@/app/types/reportInformation";

export interface DBType {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type DBProject = Project & DBType;
export type DBReportInformation = ReportInformation & DBType;