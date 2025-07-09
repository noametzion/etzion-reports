"use client";

import { ReactNode, useState, useRef, useEffect } from 'react';
import styles from './ResizableView.module.css';

interface ResizableViewProps {
  left: ReactNode;
  right: ReactNode;
  defaultSplit?: number;
  minWidth?: number;
}

const ResizableView = ({
  left,
  right,
  defaultSplit = 50,
  minWidth = 25,
}: ResizableViewProps) => {
  const [splitPosition, setSplitPosition] = useState(defaultSplit);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate new split percentage (between minWidth and 100-minWidth)
    const newPosition = Math.max(
      minWidth,
      Math.min(100 - minWidth, (mouseX / containerWidth) * 100)
    );
    
    setSplitPosition(newPosition);
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={styles.panel} 
        style={{ width: `${splitPosition}dvw` }}
      >
        {left}
      </div>
      <div 
        className={`${styles.resizer} ${isResizing ? styles.resizing : ''}`}
        onMouseDown={startResizing} onMouseUp={stopResizing}
      />
      <div 
        className={styles.panel} 
        style={{ width: `${100 - splitPosition}dvw`}}
      >
        {right}
      </div>
    </div>
  );
};

export default ResizableView;
