import {DataPoint} from "@/app/types/report";

export const createSegments = (numberOfDataPoints: number, splitDistance: number) : { [key: number]: DataPoint[] }=> {
    console.log(numberOfDataPoints, splitDistance);

    const segments: { [key: number]: DataPoint[] } = {};
    const totalSegments = Math.ceil(numberOfDataPoints / splitDistance);

    for (let segmentIndex = 0; segmentIndex < totalSegments; segmentIndex++) {
        const start = segmentIndex * splitDistance;
        const end = (segmentIndex + 1) * splitDistance - 1;

        segments[segmentIndex] = [];

        for (let distance = start; distance <= end; distance++) {
            segments[segmentIndex].push({ distance: distance });
        }
    }

    return segments;
}