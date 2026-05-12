export function getSurveyDisplayName(projectName?: string | null, originalFileName?: string): string | undefined {
    return projectName || originalFileName?.replace(/\.[^.]+$/, '');
}
