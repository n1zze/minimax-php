<?php
/**
 * Mimimax — API Router
 *
 * КАК ДОБАВИТЬ НОВЫЙ МАРШРУТ:
 * 1. Создай функцию в нужном файле api/routes/*.php
 * 2. Добавь строку в массив $routes ниже
 *
 * Формат: 'METHOD /путь' => 'имя_функции'
 * Для параметров используй {id}, {projectId} и т.д.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

set_exception_handler(function (Throwable $e) {
    app_log('ERROR', 'Uncaught: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    json_error(500, 'Внутренняя ошибка сервера');
});

set_error_handler(function (int $severity, string $message, string $file, int $line) {
    app_log('ERROR', "PHP $severity: $message in $file:$line");
    if ($severity & (E_ERROR | E_PARSE | E_CORE_ERROR)) {
        json_error(500, 'Внутренняя ошибка сервера');
    }
});

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/projects.php';
require_once __DIR__ . '/routes/files.php';
require_once __DIR__ . '/routes/notifications.php';

cors_headers();
security_headers();

// ─── Маршруты ──────────────────────────────────────────────────────────────
//
// Чтобы добавить новый маршрут — просто допиши строку в этот массив.
// Формат: 'HTTP_МЕТОД /путь' => 'имя_функции'
// Параметры: {id} — любой сегмент URL без слеша
//
$routes = [
    // Здоровье
    'GET  /health'                              => 'route_health',

    // Авторизация
    'POST /auth/login'                          => 'route_login',
    'POST /auth/unlock/{projectId}'             => 'route_unlock',
    'POST /auth/visualizer/{projectId}'         => 'route_visualizer_auth',
    'GET  /auth/me'                             => 'route_me',

    // Проекты
    'GET  /projects'                            => 'route_list_projects',
    'POST /projects'                            => 'route_create_project',
    'GET  /projects/{id}/access'                => 'route_get_project_access_info',
    'GET  /projects/{id}'                       => 'route_get_project',
    'PUT  /projects/{id}'                       => 'route_update_project',
    'DELETE /projects/{id}'                     => 'route_delete_project',

    // Файлы
    'GET  /projects/{projectId}/files'          => 'route_list_files',
    'POST /projects/{projectId}/files'          => 'route_upload_file',
    'GET  /files/{name}'                        => 'route_serve_file',
    'DELETE /projects/{projectId}/files/{fileId}' => 'route_delete_file',

    // Уведомления
    'GET  /notifications'                       => 'route_list_notifications',
    'GET  /notifications/unread-count'          => 'route_unread_count',
    'POST /notifications/{id}/read'             => 'route_mark_read',
    'POST /notifications/read-all'              => 'route_mark_all_read',
    'POST /projects/{projectId}/notifications'  => 'route_create_for_client',
    'POST /projects/{projectId}/notifications/email' => 'route_send_email_notification',
];

// ─── Обработка запроса ──────────────────────────────────────────────────────

$method = get_method();
$path = get_request_path();

foreach ($routes as $pattern => $handler) {
    // Разбираем 'METHOD /path' → $routeMethod и $routePath
    $parts = preg_split('/\s+/', trim($pattern), 2);
    $routeMethod = $parts[0];
    $routePath = $parts[1] ?? '';

    // Метод не совпадает — пропускаем
    if ($routeMethod !== $method) continue;

    // Собираем regex из шаблона: /projects/{id} → #^/projects/([^/]+)$#
    $regex = preg_replace('#\{[^}]+\}#', '([^/]+)', $routePath);
    $regex = '#^' . $regex . '$#';

    // Проверяем совпадение
    if (preg_match($regex, $path, $matches)) {
        // $matches[1], $matches[2]... — параметры из URL
        $params = array_slice($matches, 1);
        call_user_func_array($handler, $params);
        // call_user_func_array вызовет exit через json_response
    }
}

// Ни один маршрут не совпал
json_error(404, 'Endpoint not found');

// ─── Health check ──────────────────────────────────────────────────────────
function route_health(): void
{
    json_response(200, [
        'status' => 'ok',
        'timestamp' => time(),
        'version' => '1.0.0',
    ]);
}
