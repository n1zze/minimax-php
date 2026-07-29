<?php
/**
 * Бэкап базы данных Mimimax
 *
 * Откройте в браузере: /admin/backup.php
 * Скачает текущую БД как .db файл.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/auth.php';

session_start();
$adminUser = $_SESSION['admin_user'] ?? null;

if (!$adminUser || ($adminUser['role'] ?? '') !== 'designer') {
    http_response_code(403);
    echo 'Доступ запрещён. <a href="index.php">Войти</a>';
    exit;
}

// ─── Скачать бэкап ─────────────────────────────────────────────────────────

if (isset($_GET['download'])) {
    $dbPath = DB_PATH;
    if (!file_exists($dbPath)) {
        http_response_code(404);
        echo 'Файл БД не найден';
        exit;
    }

    $date = date('Y-m-d_H-i');
    $filename = "mimimax_backup_$date.db";

    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header('Content-Length: ' . filesize($dbPath));
    readfile($dbPath);
    exit;
}

// ─── Страница ──────────────────────────────────────────────────────────────

$db = get_db();
$dbSize = filesize(DB_PATH);
$fileCount = $db->query('SELECT COUNT(*) FROM project_files')->fetchColumn();
$uploadSize = 0;
foreach (glob(UPLOAD_DIR . '/*') as $f) {
    if (is_file($f)) $uploadSize += filesize($f);
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Бэкап — Mimimax Admin</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 600px; margin: 40px auto; padding: 20px; }
        .section { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h1 { font-size: 22px; margin-bottom: 16px; }
        .btn { display: inline-block; padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; }
        .btn-primary { background: #1a1a1a; color: #fff; }
        .btn:hover { opacity: 0.9; }
        .info { font-size: 14px; color: #666; margin-bottom: 16px; }
        .info strong { color: #333; }
        a { color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <div class="section">
            <h1>Бэкап базы данных</h1>
            <div class="info">
                <p>Размер БД: <strong><?= round($dbSize / 1024, 1) ?> KB</strong></p>
                <p>Файлов в uploads: <strong><?= $fileCount ?></strong> (<?= round($uploadSize / 1024 / 1024, 1) ?> MB)</p>
            </div>
            <a href="?download=1" class="btn btn-primary">Скачать бэкап (.db)</a>
            <p style="margin-top: 12px; font-size: 13px; color: #999;">
                Бэкап загрузит текущий файл базы данных.
                Для полного бэкапа также скопируйте папку uploads/.
            </p>
        </div>
        <p><a href="index.php">← Назад к админ-панели</a></p>
    </div>
</body>
</html>
