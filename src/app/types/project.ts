import {SurveyFile} from "@/app/types/survey";

export interface Project {
    projectName: string;
    projectFiles: SurveyFile[];
}