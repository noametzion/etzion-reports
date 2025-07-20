"use client";

import React, {useCallback, useMemo} from 'react';
import { GraphInfo } from '@/app/types/report';
import styles from './GraphDisplay.module.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import {useFocusDistance} from "@/app/hooks/useFocusDistance";

interface GraphDisplayProps {
  graphInfo: GraphInfo;
  shouldFocus: boolean;
}

const margin = { top: 5, right: 30, left: 20, bottom: 5 }
const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphInfo, shouldFocus }) => {
  const { focusDistance , setFocusDistance} = useFocusDistance(shouldFocus);

  const handleMouseMove = useCallback((e: any) => {
    if (e) {
      const hoveredDistance : number = Number(e.activeIndex) + graphInfo.startDistance;
      setFocusDistance(hoveredDistance)
    }
  },[graphInfo.startDistance, setFocusDistance]);

  const handleMouseLeave = useCallback(() => {
    setFocusDistance(null);
  },[setFocusDistance]);

  if (!graphInfo || !graphInfo.data || graphInfo.data.length === 0) {
    return (
        <div className={styles.container}>
          <div className={styles.placeholder}>No data to display for this graph segment.</div>
        </div>
    );
  }

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
          <YAxis label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} />
          <Tooltip cursor={{ stroke: 'transparent' }}/>
          <Legend />
          <Line type="linear" dataKey="onVoltage" stroke="#82ca9d" name="On Voltage" />
          <Line type="linear" dataKey="offVoltage" stroke="#8884d8" name="Off Voltage" />
          <Line type="linear" dataKey="constantVoltage" stroke="#ff0000" name="-850mV Ref" />
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
    handleMouseMove,
    handleMouseLeave,
    focusGraphPoint
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
      <Line type="linear" dataKey="dcvg" stroke="#878788" name="DCVG Diff" />
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
      handleMouseMove,
      handleMouseLeave,
      focusGraphPoint
  ]);

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
