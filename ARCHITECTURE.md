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
│  localhost:5173 (dev) / shared хостинг (prod)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (JSON + FormData)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      СЕРВЕР (PHP)                             │
│                                                             │
│  PHP 8.1+ (PDO, JSON, fileinfo)                            │
│  ├── JWT авторизация (ручная реализация)                    │
│  ├── password_hash / password_verify (bcrypt)               │
│  ├── PDO SQLite (БД)                                       │
│  ├── Rate limiting (файловый)                              │
│  └── CORS / Security headers                               │
│                                                             │
│  Apache + mod_rewrite (.htaccess)                           │
│  или php -S localhost:8080 router.php (dev)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ХРАНЕНИЕ ДАННЫХ                            │
│                                                             │
│  data/mimimax.db    — SQLite файл (проекты, пользователи)  │
│  uploads/           — загруженные файлы (PNG, JPG, PDF)     │
│  data/app.log       — логи приложения                       │
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
| **PHP 8.1+** | Серверный язык | [php.net](https://www.php.net/manual/ru/) |
| **PDO + SQLite** | База данных | [php.net/pdo](https://www.php.net/manual/ru/book.pdo.php) |
| **JWT** | Авторизация по токенам | [jwt.io](https://jwt.io) |
| **password_hash** | Хеширование паролей (bcrypt) | [php.net/password_hash](https://www.php.net/manual/ru/function.password-hash.php) |
| **Apache .htaccess** | Rewrite rules, security headers | [httpd.apache.org](https://httpd.apache.org/docs/current/howto/htaccess.html) |

### DevOps (что знать для деплоя)

| Технология | Для чего | Где изучать |
|---|---|---|
| **Shared хостинг** | Любой хостинг с PHP 8.1+ | — |
| **FTP / File Manager** | Загрузка файлов на сервер | — |
| **Let's Encrypt** | Бесплатные SSL-сертификаты | [certbot.eff.org](https://certbot.eff.org) |

---

## Структура файлов

```
mimimax/
├── api/                          ← BACKEND (PHP)
│   ├── index.php                 ← API роутер (все маршруты)
│   ├── auth.php                  ← JWT middleware, проверка ролей
│   ├── jwt.php                   ← Генерация/верификация JWT
│   ├── helpers.php               ← Утилиты: логирование, JSON, CORS, БД
│   ├── seed.php                  ← Начальные данные (первый запуск)
│   └── routes/
│       ├── auth.php              ← Логин, unlock, visualizer auth
│       ├── projects.php          ← CRUD проектов
│       ├── files.php             ← Загрузка/раздача файлов
│       └── notifications.php     ← Уведомления
│
├── admin/                        ← АДМИН-ПАНЕЛЬ (PHP)
│   ├── index.php                 ← Список проектов, управление
│   └── backup.php                ← Скачивание бэкапа БД
│
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
├── config.example.php            ← Шаблон конфигурации
├── config.php                    ← ВАША конфигурация (не в git)
├── router.php                    ← Роутер для PHP dev-сервера
├── .htaccess                     ← Apache rewrite rules
├── index.html                    ← Точка входа SPA
├── vite.config.js                ← Конфигурация Vite
└── package.json                  ← Зависимости frontend
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
   b) Сервер → проверяет mime type → сохраняет в /uploads/
   c) Сервер возвращает { url: '/api/files/uuid.jpg' }
   d) Frontend добавляет ?t=TOKEN к URL (для отображения в <img>)
   e) Сохраняет base64 в IndexedDB (офлайн-фолбэк)
   f) Обновляет local state → отображается в SortableImageGrid
5. При нажатии "Сохранить":
   a) cleanupProjectForSave удаляет blob: URL и токены из данных
   b) API PUT /api/projects/:id отправляет sections на сервер
   c) Сервер сохраняет sections как JSON в поле data таблицы projects
```

### Клиент открывает проект

```
1. Клиент переходит по ссылке /projects/:id/unlock
2. Вводит пароль → POST /api/auth/unlock/:id
3. Сервер проверяет password_verify → выдаёт JWT с ролью 'client'
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
7. Сервер сохраняет images с uploadedBy: 'visualizer'
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

Роль определяется JWT-токеном. Проверяется на сервере (функции `require_auth()`, `require_designer()`, `require_project_access()`) и на клиенте (`ProtectedRoute`, `permissions.js`).

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

В `api/routes/projects.php` — обработка поля при сохранении.

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

В `api/auth.php` — добавить константу `ROLE_NEWROLE = 'newrole'`.

Создать endpoint авторизации в `api/routes/auth.php`.

### 2. Frontend

В `src/store/useAuthStore.js` — добавить `ROLE_NEWROLE` и `loginAsNewRole`.

В `src/components/auth/ProtectedRoute.jsx` — добавить логику доступа.

### 3. Permissions

В `src/lib/permissions.js` — добавить проверки для новой роли.

---

## Полезные команды для разработки

```bash
# Установка зависимостей фронтенда
npm install

# Запуск frontend (dev)
npm run dev

# Запуск backend (dev)
php -S localhost:8080 router.php

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
| Добавить поле в проект | `api/routes/projects.php`, `ProjectEditPage.jsx` |
| Изменить цвета/шрифты | `src/index.css` |
| Добавить страницу | `src/app/App.jsx` (роут), создать компонент в `features/` |
| Изменить права доступа | `api/auth.php`, `src/lib/permissions.js` |
| Добавить API-endpoint | `api/routes/`, `api/index.php`, `src/api/index.js` |
| Изменить структуру БД | `api/helpers.php` (миграция), `api/routes/projects.php` |
| Добавить уведомление | `api/routes/notifications.php` |
| Стили компонента | `*.module.css` рядом с компонентом |

---

## Ключевые паттерны в коде

### 1. Нормализация данных (сервер → фронт)

Сервер хранит плоский JSON (`data.floorPlan`, `data.contractPdf`).
Фронт работает с нормализованной структурой (`sections.floorPlan`, `sections.contract`).
Преобразование: `normalizeProject()` в `useProjectStore.js`.

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

## Деплой на shared хостинг

1. Выполните `npm run build` локально
2. Скопируйте содержимое `dist/` в корень проекта
3. Загрузите все файлы на хостинг через FTP
4. Скопируйте `config.example.php` → `config.php` и отредактируйте
5. Настройте права: `data/` → 755, `uploads/` → 755
6. Убедитесь что mod_rewrite включён в Apache

Подробности в README.md.

---

*Последнее обновление: Июль 2026*
