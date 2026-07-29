# Архитектура проекта Mimimax

Это руководство поможет разобраться в технологиях и структуре проекта для самостоятельного сопровождения.

---

## Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР                               │
│                                                             │
│  React 19 + Vite 8 (SPA)                                   │
│  ├── Zustand (стейт)                                       │
│  ├── React Router 7 (маршруты)                             │
│  ├── IndexedDB через idb (офлайн-кеш)                     │
│  └── CSS Modules (стили)                                    │
│                                                             │
│  localhost:5173 (dev) / через Nginx (prod)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (JSON + FormData)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      СЕРВЕР (Express)                         │
│                                                             │
│  Node.js 20 + Express 4                                     │
│  ├── JWT авторизация (jsonwebtoken)                         │
│  ├── bcryptjs (хеширование паролей)                         │
│  ├── multer (загрузка файлов)                              │
│  ├── helmet (security headers)                              │
│  ├── express-rate-limit (защита от DDoS)                   │
│  └── SQLite через sql.js (БД в памяти + файл)             │
│                                                             │
│  localhost:3001                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ХРАНЕНИЕ ДАННЫХ                            │
│                                                             │
│  data/mimimax.db    — SQLite файл (проекты, пользователи)  │
│  data/uploads/      — загруженные файлы (PNG, JPG, PDF)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Технологии — что изучать

### Frontend (что учить в первую очередь)

