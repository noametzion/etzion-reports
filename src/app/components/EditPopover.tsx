"use client";

import React, {useState} from 'react';
import styles from './EditPopover.module.css';
import { FaSave, FaTimes, FaTrash} from 'react-icons/fa';
import {EditableType, EditableTypeName} from "@/app/types/survey";

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
  const [value, setValue] = useState<string>(initialValue?.toString() || '');
  const [cursor, setCursor] = useState<number | null>(null);

  const handleSave = () => {
    const valueToSave = value === "" ? undefined
        : (type === "number" ? Number(value): value);
    onSave(valueToSave);
    onClose();
  };

  const handleDelete = () => {
    onSave(undefined);
    onClose();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setCursor(e.target.selectionStart);
  }

  const NumberEditor = () => {
    return (<input
        type="text"
        value={value}
        inputMode="numeric"
        onChange={handleChange}
        className={styles.input}
        autoFocus
        onFocus={(e) => {
          if(cursor !== null) {
            e.target.setSelectionRange(cursor, cursor);
          }
        }}
    />);
  };

  const StringEditor = () => {
    return (<input
        type="text"
        value={value || ""}
        onChange={handleChange}
        className={styles.input}
        autoFocus
        onFocus={(e) => {
          if(cursor !== null) {
            e.target.setSelectionRange(cursor, cursor);
          }
        }}
      />);
  };

  const SuggestionsList = () => {
    return (<>
      {suggestions.length > 0 &&
          <select
              id="suggestions"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value || value)}
          >
            <option value="">--Choose Suggestion--</option>
            {suggestions.map((suggestion) => {
              return (
                  <option key={suggestion} value={suggestion}>{suggestion}</option>
              )})}
          </select>
      }
    </>);
  };

  const disableSaveButton = type === "number" && Number.isNaN(Number(value));

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Edit Value</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        {type === "number" && <NumberEditor />}
        {type === "string" && <StringEditor />}
        <SuggestionsList/>
        <div className={styles.buttonsContainer}>
          <button onClick={handleSave} className={styles.saveButton} disabled={disableSaveButton}><FaSave /></button>
          <button onClick={handleDelete} className={styles.deleteButton}><FaTrash /></button>
        </div>
      </div>
    </div>
  );
};

export default EditPopover;
