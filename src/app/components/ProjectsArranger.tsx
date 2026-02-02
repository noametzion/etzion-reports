"use client";

import React, {useState} from 'react';
import styles from './ProjectsArranger.module.css';
import ProjectsPopover from "@/app/components/ProjectsPopover";
import {FaFolderPlus} from "react-icons/fa";

interface ProjectsArrangerProps {
}

const ProjectsArranger: React.FC<ProjectsArrangerProps> = ({}) => {
    const [showProjectsPopover, setShowProjectsPopover] = useState<boolean>();

    return (
        <div className={styles.container}>
            <button
                onClick={() => setShowProjectsPopover(true)}
                className={styles.addButton}
                title={`Add New Project`}
            >
                <FaFolderPlus className={styles.addIcon} />
                <span> Add New Project</span>
            </button>
            { showProjectsPopover && <ProjectsPopover onClose={() => setShowProjectsPopover(false)}/> }
        </div>
    );
};

export default ProjectsArranger;
