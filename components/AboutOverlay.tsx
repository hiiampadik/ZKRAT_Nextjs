import { AboutContent } from '../sanity/queries'
import styles from '../styles/ProjectOverlay.module.scss'

interface AboutOverlayProps {
  about: AboutContent
  lang: 'en' | 'cs'
  onClose: () => void
}

export default function AboutOverlay({ about, lang, onClose }: AboutOverlayProps) {
  const blocks = lang === 'en' ? about.textEn : about.textCs

  return (
    <div
      className={styles.overlay}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(80px)',
      }}
    >
      <div className={styles.header}>
        <h2>
          {lang === 'en' ? 'About us' : 'O nás'}
        </h2>
        <button className={styles.close} onClick={onClose} aria-label="Close" />
      </div>
      <div className={styles.content}>
        {blocks?.map((block) => (
          <p key={block._key}>
            {block.children.map((child) => child.text).join('')}
          </p>
        ))}
      </div>
    </div>
  )
}
