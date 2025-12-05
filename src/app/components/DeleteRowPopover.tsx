"use client";

import React from 'react';
import styles from './DeleteRowPopover.module.css';
import { FaTimes, FaTrash} from 'react-icons/fa';

interface EditPopoverProps {
  onApproveDelete: () => void;
  onClose: () => void;
  top: number;
  left: number;
}

const DeleteRowPopover: React.FC<EditPopoverProps> = ({
  onApproveDelete,
  onClose,
  top,
  left,
}) => {

  const handleApproveDelete = () => {
    onApproveDelete();
    onClose();
  };

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Delete Row</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <div><strong>Are you sure you want to delete this row?</strong></div>
        <div>Please note that deleting a row will cause a numbering gap.</div>
        <div className={styles.buttonsContainer}>
          <button onClick={handleApproveDelete} className={styles.okButton}><span>Delete <FaTrash/></span></button>
          <button onClick={onClose} className={styles.cancelButton}><span>Cancel</span></button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRowPopover;
