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
            <div key={block._key}>
              {block.children.map((child) => child.text).join('')}
            </div>
        ))}

        {/*<div style={{borderBottom: '1px solid white', width: '100%'}}/>*/}

        {/*<div className={styles.instagram}>*/}
        {/*  <p>IG:</p>*/}
        {/*  <a href="https://www.instagram.com/sam_cyan/" target="_blank" rel="noopener noreferrer">SA</a>*/}
        {/*  <a href="https://www.instagram.com/zem.la/" target="_blank" rel="noopener noreferrer">PŽ</a>*/}
        {/*  <a href="https://www.instagram.com/gustlek/" target="_blank" rel="noopener noreferrer">MA</a>*/}
        {/*  <a href="https://www.instagram.com/bronislav_musil/" target="_blank" rel="noopener noreferrer">BM</a>*/}
        {/*  <a href="https://www.instagram.com/mar.kotaro/" target="_blank" rel="noopener noreferrer">MŘ</a>*/}
        {/*</div>*/}
      </div>
    </div>
  )
}
