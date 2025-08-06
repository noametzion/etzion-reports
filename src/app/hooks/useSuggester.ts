"use client";

import {
    DCPDataAnomalyKey,
    DCPDataCommentKey,
    DCPDataRow,
    DCPDataStationKey,
    EditableType,
    Survey, SurveyAnomalyKey,
    SurveyCommentKey,
    SurveyDataRow,
    SurveyStationKey
} from "@/app/types/survey";
import {useCallback, useEffect, useState} from "react";

function getSuggestionsFromDCPData(surveyDCPData: DCPDataRow[], station: number, columnName: keyof DCPDataRow) {
    return surveyDCPData
        .filter((dcpData) => dcpData[DCPDataStationKey] === station)
        .map((dcpData) => dcpData[columnName])
        .filter(anomaly => anomaly !== undefined && anomaly !== "") as EditableType[];
}

const getCommentColumnSuggestions = (survey: Survey, rowIndex: number) => {
    const row = survey.surveyData[rowIndex];
    const station = Number(row[SurveyStationKey]);
    const initialValue = row[SurveyCommentKey];
    const DCPSuggestions = getSuggestionsFromDCPData(survey.DCPData, station, DCPDataCommentKey)

    const suggestions = (initialValue !== undefined && initialValue !== "") ? [
        ...DCPSuggestions,
        initialValue
    ] : DCPSuggestions;

    return [...new Set(suggestions)]; // remove duplicates
};

const getAnomalyColumnSuggestions = (survey: Survey, rowIndex: number) => {
    const row = survey.surveyData[rowIndex];
    const station = Number(row[SurveyStationKey]);
    const initialValue = row[SurveyAnomalyKey];
    const DCPSuggestions = getSuggestionsFromDCPData(survey.DCPData, station, DCPDataAnomalyKey)

    const suggestions = (initialValue !== undefined && initialValue !== "") ? [
        ...DCPSuggestions,
        initialValue
    ] : DCPSuggestions;

    return [...new Set(suggestions)]; // remove duplicates
};

export const useSuggester = (originalSurvey: Survey) => {

    const [suggestedCommentsStations, setSuggestedCommentsStations] = useState<number[]>([]);
    const [suggestedAnomaliesStations, setSuggestedAnomaliesStations] = useState<number[]>([]);

    // useEffect(() => {
    //     console.log("called");
    //     const commentsStations = originalSurvey.DCPData
    //         .filter((dcpData) => dcpData[DCPDataCommentKey] !== undefined && dcpData[DCPDataCommentKey] !== "")
    //         .map((dcpData) => Number(dcpData[DCPDataStationKey]));
    //     const anomaliesStations = originalSurvey.DCPData
    //         .filter((dcpData) => dcpData[DCPDataAnomalyKey] !== undefined && dcpData[DCPDataAnomalyKey] !== "")
    //         .map((dcpData) => Number(dcpData[DCPDataStationKey]));
    //     console.log("COMMENTS", commentsStations);
    //     console.log("ANOMALIES", anomaliesStations);
    //     setSuggestedCommentsStations(commentsStations);
    //     setSuggestedAnomaliesStations(anomaliesStations);
    // }, [originalSurvey]);

    const getSuggestionsForColumn = useCallback((columnName: keyof SurveyDataRow, rowIndex: number) : EditableType[] => {
        switch (columnName) {
            case SurveyCommentKey:
                return [];
                // return getCommentColumnSuggestions(originalSurvey, rowIndex);
            case SurveyAnomalyKey:
                return [];
                // return getAnomalyColumnSuggestions(originalSurvey, rowIndex);
            default:
                return [];
        }
    },[originalSurvey]);

    return { suggest: getSuggestionsForColumn, suggestedCommentsStations, suggestedAnomaliesStations } ;
};