| Технология | Для чего | Где изучать |
|---|---|---|
| **React 19** | UI-компоненты, рендеринг | [react.dev](https://react.dev) |
| **Zustand** | Глобальный стейт (аналог Redux, но проще) | [zustand docs](https://zustand-demo.pmnd.rs/) |
| **React Router 7** | Навигация между страницами | [reactrouter.com](https://reactrouter.com) |
| **CSS Modules** | Стили с локальной областью видимости | [css-modules](https://github.com/css-modules/css-modules) |
| **Vite** | Сборщик и dev-сервер | [vite.dev](https://vite.dev) |
| **Lucide React** | Иконки | [lucide.dev](https://lucide.dev) |

### Backend (что учить во вторую очередь)

| Технология | Для чего | Где изучать |
|---|---|---|
| **Express.js** | HTTP-сервер, роутинг, middleware | [expressjs.com](https://expressjs.com) |
| **JWT (jsonwebtoken)** | Авторизация по токенам | [jwt.io](https://jwt.io) |
| **sql.js** | SQLite в Node.js (без нативных модулей) | [sql-js docs](https://sql.js.org/) |
| **multer** | Обработка загрузки файлов | [multer docs](https://github.com/expressjs/multer) |
| **helmet** | Безопасность HTTP-заголовков | [helmetjs.github.io](https://helmetjs.github.io) |
| **bcryptjs** | Хеширование паролей | [bcryptjs npm](https://www.npmjs.com/package/bcryptjs) |

### DevOps (что знать для деплоя)

| Технология | Для чего | Где изучать |
|---|---|---|
| **Docker** | Контейнеризация приложения | [docs.docker.com](https://docs.docker.com/get-started/) |
| **Nginx** | Reverse proxy, SSL, раздача статики | [nginx.org](https://nginx.org/ru/docs/) |
| **Let's Encrypt** | Бесплатные SSL-сертификаты | [certbot.eff.org](https://certbot.eff.org) |
| **Linux (Ubuntu)** | Серверная ОС | [ubuntu.com/tutorials](https://ubuntu.com/tutorials) |

---

## Структура файлов

```
mimimax/
├── src/                          ← FRONTEND (React)
│   ├── app/
│   │   └── App.jsx              ← Главный компонент, роутинг
│   │
│   ├── api/
│   │   └── index.js             ← HTTP-клиент (все запросы к серверу)
│   │
│   ├── store/                   ← Глобальный стейт (Zustand)
│   │   ├── useAuthStore.js      ← Авторизация (login/logout/роли)
│   │   ├── useProjectStore.js   ← Проекты (CRUD, загрузка, сохранение)
│   │   ├── useThemeStore.js     ← Тёмная/светлая тема
│   │   ├── useNotificationsStore.js ← Уведомления
│   │   └── useOnboardingStore.js    ← Онбординг (первый вход)
│   │
│   ├── features/                ← Страницы и бизнес-логика
│   │   ├── auth/
│   │   │   └── LoginPage.jsx    ← Страница входа дизайнера
│   │   └── projects/
│   │       ├── HomePage.jsx     ← Список проектов
│   │       ├── DashboardPage.jsx ← Панель управления
│   │       ├── ProjectEditPage.jsx ← Редактирование проекта
│   │       ├── ProjectCard.jsx  ← Карточка проекта в списке
│   │       ├── UnlockPage.jsx   ← Разблокировка для клиента
│   │       ├── ProjectPage/
│   │       │   ├── ProjectPage.jsx      ← Просмотр проекта
│   │       │   ├── VisualizerPage.jsx   ← Страница визуализатора
│   │       │   └── sections/            ← Секции проекта
│   │       │       ├── TimelineSection.jsx
│   │       │       ├── FloorPlanSection.jsx
│   │       │       ├── VisualizationsSection.jsx
│   │       │       ├── DrawingsSection.jsx
│   │       │       ├── SpecificationSection.jsx
│   │       │       ├── PdfBanner.jsx
│   │       │       └── ...
│   │       └── components/      ← Компоненты редактора
│   │           ├── SortableImageGrid.jsx  ← DnD сетка изображений
│   │           ├── VisualizationUploader.jsx ← Загрузка для визуализатора
│   │           ├── PdfUploadField.jsx     ← Загрузка PDF
│   │           ├── UploadArea.jsx         ← Общая зона загрузки
│   │           ├── VisEditor.jsx          ← Редактор визуализаций
│   │           ├── TimelineEditor.jsx     ← Редактор таймлайна
│   │           ├── SpecEditor.jsx         ← Редактор спецификации
│   │           └── ClientAccessPanel.jsx  ← Настройка доступа клиента
│   │
│   ├── components/              ← Общие UI-компоненты
│   │   ├── layout/
│   │   │   ├── Header.jsx       ← Шапка с навигацией
│   │   │   ├── Footer.jsx       ← Подвал
│   │   │   └── Layout.jsx       ← Обёртка страниц
│   │   ├── ui/
│   │   │   ├── ThemeToggle.jsx       ← Переключатель темы
│   │   │   ├── NotificationsBell.jsx ← Колокольчик уведомлений
│   │   │   ├── Onboarding.jsx       ← Тур для новых пользователей
│   │   │   ├── Lightbox.jsx         ← Просмотр изображений
│   │   │   ├── ProgressBar.jsx      ← Прогресс-бар
│   │   │   └── UploadQueue.jsx      ← Очередь загрузки файлов
│   │   └── auth/
│   │       └── ProtectedRoute.jsx   ← Защита маршрутов по роли
│   │
│   ├── hooks/                   ← Кастомные хуки
│   │   ├── useUploadQueue.js    ← Логика очереди загрузки файлов
│   │   ├── calcProgress.js      ← Подсчёт прогресса проекта
│   │   └── useFileUpload.js     ← Базовый хук загрузки
│   │
│   ├── db/
│   │   └── index.js             ← IndexedDB для офлайн-кеша
│   │
│   ├── lib/
│   │   └── permissions.js       ← Проверки прав по ролям
│   │
│   └── index.css                ← Глобальные стили + CSS-переменные + темы
│
├── server/                      ← BACKEND (Express)
│   ├── index.js                 ← Точка входа, настройка Express
│   ├── auth.js                  ← JWT: генерация, верификация, middleware
│   ├── db.js                    ← SQLite: инициализация, миграции, сохранение
│   ├── seed.js                  ← Начальные данные (первый запуск)
│   └── routes/
│       ├── auth.js              ← Логин, unlock, visualizer auth
│       ├── projects.js          ← CRUD проектов
│       ├── files.js             ← Загрузка/раздача файлов
│       └── notifications.js     ← Уведомления
│
├── Dockerfile                   ← Сборка Docker-образа
├── docker-compose.yml           ← Запуск в Docker
├── nginx.conf                   ← Конфиг Nginx для production
├── .env.example                 ← Шаблон переменных окружения
├── .dockerignore                ← Исключения для Docker
├── vite.config.js               ← Конфигурация Vite
└── package.json                 ← Зависимости frontend
```

---

## Как данные ходят (Data Flow)

### Дизайнер загружает изображение

```
1. Дизайнер выбирает файл в UploadArea
2. useUploadQueue сжимает файл (если изображение)
3. UploadArea вызывает handleImageUpload в ProjectEditPage
4. handleImageUpload:
   a) Загружает файл на сервер: POST /api/projects/:id/files (FormData)
   b) Сервер → multer парсит файл → проверяет magic bytes → сохраняет в /uploads/
   c) Сервер возвращает { url: '/api/files/uuid.jpg' }
   d) Frontend добавляет ?t=TOKEN к URL (для отображения в <img>)
   e) Сохраняет base64 в IndexedDB (офлайн-фолбэк)
   f) Обновляет local state → отображается в SortableImageGrid
5. При нажатии "Сохранить":
   a) cleanupProjectForSave удаляет blob: URL и токены из данных
   b) API PUT /api/projects/:id отправляет sections на сервер
   c) Сервер вызывает sectionsToFlatData → сохраняет в SQLite JSON blob
```

### Клиент открывает проект

```
1. Клиент переходит по ссылке /projects/:id/unlock
2. Вводит пароль → POST /api/auth/unlock/:id
3. Сервер проверяет bcrypt hash → выдаёт JWT с ролью 'client'
4. Фронт сохраняет токен в localStorage
5. Редирект на /projects/:id
6. ProtectedRoute проверяет роль
7. ProjectPage вызывает loadProject(id) из стора
8. Стор: GET /api/projects/:id → normalizeProject → applyAuthTokens → setState
9. Компоненты рендерят секции из project.sections
10. <img src="/api/files/uuid.jpg?t=TOKEN"> — браузер загружает файл
11. Сервер проверяет ?t=TOKEN → отдаёт файл
```

### Визуализатор загружает рендеры

```
1. Визуализатор на /visualizer/:id
2. Выбирает комнату → перетаскивает файлы в dropzone
3. VisualizationUploader обрабатывает файлы (сжатие, превью)
4. Нажимает "Добавить" → handleImageUpload в VisualizerPage
5. POST /api/projects/:id/files (section: 'visualizations')
6. PUT /api/projects/:id (sections.visualizations) — обновляет вкладку
7. Сервер: updateProject → sectionsToFlatData → сохраняет images с uploadedBy: 'visualizer'
8. Сервер создаёт notification для клиента (auto-notify)
9. Клиент при следующем входе видит колокольчик с "1"
```

---

## Система ролей

```
┌─────────────┬────────────────────────────────────────────────────────┐
│ Роль        │ Что может делать                                       │
├─────────────┼────────────────────────────────────────────────────────┤
│ designer    │ Всё: создание/редактирование/удаление проектов,        │
│             │ загрузка файлов, управление доступом, утверждение       │
├─────────────┼────────────────────────────────────────────────────────┤
│ visualizer  │ Просмотр планировки, загрузка/удаление СВОИХ           │
│             │ визуализаций, НЕ может удалять чужие файлы             │
├─────────────┼────────────────────────────────────────────────────────┤
│ client      │ Только просмотр утверждённых материалов проекта        │
└─────────────┴────────────────────────────────────────────────────────┘
```

Роль определяется JWT-токеном. Проверяется на сервере (middleware `authMiddleware`, `designerOnly`, `requireProjectAccess`) и на клиенте (`ProtectedRoute`, `permissions.js`).

---

## База данных (SQLite)

### Таблицы

```sql
users (id, email, password_hash, role, created_at)
projects (id, title, client_name, status, password_hash, visualizer_token,
          thumbnail_path, data, created_at, updated_at)
project_files (id, project_id, section, file_name, mime_type, size, created_at)
notifications (id, project_id, recipient_role, type, title, message,
              section, read, created_at)
```

### Поле `data` в projects

Это JSON blob — хранит ВСЕ данные секций проекта:
```json
{
  "city": "Москва",
  "area": 85,
  "projectType": "full_with_supervision",
  "briefPdf": { "title": "...", "url": "/api/files/xxx.pdf" },
  "timeline": [{ "step": "Замер", "date": "2025-01-10", "status": "done" }],
  "floorPlan": { "images": [...], "videoUrl": "" },
  "visualizations": [{ "id": "...", "title": "Гостиная", "images": [...] }],
  "specification": { "items": [...] },
  ...
}
```

---

## CSS-переменные и темы

Все цвета, шрифты, отступы — через CSS-переменные в `src/index.css`:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #2d2d2d;
  /* ... */
}

:root[data-theme='dark'] {
  --color-bg: #0f1115;
  --color-text: #e8eaed;
  --color-accent: #e8eaed;
  /* ... */
}
```

Тема переключается через `data-theme` атрибут на `<html>`. Стор `useThemeStore` управляет этим + сохраняет выбор в `localStorage`.

---

## Как добавить новую секцию проекта

Пример: хочешь добавить секцию "Мебель" с изображениями.

### 1. Данные (что хранится)

В `src/store/useProjectStore.js` → `normalizeProject`:
```js
sections: {
  furniture: normImageList(d.furniture), // ← добавить
  ...
}
```

В `server/routes/projects.js` → `sectionsToFlatData`:
```js
furniture: sections.furniture?.items?.map(item => item.serverUrl || item.src || item) || [],
```

### 2. Редактор (ProjectEditPage)

В `sectionsFromFlat` добавить:
```js
furniture: existingSections.furniture || { items: [] },
```

В JSX добавить секцию с `SortableImageGrid` + `UploadArea`.

### 3. Просмотр (ProjectPage)

Создать `FurnitureSection.jsx` в `sections/` или использовать существующий шаблон (как `DrawingsSection`).

### 4. Прогресс

В `src/hooks/calcProgress.js` добавить check:
```js
sections.furniture?.items?.length > 0,
```

---

## Как добавить новую роль

### 1. Сервер

В `server/auth.js` — добавить константу `ROLE_NEWROLE = 'newrole'`.

Создать endpoint авторизации (как `unlock` или `visualizerAuth`).

### 2. Frontend

В `src/store/useAuthStore.js` — добавить `ROLE_NEWROLE` и `loginAsNewRole`.

В `src/components/auth/ProtectedRoute.jsx` — добавить логику доступа.

### 3. Permissions

В `src/lib/permissions.js` — добавить проверки для новой роли.

---

## Полезные команды для разработки

```bash
# Запуск frontend (dev)
npm run dev

# Запуск backend (dev, с авто-перезагрузкой)
cd server && npm run dev

# Сборка production
npm run build

# Линтинг
npm run lint

# Тесты
npm test
```

---

## Где что менять (частые задачи)

| Задача | Файл(ы) |
|---|---|
| Добавить поле в проект | `mockProject.js`, `ProjectEditPage.jsx`, `server/routes/projects.js` |
| Изменить цвета/шрифты | `src/index.css` |
| Добавить страницу | `src/app/App.jsx` (роут), создать компонент в `features/` |
| Изменить права доступа | `server/auth.js`, `src/lib/permissions.js` |
| Добавить API-endpoint | `server/routes/`, `server/index.js`, `src/api/index.js` |
| Изменить структуру БД | `server/db.js` (миграция), `server/routes/projects.js` |
| Добавить уведомление | `server/routes/notifications.js` |
| Стили компонента | `*.module.css` рядом с компонентом |

---

## Ключевые паттерны в коде

### 1. Нормализация данных (сервер → фронт)

Сервер хранит плоский JSON (`data.floorPlan`, `data.contractPdf`).
Фронт работает с нормализованной структурой (`sections.floorPlan`, `sections.contract`).
Преобразование: `normalizeProject()` в `useProjectStore.js`.
Обратно: `sectionsToFlatData()` в `server/routes/projects.js`.

### 2. Token в URL для файлов

`<img>` и `<a href>` не могут передать `Authorization` header.
Решение: `?t=JWT_TOKEN` в URL. Сервер принимает токен из query.
Фронт: `withAuthToken()` в `src/api/index.js`.

### 3. Offline-first через IndexedDB

Все проекты кешируются в IndexedDB (`src/db/index.js`).
При загрузке: API → если ошибка → IndexedDB.
Изображения: base64 в IndexedDB для офлайн-просмотра.

### 4. CSS Modules

Каждый компонент имеет свой `.module.css`. Классы автоматически уникальны:
```jsx
import styles from './MyComponent.module.css'
<div className={styles.wrapper}>  // → .MyComponent_wrapper_a3f2b
```

---

*Последнее обновление: Май 2026*
