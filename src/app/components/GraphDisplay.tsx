import React from 'react';
import { GraphInfo } from '@/app/types/report';
import styles from './GraphDisplay.module.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraphDisplayProps {
  graphInfo: GraphInfo;
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphInfo }) => {
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
        <LineChart
          data={graphInfo.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="distance"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: 0 }}
          />
          <YAxis label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="onVoltage" stroke="#82ca9d" name="On Voltage" />
          <Line type="monotone" dataKey="offVoltage" stroke="#8884d8" name="Off Voltage" />
          <Line type="monotone" dataKey="constantVoltage" stroke="#ff0000" name="-850mV Ref" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphDisplay;
