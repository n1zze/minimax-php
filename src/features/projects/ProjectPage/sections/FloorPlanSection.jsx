import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { MediaGallery } from '../../components/MediaGallery'
import styles from './FloorPlanSection.module.css'

/**
 * Convert various video URLs to embed URLs for YouTube, Rutube, VKvideo.
 * Returns { embedUrl, platform } or null if not recognized.
 */
function parseVideoUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)

    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let videoId = null
      if (u.searchParams.get('v')) {
        videoId = u.searchParams.get('v')
      } else {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        if (ytMatch) videoId = ytMatch[1]
      }
      if (videoId) return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' }
    }

    // Rutube
    if (u.hostname.includes('rutube.ru')) {
      const match = url.match(/\/video\/([a-zA-Z0-9]+)/) || url.match(/\/play\/embed\/([a-zA-Z0-9]+)/)
      const videoId = match ? match[1] : null
      if (videoId) return { embedUrl: `https://rutube.ru/play/embed/${videoId}`, platform: 'rutube' }
      // fallback: pass original URL for embed page
      return { embedUrl: url, platform: 'rutube' }
    }

    // VKvideo
    if (u.hostname.includes('vk.com') || u.hostname.includes('vk.ru')) {
      const match = url.match(/\/video(-?\d+_\d+)/)
      if (match) {
        return { embedUrl: `https://vk.com/video_ext.php?${u.searchParams}`, platform: 'vk' }
      }
      return { embedUrl: url, platform: 'vk' }
    }

    return null
  } catch {
    return null
  }
}

export function FloorPlanSection({ images = [], videoUrl, videoTitle, number }) {
  const video = parseVideoUrl(videoUrl)

  return (
    <SectionWrapper id="section-03-floorplan" title="Планировка" number={number || 3}>
      <MediaGallery images={images} columns={2} />
      {videoUrl && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          {videoTitle && <p className={styles.videoTitle}>{videoTitle}</p>}
          {video ? (
            <iframe
              src={video.embedUrl}
              className={styles.video}
              allowFullScreen
              frameBorder="0"
              title={videoTitle || `Видео (${video.platform})`}
            />
          ) : (
            <div
              className={styles.videoPlaceholder}
              onClick={() => window.open(videoUrl, '_blank')}
              title="Открыть видео"
            >
              ▶ {videoTitle || 'Видеозапись 3D-обзора'}
            </div>
          )}
        </div>
      )}
    </SectionWrapper>
  )
}
