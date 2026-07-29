<?php
/**
 * Mimimax — Auth middleware
 */

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/helpers.php';

const ROLE_DESIGNER = 'designer';
const ROLE_CLIENT = 'client';
const ROLE_VISUALIZER = 'visualizer';

/**
 * Extract and verify JWT from request.
 * Returns payload array or null.
 */
function authenticate(): ?array
{
    $token = null;

    // Try Authorization header first
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($auth, 'Bearer ')) {
        $token = substr($auth, 7);
    }

    // Fallback to ?t= query parameter (for <img src>, <a href>)
    if (!$token && isset($_GET['t'])) {
        $token = $_GET['t'];
    }

    if (!$token) return null;

    return jwt_decode($token);
}

/**
 * Require valid auth. Returns payload or sends 401.
 */
function require_auth(): array
{
    $user = authenticate();
    if (!$user) {
        json_error(401, 'Требуется авторизация');
    }
    return $user;
}

/**
 * Require designer role.
 */
function require_designer(): array
{
    $user = require_auth();
    if (($user['role'] ?? '') !== ROLE_DESIGNER) {
        json_error(403, 'Доступ только для дизайнера');
    }
    return $user;
}

/**
 * Require access to a specific project.
 */
function require_project_access(array $user, string $projectId): void
{
    if ($user['role'] === ROLE_DESIGNER) return;

    $userProjectId = $user['projectId'] ?? $user['visualizerProjectId'] ?? '';
    if ($userProjectId !== $projectId) {
        json_error(403, 'Нет доступа к этому проекту');
    }
}
