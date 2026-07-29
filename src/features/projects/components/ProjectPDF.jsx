import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #1a1a1a',
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  meta: {
    fontSize: 11,
    color: '#6b6b6b',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  sectionNum: {
    fontSize: 9,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  divider: {
    borderBottom: '1px solid #e5e5e5',
    marginVertical: 12,
  },
  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineDate: {
    width: 80,
    fontSize: 9,
    color: '#6b6b6b',
    paddingTop: 2,
  },
  timelineTitle: {
    flex: 1,
    fontSize: 10,
  },
  timelineDone: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 9,
    width: 50,
    textAlign: 'right',
  },
  // Spec table
  specTable: {
    marginTop: 8,
  },
  specHeader: {
    flexDirection: 'row',
    borderBottom: '2px solid #1a1a1a',
    paddingBottom: 4,
    marginBottom: 4,
  },
  specHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#6b6b6b',
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottom: '0.5px solid #e5e5e5',
  },
  specCell: {
    fontSize: 9,
  },
  // Diary
  diaryRow: {
    marginBottom: 8,
  },
  diaryDate: {
    fontSize: 9,
    color: '#6b6b6b',
  },
  diaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  diaryDesc: {
    fontSize: 9,
    color: '#6b6b6b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#999',
    borderTop: '0.5px solid #e5e5e5',
    paddingTop: 8,
  },
  image: {
    marginTop: 8,
    marginBottom: 8,
    maxWidth: 200,
    maxHeight: 150,
    objectFit: 'contain',
  },
})

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price)
}

const COL_WIDTHS = { cat: 70, name: 130, brand: 80, qty: 40, price: 70, sum: 70 }

export function ProjectPDFDocument({ project, sections }) {
  const s = project.sections || project.data || {}
  const enabledSections = sections || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.meta}>
            Клиент: {project.client || project.client_name} · Статус: {project.status} · {new Date().toLocaleDateString('ru-RU')}
          </Text>
        </View>

        {/* Timeline */}
        {enabledSections.includes('timeline') && s.timeline?.steps && (
          <View>
            <Text style={styles.sectionNum}>01</Text>
            <Text style={styles.sectionTitle}>Ход работ</Text>
            {s.timeline.steps.map((step) => (
              <View key={step.id} style={styles.timelineRow}>
                <Text style={styles.timelineDate}>{step.date}</Text>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDone}>{step.completed ? '✓' : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contract */}
        {enabledSections.includes('contract') && s.contract && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>02</Text>
            <Text style={styles.sectionTitle}>Договор</Text>
            <Text>{s.contract.title}</Text>
            {s.contract.pdfUrl && <Text style={{ fontSize: 9, color: '#6b6b6b' }}>PDF: {s.contract.pdfUrl}</Text>}
          </View>
        )}

        {/* Floor Plan */}
        {enabledSections.includes('floorPlan') && s.floorPlan && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>03</Text>
            <Text style={styles.sectionTitle}>Планировка</Text>
            <Text>Изображений: {s.floorPlan.images?.length || 0}</Text>
            {s.floorPlan.images?.slice(0, 5).map((img, idx) => (
              img?.url ? <Image key={idx} src={img.url} style={styles.image} /> : null
            ))}
            {s.floorPlan.videoUrl && <Text style={{ fontSize: 9, color: '#6b6b6b' }}>Видео: {s.floorPlan.videoUrl}</Text>}
          </View>
        )}

        {/* Collages */}
        {enabledSections.includes('collages') && s.collages && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>05</Text>
            <Text style={styles.sectionTitle}>Коллажи</Text>
            <Text>Коллажей: {s.collages.items?.length || 0}</Text>
            {s.collages.items?.slice(0, 5).map((item) => (
              item?.url ? <Image key={item.id} src={item.url} style={styles.image} /> : <Text key={item.id} style={{ fontSize: 9, color: '#6b6b6b' }}>• {item.alt}</Text>
            ))}
          </View>
        )}

        {/* Visualizations */}
        {enabledSections.includes('visualizations') && s.visualizations && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>07</Text>
            <Text style={styles.sectionTitle}>Визуализации</Text>
            {s.visualizations.tabs?.map((tab) => (
              <View key={tab.id} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: 'bold' }}>{tab.title}</Text>
                <Text style={{ fontSize: 9, color: '#6b6b6b' }}>Изображений: {tab.images?.length || 0}</Text>
                {tab.images?.slice(0, 3).map((img, idx) => (
                  img?.url ? <Image key={idx} src={img.url} style={styles.image} /> : null
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Drawings */}
        {enabledSections.includes('drawings') && s.drawings && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>08</Text>
            <Text style={styles.sectionTitle}>Чертежи</Text>
            <Text>Чертежей: {s.drawings.items?.length || 0}</Text>
            {s.drawings.items?.slice(0, 5).map((item, idx) => (
              item?.url ? <Image key={idx} src={item.url} style={styles.image} /> : null
            ))}
          </View>
        )}

        {/* Specification */}
        {enabledSections.includes('specification') && s.specification?.items && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>10</Text>
            <Text style={styles.sectionTitle}>Спецификация</Text>
            <View style={styles.specTable}>
              <View style={styles.specHeader}>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.cat }]}>Категория</Text>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.name }]}>Наименование</Text>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.brand }]}>Бренд</Text>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.qty, textAlign: 'right' }]}>Кол-во</Text>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.price, textAlign: 'right' }]}>Цена</Text>
                <Text style={[styles.specHeaderCell, { width: COL_WIDTHS.sum, textAlign: 'right' }]}>Сумма</Text>
              </View>
              {s.specification.items.map((item) => (
                <View key={item.id} style={styles.specRow}>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.cat }]}>{item.category}</Text>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.name }]}>{item.name}</Text>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.brand }]}>{item.brand}</Text>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.qty, textAlign: 'right' }]}>{item.qty}</Text>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.price, textAlign: 'right' }]}>{formatPrice(item.price)}</Text>
                  <Text style={[styles.specCell, { width: COL_WIDTHS.sum, textAlign: 'right' }]}>{formatPrice(item.qty * item.price)}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Text style={{ flex: 1 }} />
                <Text style={{ fontWeight: 700, fontSize: 11, width: COL_WIDTHS.sum, textAlign: 'right' }}>
                  {formatPrice(s.specification.items.reduce((sum, i) => sum + i.qty * i.price, 0))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Final Project */}
        {enabledSections.includes('finalProject') && s.finalProject && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.sectionNum}>12</Text>
            <Text style={styles.sectionTitle}>Итоговый проект</Text>
            <Text>Рендеров: {s.finalProject.items?.length || 0}</Text>
            {s.finalProject.items?.slice(0, 5).map((item, idx) => (
              item?.url ? <Image key={idx} src={item.url} style={styles.image} /> : null
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Mimimax — Дизайн-проект</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
