<?php
/**
 * Mimimax — Auth routes
 */

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../bootstrap.php';

// ─── Login (designer) ──────────────────────────────────────────────────────

function route_login(): void
{
    $input = get_json_input();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        json_error(400, 'Email и пароль обязательны');
    }

    rate_limit("login:$email", 5, 15 * 60);

    $db = get_db();
    $stmt = $db->prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        app_log('WARN', "Failed login attempt for $email from {$_SERVER['REMOTE_ADDR']}");
        json_error(401, 'Неверный email или пароль');
    }

    app_log('INFO', "Login success: $email ({$user['role']})");

    $payload = [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
    ];

    json_response(200, [
        'token' => jwt_encode($payload),
        'user' => $payload,
    ]);
}

// ─── Unlock (client) ───────────────────────────────────────────────────────

function route_unlock(string $projectId): void
{
    $input = get_json_input();
    $password = $input['password'] ?? '';

    if (!$password) {
        json_error(400, 'Пароль обязателен');
    }

    rate_limit("unlock:$projectId", 5, 15 * 60);

    $db = get_db();
    $stmt = $db->prepare('SELECT id, title, password_hash FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        json_error(404, 'Проект не найден');
    }

    if (!$project['password_hash'] || !password_verify($password, $project['password_hash'])) {
        json_error(401, 'Неверный пароль');
    }

    $user = [
        'id' => "client-$projectId",
        'role' => ROLE_CLIENT,
        'projectId' => $projectId,
        'name' => $project['title'] ?: 'Клиент',
    ];

    json_response(200, [
        'token' => jwt_encode($user),
        'user' => $user,
        'projectTitle' => $project['title'],
    ]);
}

// ─── Visualizer auth ───────────────────────────────────────────────────────

function route_visualizer_auth(string $projectId): void
{
    $input = get_json_input();
    $token = $input['token'] ?? '';

    if (!$token) {
        json_error(400, 'Токен обязателен');
    }

    $db = get_db();
    $stmt = $db->prepare('SELECT title, visualizer_token FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        json_error(404, 'Проект не найден');
    }

    if (!$project['visualizer_token']) {
        json_error(403, 'Визуализаторский доступ не настроен');
    }

    $storedToken = $project['visualizer_token'];
    $isValid = str_starts_with($storedToken, '$2')
        ? password_verify($token, $storedToken)
        : hash_equals($storedToken, $token);

    if (!$isValid) {
        json_error(401, 'Неверный токен');
    }

    $user = [
        'id' => "visualizer-$projectId",
        'role' => ROLE_VISUALIZER,
        'projectId' => $projectId,
        'visualizerProjectId' => $projectId,
        'name' => $project['title'] ?: 'Визуализатор',
    ];

    json_response(200, [
        'token' => jwt_encode($user),
        'user' => $user,
        'projectTitle' => $project['title'],
    ]);
}

// ─── Me (current user) ────────────────────────────────────────────────────

function route_me(): void
{
    $user = require_auth();

    // For client/visualizer, get project title
    if (in_array($user['role'] ?? '', [ROLE_CLIENT, ROLE_VISUALIZER], true)) {
        $projectId = $user['projectId'] ?? $user['visualizerProjectId'] ?? '';
        if ($projectId) {
            $db = get_db();
            $stmt = $db->prepare('SELECT title FROM projects WHERE id = ?');
            $stmt->execute([$projectId]);
            $title = $stmt->fetchColumn();
            if ($title) {
                $user['name'] = $title;
            }
        }
    }

    $response = ['user' => $user];
    if ($user['role'] !== ROLE_DESIGNER) {
        $response['user']['projectId'] = $user['projectId'] ?? $user['visualizerProjectId'] ?? '';
    }

    json_response(200, $response);
}
