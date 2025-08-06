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

interface GraphDisplayProps {
  graphInfo: GraphInfo;
  shouldFocus: boolean;
}

const margin = { top: 5, right: 30, left: 20, bottom: 5 }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CommentLabel = ({ x, y, index, value, firstDistance}: any) => {
    return (
        <text
            x={x} y={y} dy={2.5} dx={y-350}
            fontSize={10}
            textAnchor="start"
            transform={(x !== undefined && y != undefined) ?`rotate(-90, ${x}, ${y})` : ''}
        >
            {/*{ value !== undefined ? `${value} | ${firstDistance + index} ──` : '' }*/}
            { value !== undefined ? ` ── ${firstDistance + index} | ${value}` : '' }
        </text>
    );
};

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphInfo, shouldFocus }) => {
  const { focusDistance , setFocusDistance} = useFocusDistance(shouldFocus);

  // eslint-disable-next-line
  const handleMouseMove = useCallback((e: any) => {
    if (e) {
      const hoveredDistance : number = Number(e.activeIndex) + graphInfo.startDistance;
      setFocusDistance(hoveredDistance)
    }
  },[graphInfo.startDistance, setFocusDistance]);

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
                label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: 0 }}
            />
            <YAxis label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} reversed/>
            <Tooltip cursor={{ stroke: 'transparent' }}/>
            <Legend />
            <Line type="linear" dataKey="onVoltage" stroke="#82ca9d" name="On Voltage" dot={false} />
            <Line type="linear" dataKey="offVoltage" stroke="#8884d8" name="Off Voltage" dot={false}/>
            <Line type="linear" dataKey="constantVoltage" stroke="#ff0000" name="-850mV Ref" dot={false}>
                <LabelList dataKey="comment" content={(props) => <CommentLabel firstDistance={graphInfo.startDistance} {...props}/>}/>
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
            label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: 0 }}
        />
        <YAxis label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
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
      <div className={styles.container}>
        <h3 className={styles.title}>{graphInfo.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          {OnOffGraph}
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={250}>
          {DCVGGraph}
        </ResponsiveContainer>
      </div>
  );
};

export default GraphDisplay;
