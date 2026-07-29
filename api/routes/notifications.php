<?php
/**
 * Mimimax — Notification routes
 */

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../bootstrap.php';

// ─── Helpers ───────────────────────────────────────────────────────────────

function get_recipient_role(array $user): ?string
{
    return $user['role'] ?? null;
}

function get_allowed_project_filter(array $user): ?string
{
    if ($user['role'] === ROLE_DESIGNER) return null;
    return $user['projectId'] ?? $user['visualizerProjectId'] ?? null;
}

// ─── List Notifications ────────────────────────────────────────────────────

function route_list_notifications(): void
{
    $user = require_auth();
    $recipientRole = get_recipient_role($user);

    if (!$recipientRole) {
        json_error(403, 'Доступ запрещён');
    }

    $db = get_db();
    $projectFilter = get_allowed_project_filter($user);

    if ($projectFilter) {
        $stmt = $db->prepare('SELECT id, project_id, recipient_role, type, title, message, section, read, created_at FROM notifications WHERE recipient_role = ? AND project_id = ? ORDER BY created_at DESC LIMIT 100');
        $stmt->execute([$recipientRole, $projectFilter]);
    } else {
        $stmt = $db->prepare('SELECT id, project_id, recipient_role, type, title, message, section, read, created_at FROM notifications WHERE recipient_role = ? ORDER BY created_at DESC LIMIT 100');
        $stmt->execute([$recipientRole]);
    }

    $notifications = array_map(function ($row) {
        return [
            'id' => $row['id'],
            'projectId' => $row['project_id'],
            'recipientRole' => $row['recipient_role'],
            'type' => $row['type'],
            'title' => $row['title'],
            'message' => $row['message'],
            'section' => $row['section'],
            'read' => (bool)$row['read'],
            'createdAt' => $row['created_at'],
        ];
    }, $stmt->fetchAll());

    json_response(200, $notifications);
}

// ─── Unread Count ──────────────────────────────────────────────────────────

function route_unread_count(): void
{
    $user = require_auth();
    $recipientRole = get_recipient_role($user);

    if (!$recipientRole) {
        json_error(403, 'Доступ запрещён');
    }

    $db = get_db();
    $projectFilter = get_allowed_project_filter($user);

    if ($projectFilter) {
        $stmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE recipient_role = ? AND project_id = ? AND read = 0');
        $stmt->execute([$recipientRole, $projectFilter]);
    } else {
        $stmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE recipient_role = ? AND read = 0');
        $stmt->execute([$recipientRole]);
    }

    $count = (int)$stmt->fetchColumn();
    json_response(200, ['count' => $count]);
}

// ─── Mark Read ─────────────────────────────────────────────────────────────

function route_mark_read(string $id): void
{
    $user = require_auth();
    $recipientRole = get_recipient_role($user);

    if (!$recipientRole) {
        json_error(403, 'Доступ запрещён');
    }

    $db = get_db();
    $projectFilter = get_allowed_project_filter($user);

    if ($projectFilter) {
        $stmt = $db->prepare('SELECT id FROM notifications WHERE id = ? AND recipient_role = ? AND project_id = ?');
        $stmt->execute([$id, $recipientRole, $projectFilter]);
    } else {
        $stmt = $db->prepare('SELECT id FROM notifications WHERE id = ? AND recipient_role = ?');
        $stmt->execute([$id, $recipientRole]);
    }

    if (!$stmt->fetch()) {
        json_error(404, 'Уведомление не найдено');
    }

    $stmt = $db->prepare('UPDATE notifications SET read = 1 WHERE id = ?');
    $stmt->execute([$id]);

    json_response(200, ['ok' => true]);
}

// ─── Mark All Read ─────────────────────────────────────────────────────────

function route_mark_all_read(): void
{
    $user = require_auth();
    $recipientRole = get_recipient_role($user);

    if (!$recipientRole) {
        json_error(403, 'Доступ запрещён');
    }

    $db = get_db();
    $projectFilter = get_allowed_project_filter($user);

    if ($projectFilter) {
        $stmt = $db->prepare('UPDATE notifications SET read = 1 WHERE recipient_role = ? AND project_id = ? AND read = 0');
        $stmt->execute([$recipientRole, $projectFilter]);
    } else {
        $stmt = $db->prepare('UPDATE notifications SET read = 1 WHERE recipient_role = ? AND read = 0');
        $stmt->execute([$recipientRole]);
    }

    json_response(200, ['ok' => true]);
}

// ─── Create for Client ─────────────────────────────────────────────────────

function route_create_for_client(string $projectId): void
{
    $user = require_designer();
    require_project_access($user, $projectId);

    $input = get_json_input();
    $title = $input['title'] ?? '';

    if (!$title) {
        json_error(400, 'Заголовок обязателен');
    }

    $db = get_db();

    // Verify project exists
    $stmt = $db->prepare('SELECT id FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    if (!$stmt->fetch()) {
        json_error(404, 'Проект не найден');
    }

    $id = create_notification($db, [
        'projectId' => $projectId,
        'recipientRole' => ROLE_CLIENT,
        'type' => $input['type'] ?? 'info',
        'title' => $title,
        'message' => $input['message'] ?? '',
        'section' => $input['section'] ?? '',
    ]);

    json_response(201, ['id' => $id, 'ok' => true]);
}

// ─── Send Email Notification ───────────────────────────────────────────────

function route_send_email_notification(string $projectId): void
{
    $user = require_designer();

    $input = get_json_input();
    $recipientEmail = $input['recipientEmail'] ?? '';
    $message = $input['message'] ?? '';

    if (!$recipientEmail || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        json_error(400, 'Укажите корректный email клиента');
    }

    $db = get_db();
    $stmt = $db->prepare('SELECT id, title, client_name FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        json_error(404, 'Проект не найден');
    }

    // Create in-app notification
    create_notification($db, [
        'projectId' => $project['id'],
        'recipientRole' => ROLE_CLIENT,
        'type' => 'email',
        'title' => 'Сообщение от дизайнера',
        'message' => $message ?: 'Материалы проекта обновлены',
        'section' => '',
    ]);

    // Send email via PHP mail()
    $projectUrl = CORS_ORIGIN
        ? CORS_ORIGIN . "/projects/$projectId/unlock"
        : '';

    $subject = "Обновление проекта «" . htmlspecialchars($project['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "»";
    $htmlBody = "
        <div style='font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;'>
            <h2 style='margin-bottom: 16px; color: #1a1a1a;'>Обновление проекта</h2>
            <p style='color: #444; line-height: 1.6; margin-bottom: 24px;'>" . htmlspecialchars($message ?: 'Материалы вашего проекта были обновлены.') . "</p>
            " . ($projectUrl ? "<a href='" . htmlspecialchars($projectUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . "' style='display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;'>Открыть проект</a>" : '') . "
            <hr style='margin-top: 32px; border: none; border-top: 1px solid #e5e5e5;' />
            <p style='font-size: 12px; color: #999; margin-top: 16px;'>Vitalina Design — дизайн интерьеров с заботой о деталях</p>
        </div>
    ";

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . EMAIL_FROM,
    ];

    $mailSent = @mail($recipientEmail, $subject, $htmlBody, implode("\r\n", $headers));

    json_response(202, [
        'id' => 'email-' . time(),
        'channel' => 'email',
        'status' => $mailSent ? 'sent' : 'failed',
        'recipientEmail' => $recipientEmail,
        'projectId' => $project['id'],
        'projectTitle' => $project['title'],
        'sentAt' => date('c'),
    ]);
}
