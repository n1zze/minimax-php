<?php
/**
 * Mimimax — File routes
 */

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../bootstrap.php';

// ─── List Files ────────────────────────────────────────────────────────────

function route_list_files(string $projectId): void
{
    $user = require_auth();
    require_project_access($user, $projectId);

    $db = get_db();
    $section = $_GET['section'] ?? null;

    if ($section) {
        $stmt = $db->prepare('SELECT id, project_id, section, file_name, mime_type, size, created_at FROM project_files WHERE project_id = ? AND section = ? ORDER BY created_at');
        $stmt->execute([$projectId, $section]);
    } else {
        $stmt = $db->prepare('SELECT id, project_id, section, file_name, mime_type, size, created_at FROM project_files WHERE project_id = ? ORDER BY created_at');
        $stmt->execute([$projectId]);
    }

    $files = array_map(function ($row) {
        return [
            'id' => $row['id'],
            'projectId' => $row['project_id'],
            'section' => $row['section'],
            'fileName' => $row['file_name'],
            'mimeType' => $row['mime_type'],
            'size' => (int)$row['size'],
            'createdAt' => $row['created_at'],
        ];
    }, $stmt->fetchAll());

    json_response(200, $files);
}

// ─── Upload File ───────────────────────────────────────────────────────────

function route_upload_file(string $projectId): void
{
    $user = require_auth();
    require_project_access($user, $projectId);

    rate_limit("upload:{$user['id']}", 30, 60);

    if (empty($_FILES['files'])) {
        json_error(400, 'Файлы не были загружены');
    }

    $section = $_POST['section'] ?? '_general';
    // Sanitize section name
    $section = preg_replace('/[^a-zA-Z0-9_]/', '', $section);
    if (!$section) $section = '_general';

    // Check upload permission
    if ($user['role'] !== ROLE_DESIGNER) {
        if ($user['role'] !== ROLE_VISUALIZER || $section !== 'visualizations') {
            json_error(403, 'Нет прав на загрузку файлов в этот раздел');
        }
    }

    $files = $_FILES['files'];
    // Normalize to array (single file vs multiple)
    if (is_array($files['name'])) {
        $fileList = [];
        for ($i = 0; $i < count($files['name']); $i++) {
            $fileList[] = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i],
            ];
        }
    } else {
        $fileList = [$files];
    }

    $db = get_db();
    $uploaded = [];
    $uploadsDir = UPLOAD_DIR;

    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }

    foreach ($fileList as $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_error(400, 'Ошибка загрузки файла');
        }

        if ($file['size'] > MAX_FILE_SIZE) {
            json_error(400, 'Файл "' . $file['name'] . '" превышает лимит 50MB');
        }

        // Read file for magic bytes validation
        $buffer = file_get_contents($file['tmp_name']);
        if ($buffer === false) {
            json_error(500, 'Не удалось прочитать файл');
        }

        // Validate MIME via magic bytes
        $detectedMime = detect_mime_from_buffer($buffer);
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

        if (!$detectedMime || !in_array($detectedMime, $allowedMimes, true)) {
            json_error(400, 'Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, PDF');
        }

        // Validate extension matches detected MIME
        $originalExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExts = MIME_TO_EXT[$detectedMime] ?? [];
        if ($originalExt && $allowedExts && !in_array('.' . $originalExt, $allowedExts, true)) {
            json_error(400, 'Расширение файла не соответствует его типу');
        }

        $id = uuid();
        $safeExt = $allowedExts[0] ?? '.bin';
        $finalBuffer = $buffer;
        $finalMime = $detectedMime;

        // Optimize images
        if (str_starts_with($detectedMime, 'image/')) {
            $optimized = optimize_image($buffer, $detectedMime);
            if ($optimized) {
                $finalBuffer = $optimized['buffer'];
                $finalMime = $optimized['mime'];
            }
        }

        $storedName = $id . $safeExt;
        $storedPath = $uploadsDir . '/' . $storedName;

        if (file_put_contents($storedPath, $finalBuffer) === false) {
            json_error(500, 'Не удалось сохранить файл');
        }

        $stmt = $db->prepare('INSERT INTO project_files (id, project_id, section, file_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $id,
            $projectId,
            $section,
            $file['name'],
            $finalMime,
            strlen($finalBuffer),
        ]);

        $uploaded[] = [
            'id' => $id,
            'projectId' => $projectId,
            'section' => $section,
            'fileName' => $file['name'],
            'mimeType' => $finalMime,
            'size' => strlen($finalBuffer),
            'url' => "/api/files/$storedName",
        ];
    }

    json_response(201, count($uploaded) === 1 ? $uploaded[0] : $uploaded);
}

// ─── Serve File ────────────────────────────────────────────────────────────

function route_serve_file(string $name): void
{
    $user = require_auth();

    // Sanitize: strip directory components
    $safeName = basename($name);

    if (!$safeName || $safeName !== $name) {
        json_error(400, 'Недопустимое имя файла');
    }

    // Reject suspicious characters
    if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $safeName)) {
        json_error(400, 'Недопустимые символы в имени файла');
    }

    $filePath = UPLOAD_DIR . '/' . $safeName;

    // Double-check path stays within uploads dir
    $realUploads = realpath(UPLOAD_DIR);
    $realFile = realpath($filePath);
    if (!$realFile || !str_starts_with($realFile, $realUploads . DIRECTORY_SEPARATOR)) {
        json_error(403, 'Доступ запрещён');
    }

    if (!file_exists($filePath)) {
        json_error(404, 'Файл не найден');
    }

    // Verify file belongs to a project the user can access
    $fileId = pathinfo($safeName, PATHINFO_FILENAME);
    $db = get_db();
    $stmt = $db->prepare('SELECT project_id FROM project_files WHERE id = ?');
    $stmt->execute([$fileId]);
    $fileRow = $stmt->fetch();
    if ($fileRow) {
        require_project_access($user, $fileRow['project_id']);
    }

    // Set Content-Type
    $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
    $contentTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
    ];
    $contentType = $contentTypes[$ext] ?? 'application/octet-stream';

    header("Content-Type: $contentType");
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($filePath));

    readfile($filePath);
    exit;
}

// ─── Delete File ───────────────────────────────────────────────────────────

function route_delete_file(string $projectId, string $fileId): void
{
    $user = require_auth();

    if ($user['role'] !== ROLE_DESIGNER) {
        json_error(403, 'Удалять файлы может только дизайнер');
    }

    require_project_access($user, $projectId);

    $db = get_db();
    $stmt = $db->prepare('SELECT id FROM project_files WHERE id = ? AND project_id = ?');
    $stmt->execute([$fileId, $projectId]);

    $file = $stmt->fetch();
    if (!$file) {
        json_error(404, 'Файл не найден');
    }

    $stmt = $db->prepare('DELETE FROM project_files WHERE id = ? AND project_id = ?');
    $stmt->execute([$fileId, $projectId]);

    // Also delete physical file from disk
    $patterns = glob(UPLOAD_DIR . '/' . $fileId . '.*');
    foreach ($patterns as $filePath) {
        if (is_file($filePath)) {
            @unlink($filePath);
        }
    }

    json_response(200, ['ok' => true]);
}
