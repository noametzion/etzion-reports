"use client";

import React, { useState } from 'react';
import styles from './AutocompleteInput.module.css';

export interface AutocompleteInputProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  type?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, options, type = 'text' }) => {
  const [open, setOpen] = useState(false);

  const filtered = options.filter(o =>
      o.toLowerCase().includes(value.toLowerCase())
  );

  return (
      <div className={styles.wrapper}>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && filtered.length > 0 && (
            <ul className={styles.dropdown}>
              {filtered.map(o => (
                  <li key={o} onMouseDown={() => onChange(o)}>{o}</li>
              ))}
            </ul>
        )}
      </div>
  );
};

export default AutocompleteInput;
