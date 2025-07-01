import React from 'react';
import { GraphInfo } from '@/app/types/report';
import styles from './GraphDisplay.module.css';

interface GraphDisplayProps {
  graphInfo: GraphInfo;
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphInfo }) => {
  return (
    <div className={styles.container}>
      <h3>Graph</h3>
      {/* Graph rendering logic will go here */}
      <div className={styles.placeholder}>Graph will be displayed here</div>
    </div>
  );
};

export default GraphDisplay;
