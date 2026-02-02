"use client";

import React, {useState} from 'react';
import styles from './ProjectsArranger.module.css';
import ProjectsPopover from "@/app/components/ProjectsPopover";

interface ProjectsArrangerProps {
}

const ProjectsArranger: React.FC<ProjectsArrangerProps> = ({}) => {
    const [showProjectsPopover, setShowProjectsPopover] = useState<boolean>();

    return (
        <div className={styles.container}>
            <label>Projects: </label>
            <button onClick={() => setShowProjectsPopover(true)}> + </button>
            { showProjectsPopover && <ProjectsPopover onClose={() => setShowProjectsPopover(false)}/> }
        </div>
    );
};

export default ProjectsArranger;
