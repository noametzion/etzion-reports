import {DataPoint} from "@/app/types/report";

export const createSegments = (lastDistance: number, distanceDiff: number, splitDistance: number) : { [key: number]: DataPoint[] }=> {
    const segments: { [key: number]: DataPoint[] } = {};
    const numberOfSegments = Math.ceil(lastDistance / splitDistance);

    let distance = 0;
    for (let segmentIndex = 0; segmentIndex < numberOfSegments; segmentIndex++) {

        segments[segmentIndex] = [];

        for (distance; distance <= splitDistance*(segmentIndex+1); distance+=distanceDiff) {
            segments[segmentIndex].push({ distance: distance });
        }
    }

    return segments;
}

export const getSegmentIndex = (distance: number, splitDistance: number)=> {
    return Math.floor(distance / splitDistance);
}

export const getDistanceIndexInSegment = (distance: number, distanceDiff: number, splitDistance: number, )=> {
    return Math.floor((distance % splitDistance) / distanceDiff);
}