import { ProjectItem } from '../sanity/queries'
import styles from '../styles/ProjectOverlay.module.scss'

interface ProjectOverlayProps {
  project: ProjectItem
  onClose: () => void
}

export default function ProjectOverlay({ project, onClose }: ProjectOverlayProps) {
  return (
    <div
        className={styles.overlay}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(80px)',
        }}
    >
      <div className={styles.header}>
        <h2>{project.titleEn}</h2>
        <button className={styles.close} onClick={onClose} aria-label="Close"/>

      </div>
      <div className={styles.content}>
        Lorem ipsum
        {/*<p className={styles.year}>{project.year}</p>*/}
      </div>
    </div>
  )
}
