import {SurveyFile} from "@/app/types/survey";

export interface ReportInformation {
    survey: SurveyFile;
    projectName: string;
    from: string;
    to: string;
    pipelineSize: string;
    date: string;
}

export interface TitleInfo {
    projectName: string;
    from: string;
    to: string;
    pipelineSize: string;
    date: string;
}