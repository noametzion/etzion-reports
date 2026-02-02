"use client";

import React, {useState} from 'react';
import {useProjects} from "@/app/hooks/useProjects";
import styles from './ProjectsPopover.module.css';


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
  const { add, upsert, remove, status, error } = useProjects();


  const ProjectNameEditor = () => {
    return (<input
        type="text"
        value={projectName}
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
      <ProjectNameEditor/>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ProjectsPopover;
