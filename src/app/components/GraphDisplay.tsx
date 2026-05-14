"use client";

import React, {useCallback, useMemo} from 'react';
import { GraphInfo } from '@/app/types/report';
import styles from './GraphDisplay.module.css';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceDot,
    LabelList,
} from 'recharts';
import {useFocusDistance} from "@/app/hooks/useFocusDistance";
import { scaleLinear } from "d3-scale";

interface GraphDisplayProps {
  graphInfo: GraphInfo;
  shouldFocus: boolean;
  mode?: 'export' | 'view';
  includeDCVG?: boolean;
}

const margin = { top: 5, right: 30, left: 20, bottom: 5 }

const defaultDCVGDomain = [-20, 20];

const niceDomain = (min: number, max: number, ticks = 6): [number, number] => {
    const s = scaleLinear().domain([min, max]).nice(ticks);
    return s.domain() as [number, number];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CommentLabel = ({ x, y, index, value, firstDistanceOnSegment, distanceDiff}: any) => {
    return (
        <text
            x={x} y={y} dy={2.5} dx={y-350}
            fontSize={10}
            textAnchor="start"
            transform={(x !== undefined && y != undefined) ?`rotate(-90, ${x}, ${y})` : ''}
        >
            { value !== undefined ? ` ── ${firstDistanceOnSegment + index * distanceDiff} | ${value}` : '' }
        </text>
    );
};

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphInfo, shouldFocus , mode = 'view' , includeDCVG = true}) => {
  const { focusDistance , setFocusDistance} = useFocusDistance(shouldFocus);

  // eslint-disable-next-line
  const handleMouseMove = useCallback((e: any) => {
    if (e) {
      const hoveredDistance : number = Number(e.activeLabel);
      setFocusDistance(hoveredDistance)
    }
  },[setFocusDistance]);

  const handleMouseLeave = useCallback(() => {
    setFocusDistance(null);
  },[setFocusDistance]);

  const focusGraphPoint = useMemo(() => {
    return graphInfo.data.find(point => point.distance === focusDistance);
  },[graphInfo.data, focusDistance]);

  const OnOffGraph = useMemo(() => {
    return (
        <LineChart
            data={graphInfo.data}
            margin={margin}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="distance"
                type="number"
                domain={[graphInfo.startDistance, graphInfo.endDistance]}
                label={{ value: 'Distance (stations)', position: 'insideBottomRight', offset: 0 }}
            />
            <YAxis label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} reversed/>
            <Tooltip cursor={{ stroke: 'transparent' }}/>
            <Legend />
            <Line type="linear" dataKey="onVoltage" stroke="#82ca9d" name="On Voltage" dot={false} />
            <Line type="linear" dataKey="offVoltage" stroke="#8884d8" name="Off Voltage" dot={false}/>
            <Line type="linear" dataKey="constantVoltage" stroke="#ff0000" name="-850mV Ref" dot={false}>
                <LabelList
                    dataKey="comment"
                    content={(props) =>
                        <CommentLabel
                            firstDistanceOnSegment={graphInfo.data[0].distance}
                            distanceDiff={graphInfo.distanceDiff}
                            {...props}
                        />}
                />
            </Line>
            <ReferenceDot
                x={focusGraphPoint?.distance}
                y={focusGraphPoint?.onVoltage}
                ifOverflow="discard"
                r={4}
                fill="#82ca9d"
                stroke="white"
                strokeWidth={2}
            />
            <ReferenceDot
                x={focusGraphPoint?.distance}
                y={focusGraphPoint?.offVoltage}
                ifOverflow="discard"
                r={4}
                fill="#8884d8"
                stroke="white"
                strokeWidth={2}
            />
            <ReferenceDot
                x={focusGraphPoint?.distance}
                y={focusGraphPoint?.constantVoltage}
                ifOverflow="discard"
                r={4}
                fill="#ff0000"
                stroke="white"
                strokeWidth={2}
            />
        </LineChart>
    );
},[
    graphInfo.data,
    graphInfo.startDistance,
    graphInfo.endDistance,
    graphInfo.distanceDiff,
    handleMouseMove,
    handleMouseLeave,
    focusGraphPoint,
  ]);

  const DCVGGraph = useMemo(() => {
    return (<LineChart
        data={graphInfo.data}
        margin={margin}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
            dataKey="distance"
            type="number"
            domain={[graphInfo.startDistance, graphInfo.endDistance]}
            label={{ value: 'Distance (stations)', position: 'insideBottomRight', offset: 0 }}
        />
        <YAxis
            label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }}
            domain={
                ([dataMin, dataMax]) => {
                    return niceDomain(
                        dataMin < defaultDCVGDomain[0] ? dataMin : defaultDCVGDomain[0],
                        dataMax > defaultDCVGDomain[1] ? dataMax : defaultDCVGDomain[1]
                    );
                }
            }
        />
        <Tooltip />
        <Legend />
        <Line type="linear" dataKey="constantDCVGDiff" stroke="#4B21424D" name="0mV Ref" dot={false}/>
        <Line type="linear" dataKey="dcvg" stroke="#878788" name="DCVG Diff" dot={false}/>
        <ReferenceDot
            x={focusGraphPoint?.distance}
            y={focusGraphPoint?.dcvg}
            ifOverflow="discard"
            r={4}
            fill="#878788"
            stroke="white"
            strokeWidth={2}
        />
    </LineChart>);
},[
    graphInfo.data,
    graphInfo.startDistance,
    graphInfo.endDistance,
    handleMouseMove,
    handleMouseLeave,
    focusGraphPoint,
  ]);

  if (!graphInfo || !graphInfo.data || graphInfo.data.length === 0) {
    return (
        <div className={styles.container}>
          <div className={styles.placeholder}>No data to display for this graph segment.</div>
        </div>
    );
  }

  return (
      <div className={mode === 'view' ? styles.containerView : styles.containerExport}>
        {mode === 'view' && <h3 className={styles.title}>{graphInfo.title}</h3>}
        {mode === 'view' && <h4 className={styles.subtitle}>{graphInfo.subtitle}</h4>}
        <ResponsiveContainer width="100%" height={(!includeDCVG && mode === "export")? 550 : 400}>
          {OnOffGraph}
        </ResponsiveContainer>
        {includeDCVG ? <ResponsiveContainer width="100%" height={250}>
          {DCVGGraph}
        </ResponsiveContainer> : null}
      </div>
  );
};

export default GraphDisplay;
