"use client";

import React, {useState} from 'react';
import {useProjects} from "@/app/hooks/useProjects";
import styles from './ProjectsPopover.module.css';
import {FaSave, FaTimes} from "react-icons/fa";
import {DBProject} from "@/app/types/dbTypes";
import {SurveyFile} from "@/app/types/survey";
import {Project} from "@/app/types/project";


interface LinkToProjectPopoverProps {
  onClose: () => void;
  top: number;
  left: number;
  currentSelectedProject?: DBProject;
  file: SurveyFile;
}

const LinkToProjectPopover: React.FC<LinkToProjectPopoverProps> = ({
  onClose,
  top,
  left,
  currentSelectedProject,
  file,
}) => {
  const {projects, update} = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentSelectedProject?.id || "");

  const isSameProject = selectedProjectId === (currentSelectedProject?.id || "");

  const handleSave = async () => {
    if(!isSameProject) {
      if (currentSelectedProject !== undefined) {
        const prevProjectToUpdate : Project = {
          ...currentSelectedProject,
          projectFiles: currentSelectedProject.projectFiles.filter(
            (sf) => sf.path !== file.path
          ),
        };
        await update(currentSelectedProject.id, prevProjectToUpdate);
      }
      if (selectedProjectId !== "") {
        const newSelectedProject = projects.find((p) => p.id === selectedProjectId)!
        const newProjectToUpdate: Project = {
          ...newSelectedProject,
          projectFiles: [...newSelectedProject.projectFiles, file]
        };
        await update(selectedProjectId, newProjectToUpdate);
      }
    }
    onClose();
  };

  return (
    <div className={styles.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={styles.header}>
        <h4>Assign File to Project</h4>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
      </div>
      <div className={styles.content}>
        <select
            value={selectedProjectId}
            onChange={
              (e) =>
                  setSelectedProjectId(e.target.value)
            }
        >
          <option value="">
            Select project…
          </option>

          {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
          ))}
        </select>
        <div className={styles.buttonsContainer}>
          <button onClick={handleSave} className={styles.saveButton} disabled={isSameProject}><FaSave className={styles.saveIcon} /> Save</button>
        </div>
      </div>
    </div>
  );
};

export default LinkToProjectPopover;
