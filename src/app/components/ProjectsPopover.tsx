"use client";

import React, {useState} from 'react';
import {useProjects} from "@/app/hooks/useProjects";
import styles from './ProjectsPopover.module.css';
import {FaSave, FaTimes} from "react-icons/fa";


interface ProjectsPopoverProps {
  onClose: () => void;
  top?: number;
  left?: number;
}

const ProjectsPopover: React.FC<ProjectsPopoverProps> = ({
  onClose,
  top = 100,
  left = 100,
}) => {
  const [projectName, setProjectName] = useState<string>("");
  const { add } = useProjects();


  const ProjectNameEditor = () => {
    return (<input
        type="text"
        value={projectName}
        className={styles.input}
        onChange={(e) => setProjectName(e.target.value)}
        autoFocus
    />);
  };

  const handleSave = () => {
    add({projectName, projectFiles: []});
    onClose();
  };

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Add New Project</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <ProjectNameEditor/>
        <div className={styles.buttonsContainer}>
          {/*TODO: disable if name already exist*/}
          <button onClick={handleSave} className={styles.saveButton} disabled={false}><FaSave className={styles.saveIcon} /> Save</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPopover;
