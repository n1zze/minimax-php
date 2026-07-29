import { useState, useEffect, useRef } from 'react'
import { List, X } from 'lucide-react'
import styles from './TableOfContents.module.css'

/**
 * TableOfContents — боковая навигация по 13 секциям проекта.
 * Показывается слева на десктопе, скрыта на мобильных.
 * Позволяет быстро переходить к нужной секции через якоря.
 */
export function TableOfContents({ sections }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const observerRef = useRef(null)

  useEffect(() => {
    // Intersection Observer для подсветки активной секции
    const options = {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id)
        }
      })
    }, options)

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sections])

  function handleClick(e, id) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Открыть навигацию"
      >
        {isOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <List size={16} />
          <span>Содержание</span>
        </div>

        <ul className={styles.list}>
          {sections.map(({ id, title, number }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={`${styles.item} ${activeId === id ? styles.active : ''}`}
              >
                <span className={styles.number}>{String(number).padStart(2, '0')}</span>
                <span className={styles.title}>{title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}