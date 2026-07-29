# Локальная разработка

Пошаговая инструкция для запуска проекта на своём компьютере.

---

## Что нужно установить

| Программа | Зачем | Как проверить |
|-----------|-------|---------------|
| **Node.js 18+** | Сборка фронтенда | `node --version` |
| **PHP 8.1+** | Бэкенд | `php --version` |
| **Git** | Версионирование | `git --version` |

### Установка на Windows

1. **Node.js** — скачай с https://nodejs.org (LTS-версия)
2. **PHP** — скачай с https://windows.php.net/download/ (VS16 x64 Thread Safe), распакуй в `C:\php`, добавь `C:\php` в PATH
3. **Git** — скачай с https://git-scm.com

---

## Шаг 1: Клонировать репозиторий

```bash
git clone https://github.com/n1zze/minimax-php.git
cd minimax-php
```

---

## Шаг 2: Установить зависимости фронтенда

```bash
npm install
```

Появится папка `node_modules/`. Это нормально.

---

## Шаг 3: Проверить конфигурацию

Файл `config.php` уже настроен для локальной разработки с дефолтными значениями:

```php
JWT_SECRET     = 'dev-secret-key-for-local-testing-32c'
ADMIN_EMAIL    = 'admin@test.local'
ADMIN_PASSWORD = 'admin123456'
CORS_ORIGIN    = 'http://localhost:5173'
```

Ничего менять не нужно для локальной разработки.

---

## Шаг 4: Запустить серверы

Нужно запустить **два** сервера одновременно — в двух разных терминалах.

### Терминал 1: PHP-бэкенд

```bash
php -S localhost:8080 router.php
```

Увидишь: `PHP Development Server started`

### Терминал 2: Vite-фронтенд

```bash
npm run dev
```

Увидишь: `Local: http://localhost:5173`

---

## Шаг 5: Открыть в браузере

| Что открыть | URL |
|-------------|-----|
| Сайт (фронтенд) | http://localhost:5173 |
| Админ-панель | http://localhost:8080/admin/ |
| API | http://localhost:8080/api/ |

---

## Вход в систему

### Дизайнер (полный доступ)

- **Email:** `admin@test.local`
- **Пароль:** `admin123456`
- **Вход через:** http://localhost:5173/login

### Клиент

1. Залогинься как дизайнер
2. Создай проект
3. В настройках проекта задай пароль клиента
4. Открой `/projects/{id}/unlock` и введи пароль

### Визуализатор

1. Залогинься как дизайнер
2. В настройках проекта сгенерируй токен визуализатора
3. Открой `/visualizer/{id}/unlock` и введи токен

---

## Полезные команды

```bash
npm run dev          # Запуск фронтенда (hot-reload)
npm run build        # Сборка production-версии в dist/
npm run preview      # Просмотр собранной версии
npm test             # Запуск тестов
npm run lint         # Проверка кода линтером
```

---

## Структура проекта (коротко)

```
minimax-php/
├── src/                  ← React-фронтенд (исходники)
│   ├── features/         ← Страницы (HomePage, ProjectPage...)
│   ├── components/       ← UI-компоненты (Header, Footer...)
│   ├── store/            ← Zustand-стейт
│   └── api/              ← HTTP-клиент
├── api/                  ← PHP-бэкенд
│   ├── routes/           ← API-эндпоинты
│   ├── auth.php          ← Авторизация
│   └── bootstrap.php     ← Инициализация БД
├── admin/                ← Админ-панель (PHP)
├── config.php            ← Конфигурация
├── router.php            ← PHP роутер
└── vite.config.js        ← Настройки сборки
```

---

## Частые проблемы

### "PHP is not recognized"
PHP не в PATH. Добавь папку с PHP в переменную PATH или используй полный путь:
```bash
C:\php\php.exe -S localhost:8080 router.php
```

### "Port 8080 already in use"
Кто-то уже занял порт. Используй другой:
```bash
php -S localhost:8081 router.php
```
И обнови `vite.config.js` — прокси на новый порт.

### Белый экран
Проверь консоль браузера (F12). Обычно это ошибка API. Убедись что PHP-сервер запущен.

### "Database is locked"
Закрой все терминалы с PHP, удали `data/mimimax.db-wal` и `data/mimimax.db-shm`, запусти заново.
