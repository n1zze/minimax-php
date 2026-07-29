import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { MediaGallery } from '../../components/MediaGallery'

export function DrawingsSection({ items = [] }) {
  return (
    <SectionWrapper id="section-08-drawings" title="Чертежи" number={8}>
      <MediaGallery images={items} columns={3} />
    </SectionWrapper>
  )
}
