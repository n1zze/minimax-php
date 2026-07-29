import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const CONTACTS = {
  email: 'info@vitalina-design.ru',
  phone: '+7 (495) 123-45-67',
  address: 'Москва, ул. Большая Дмитровка, 7/5с1',
}

const SOCIAL_LINKS = [
  { label: 'Telegram', href: 'https://t.me/vitalinadesign' },
  { label: 'Instagram', href: 'https://instagram.com/vitalina_design' },
  { label: 'Pinterest', href: 'https://pinterest.com/vitalinadesign' },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand column */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoImg} aria-label="Vitalina Design" role="img" />
            </Link>
            <p className={styles.tagline}>
              Дизайн интерьеров<br />с заботой о деталях
            </p>
          </div>

          {/* Navigation column */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Навигация</h4>
            <ul className={styles.links}>
              <li><Link to="/" className={styles.link}>Проекты</Link></li>
              <li><Link to="/dashboard" className={styles.link}>Панель дизайнера</Link></li>
            </ul>
          </div>

          {/* Contact column */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Контакты</h4>
            <ul className={styles.links}>
              <li>
                <a href={`mailto:${CONTACTS.email}`} className={styles.link}>
                  {CONTACTS.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACTS.phone.replace(/\s/g, '')}`} className={styles.link}>
                  {CONTACTS.phone}
                </a>
              </li>
              <li>
                <span className={styles.text}>{CONTACTS.address}</span>
              </li>
            </ul>
          </div>

          {/* Social column */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Социальные сети</h4>
            <ul className={styles.links}>
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} VitalinaDesign. Все права защищены.
          </p>
          <p className={styles.note}>
            Дизайн-проекты создаются с вниманием к каждой детали
          </p>
        </div>
      </div>
    </footer>
  )
}