import { ProjectItem } from '../sanity/queries'
import styles from '../styles/ProjectOverlay.module.scss'
import ReactPlayer from 'react-player'
import { InstagramEmbed } from 'react-social-media-embed'

const t = {
  en: { year: 'Year:', client: 'Client:', team: 'Team:', tags: 'Tags:', videos: 'Videos:' },
  cs: { year: 'Rok:',  client: 'Klient:', team: 'Tým:',  tags: 'Tagy:', videos: 'Videa:' },
}

interface ProjectOverlayProps {
  project: ProjectItem
  lang: 'en' | 'cs'
  onClose: () => void
}

export default function ProjectOverlay({ project, lang, onClose }: ProjectOverlayProps) {
  const labels = t[lang]
  const title = lang === 'cs' ? project.titleCs : project.titleEn

  return (
      <div
          className={styles.overlay}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(80px)',
          }}
      >
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close"/>
        </div>


        <div className={styles.content}>
          <div className={styles.section}>{project.year}</div>

          {project.tags && project.tags.length > 0 && (
              <div className={styles.section}>
                <span>
                  {project.tags.map(tag => (lang === 'cs' ? tag.titleCs : tag.titleEn) || tag.titleEn || tag.titleCs).join(', ')}
                </span>
              </div>
          )}

          {project.client && (project.client.name || project.client.url) && (
              <div className={styles.section}>
                <span className={styles.label}>{labels.client}</span>{' '}
                {project.client.url
                    ? <a href={project.client.url} target="_blank"
                         rel="noopener noreferrer">{project.client.name || project.client.url}</a>
                    : project.client.name
                }
              </div>
          )}

          {project.team && project.team.length > 0 && (
              <div className={styles.section}>
                <span className={styles.label}>{labels.team}</span>{' '}
                <span>{project.team.map(m => m.name).join(', ')}</span>
              </div>
          )}


          {project.videos && project.videos.length > 0 && (
              <div className={styles.sectionVideos}>
                <span className={styles.label}>{labels.videos}</span>
                {project.videos?.map((video) => {
                  if (video.includes('instagram.com')) {
                    return <InstagramEmbed url={video} key={video}/>
                  }
                  return <ReactPlayer key={video} src={video} controls={true}/>
                })}
              </div>
          )}
      </div>
    </div>
  )
}
