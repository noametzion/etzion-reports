import React, { useState, useEffect } from 'react';
import styles from './EditPopover.module.css';
import { FaSave, FaTimes, FaTrash} from 'react-icons/fa';


export type EditableType = number | string ;
export type EditableTypeName = "string" | "number";

interface EditPopoverProps {
  initialValue?: EditableType;
  onSave: (newValue: EditableType | undefined) => void;
  onClose: () => void;
  type?: EditableTypeName;
  suggestions: EditableType[];
  top: number;
  left: number;
}

const EditPopover: React.FC<EditPopoverProps> = ({
  initialValue,
  onSave,
  onClose,
  type,
  suggestions,
  top,
  left,
}) => {
  const [value, setValue] = useState<EditableType | undefined>(initialValue || undefined);

  useEffect(() => {
    setValue(initialValue || undefined);
  }, [initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleDelete = () => {
    onSave(undefined);
    onClose();
  }

  const NumberEditor = () => {
    return (<input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={styles.input}
        autoFocus
    />);
  };

  const StringEditor = () => {
    return (<input
        type="text"
        value={value || ""}
        onChange={(e) => setValue(e.target.value)}
        className={styles.input}
        autoFocus
    />);
  };

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        {/*<FaExclamationTriangle className={styles.errorIcon} />*/}
        <h4>Edit Value</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        {type === "number" && <NumberEditor />}
        {type === "string" && <StringEditor />}
        <div className={styles.buttonsContainer}>
          <button onClick={handleSave} className={styles.saveButton}><FaSave /></button>
          <button onClick={handleDelete} className={styles.deleteButton}><FaTrash /></button>
        </div>
      </div>
    </div>
  );
};

export default EditPopover;
