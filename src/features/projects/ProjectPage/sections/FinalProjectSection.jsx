import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { PdfBanner } from './PdfBanner'
import { Lightbox } from '../../../../components/ui/Lightbox'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import styles from './FinalProjectSection.module.css'

export function FinalProjectSection({ items = [], pdfUrl, pdfTitle }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const isLightboxOpen = lightboxIndex >= 0

  return (
    <SectionWrapper id="section-12-final" title="Итоговый проект" number={12}>
      {pdfUrl && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <PdfBanner pdfUrl={pdfUrl} title={pdfTitle || 'Альбом в PDF'} sectionTitle="Альбом в PDF" number={null} />
        </div>
      )}
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={16}
        slidesPerView={1.2}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className={styles.swiper}
      >
        {items.map((item, index) => (
          <SwiperSlide key={item.id}>
            <div className={styles.slide} onClick={() => setLightboxIndex(index)}>
              <img src={item.src} alt={item.alt} className={styles.image} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {isLightboxOpen && (
        <Lightbox
          images={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(items.length - 1, i + 1))}
        />
      )}
    </SectionWrapper>
  )
}
