import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { FileSpreadsheet } from 'lucide-react'
import styles from './SpecificationSection.module.css'

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price)
}

/**
 * SpecificationSection — таблица мебели/материалов + опциональный Excel.
 * 
 * Props:
 * - items: [{ id, category, name, brand, qty, price, link }]
 * - excelUrl: string — URL Excel файла для скачивания (опционально)
 * - isDesigner: boolean — показывать ли кнопку загрузки Excel
 */
export function SpecificationSection({ items = [], excelUrl = null }) {
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  return (
    <SectionWrapper id="section-10-specification" title="Спецификация" number={10}>
      {/* Excel download banner */}
      {excelUrl && (
        <a
          href={excelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.excelBanner}
        >
          <div className={styles.excelIcon}>
            <FileSpreadsheet size={24} />
          </div>
          <div className={styles.excelInfo}>
            <span className={styles.excelTitle}>Скачать спецификацию в Excel</span>
            <span className={styles.excelHint}>Полная таблица с формулами</span>
          </div>
          <span className={styles.excelArrow}>↓</span>
        </a>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Категория</th>
            <th>Наименование</th>
            <th>Бренд</th>
            <th className={styles.qty}>Кол-во</th>
            <th className={styles.price}>Цена</th>
            <th className={styles.price}>Сумма</th>
            <th>Ссылка</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td><span className={styles.categoryBadge}>{item.category}</span></td>
              <td>{item.name}</td>
              <td>{item.brand}</td>
              <td className={styles.qty}>{item.qty}</td>
              <td className={styles.price}>{formatPrice(item.price)}</td>
              <td className={styles.price}>{formatPrice(item.qty * item.price)}</td>
              <td>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    Открыть
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.total}>Итого: {formatPrice(total)}</div>
    </SectionWrapper>
  )
}
