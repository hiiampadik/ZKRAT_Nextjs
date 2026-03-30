import { FunctionComponent, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Mousewheel, Scrollbar } from 'swiper/modules'
import { Figure } from './Figure'
import styles from '../styles/ProjectGallerySwiper.module.scss'

interface ProjectGallerySwiperProps {
  gallery: any[]
}

const ProjectGallerySwiper: FunctionComponent<ProjectGallerySwiperProps> = ({ gallery }) => {
  const isDragging = useRef(false)

  return (
    <Swiper
      modules={[FreeMode, Scrollbar, Mousewheel]}
      mousewheel={{ forceToAxis: true }}
      grabCursor={true}
      freeMode={{ enabled: true, momentum: true }}
      slidesPerView="auto"
      spaceBetween={8}
      className={styles.swiper}
      onTouchMove={() => { isDragging.current = true }}
      onTouchEnd={() => { setTimeout(() => { isDragging.current = false }, 0) }}
    >
      {gallery.map((image, i) => (
        <SwiperSlide key={image._key ?? i} className={styles.slide}>
          <Figure image={image} sizes="600px" style={{ height: '300px', width: 'auto' }} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default ProjectGallerySwiper
