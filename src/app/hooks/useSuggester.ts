"use client";

import {
    DCPDataAnomalyKey,
    DCPDataCommentKey,
    DCPDataRow,
    DCPDataStationKey,
    EditableType, EditedSurvey,
    Survey, SurveyAnomalyKey,
    SurveyCommentKey,
    SurveyDataRow, SurveyDSVGVoltageKeys, SurveyOnOffVoltageKeys,
    SurveyStationKey
} from "@/app/types/survey";
import {useCallback, useEffect, useState} from "react";

function getSuggestionsFromDCPData(surveyDCPData: DCPDataRow[], station: number, columnName: keyof DCPDataRow) {
    return surveyDCPData
        .filter((dcpData) => dcpData[DCPDataStationKey] === station)
        .map((dcpData) => dcpData[columnName])
        .filter(anomaly => anomaly !== undefined && anomaly !== "") as EditableType[];
}

const getCommentColumnSuggestions = (survey: EditedSurvey, rowIndex: number) => {
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

const getAnomalyColumnSuggestions = (survey: EditedSurvey, rowIndex: number) => {
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

const getAverageSuggestion = (eSurvey: EditedSurvey | Survey, rowIndex: number, columnName: keyof SurveyDataRow, stationDiff: number)=> {
    const previousRow = rowIndex - 1 >= 0 ? eSurvey.surveyData[rowIndex - 1] : undefined;
    const row = eSurvey.surveyData[rowIndex];
    const nextRow = rowIndex + 1 < eSurvey.surveyData.length ? eSurvey.surveyData[rowIndex + 1] : undefined;
    const previousStation = previousRow ? Number(previousRow[SurveyStationKey]) : undefined;
    const station = Number(row[SurveyStationKey]);
    const nextStation = nextRow ? Number(nextRow[SurveyStationKey]) : undefined;
    if (previousStation !== undefined && previousStation === station - stationDiff
        && nextStation !== undefined && nextStation === station + stationDiff) {
        const previousValue = previousRow ? Number(previousRow[columnName]) : undefined;
        const nextValue = nextRow ? Number(nextRow[columnName]) : undefined;
        if (previousValue !== undefined && !Number.isNaN(previousValue)
            && nextValue !== undefined && !Number.isNaN(nextValue)) {
            return [((previousValue + nextValue) / 2).toFixed(6)];
        }
    }
    return [];
}

export const useSuggester = (editedSurvey: EditedSurvey, stationDiff: number) => {

    const [suggestedCommentsStations, setSuggestedCommentsStations] = useState<number[]>([]);
    const [suggestedAnomaliesStations, setSuggestedAnomaliesStations] = useState<number[]>([]);

    useEffect(() => {
        const commentsStations = editedSurvey.DCPData
            .filter((dcpData) => dcpData[DCPDataCommentKey] !== undefined && dcpData[DCPDataCommentKey] !== "")
            .map((dcpData) => Number(dcpData[DCPDataStationKey]));
        const anomaliesStations = editedSurvey.DCPData
            .filter((dcpData) => dcpData[DCPDataAnomalyKey] !== undefined && dcpData[DCPDataAnomalyKey] !== "")
            .map((dcpData) => Number(dcpData[DCPDataStationKey]));
        setSuggestedCommentsStations(commentsStations);
        setSuggestedAnomaliesStations(anomaliesStations);
    }, [editedSurvey]);

    const getSuggestionsForColumn = useCallback((columnName: keyof SurveyDataRow, rowIndex: number) : EditableType[] => {
        switch (columnName) {
            case SurveyCommentKey:
                return getCommentColumnSuggestions(editedSurvey, rowIndex);
            case SurveyAnomalyKey:
                return getAnomalyColumnSuggestions(editedSurvey, rowIndex);
            default: {
                if (SurveyDSVGVoltageKeys.includes(columnName) || SurveyOnOffVoltageKeys.includes(columnName)) {
                    return getAverageSuggestion(editedSurvey, rowIndex, columnName, stationDiff);
                }
                return [];
            }
        }
    },[editedSurvey]);

    return { suggest: getSuggestionsForColumn, suggestedCommentsStations, suggestedAnomaliesStations } ;
};
