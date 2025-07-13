import React, { useState, useEffect } from 'react';
import styles from './ErrorPopover.module.css';
import { FaExclamationTriangle, FaSave, FaTimes } from 'react-icons/fa';

interface ErrorPopoverProps {
  initialValue: number | undefined;
  onSave: (newValue: number) => void;
  onClose: () => void;
  top: number;
  left: number;
}

const ErrorPopover: React.FC<ErrorPopoverProps> = ({ initialValue, onSave, onClose, top, left }) => {
  const [value, setValue] = useState(initialValue || 0);

  useEffect(() => {
    setValue(initialValue || 0);
  }, [initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h4>Edit Value</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className={styles.input}
          autoFocus
        />
        <button onClick={handleSave} className={styles.saveButton}><FaSave /></button>
      </div>
    </div>
  );
};

export default ErrorPopover;
