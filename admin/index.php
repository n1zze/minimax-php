<?php
/**
 * Админ-панель Mimimax
 *
 * Простая PHP-страница для управления проектами.
 * Доступ только для пользователей с ролью 'designer'.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../api/helpers.php';
require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/auth.php';

session_start([
    'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

// CSRF token generation and validation
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($_SESSION['csrf_token']) . '">';
}

function verify_csrf(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        echo 'CSRF token mismatch';
        exit;
    }
}

// ─── Авторизация ───────────────────────────────────────────────────────────

function admin_login(string $email, string $password): bool
{
    $db = get_db();
    $stmt = $db->prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return false;
    }
    if ($user['role'] !== 'designer') {
        return false;
    }

    $_SESSION['admin_user'] = [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
    ];
    return true;
}

function admin_logout(): void
{
    session_destroy();
    header('Location: index.php');
    exit;
}

function admin_check_auth(): ?array
{
    return $_SESSION['admin_user'] ?? null;
}

// ─── Обработка действий ────────────────────────────────────────────────────

// Выход
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    admin_logout();
}

// Вход
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_email'])) {
    verify_csrf();
    $email = $_POST['login_email'] ?? '';
    $password = $_POST['login_password'] ?? '';
    if (admin_login($email, $password)) {
        // Regenerate session ID after login to prevent session fixation
        session_regenerate_id(true);
        header('Location: index.php');
        exit;
    }
    $loginError = 'Неверный email или пароль';
}

// Сброс пароля проекта
if (isset($_POST['reset_password']) && $adminUser = admin_check_auth()) {
    verify_csrf();
    $db = get_db();
    $projectId = $_POST['project_id'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';
    if ($projectId && strlen($newPassword) >= 6) {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $db->prepare('UPDATE projects SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $projectId]);
        $successMsg = 'Пароль проекта обновлён';
    }
}

// Сброс токена визуализатора
if (isset($_POST['reset_viz_token']) && $adminUser = admin_check_auth()) {
    verify_csrf();
    $db = get_db();
    $projectId = $_POST['project_id'] ?? '';
    $newToken = $_POST['new_viz_token'] ?? '';
    if ($projectId && $newToken) {
        $hash = password_hash($newToken, PASSWORD_BCRYPT);
        $stmt = $db->prepare('UPDATE projects SET visualizer_token = ? WHERE id = ?');
        $stmt->execute([$hash, $projectId]);
        $successMsg = 'Токен визуализатора обновлён';
    }
}

// Удаление проекта
if (isset($_POST['delete_project']) && $adminUser = admin_check_auth()) {
    verify_csrf();
    $db = get_db();
    $projectId = $_POST['project_id'] ?? '';
    if ($projectId) {
        // Удалить файлы с диска
        $fileStmt = $db->prepare('SELECT id FROM project_files WHERE project_id = ?');
        $fileStmt->execute([$projectId]);
        foreach ($fileStmt->fetchAll(PDO::FETCH_COLUMN) as $fileId) {
            foreach (glob(UPLOAD_DIR . '/' . $fileId . '.*') as $f) {
                @unlink($f);
            }
        }
        $stmt = $db->prepare('DELETE FROM projects WHERE id = ?');
        $stmt->execute([$projectId]);
        $successMsg = 'Проект удалён';
    }
}

// ─── Получение данных ──────────────────────────────────────────────────────

$adminUser = admin_check_auth();
$db = $adminUser ? get_db() : null;

if ($db) {
    $projects = $db->query('SELECT id, title, client_name, status, password_hash IS NOT NULL as has_password, visualizer_token IS NOT NULL as has_viz, created_at, updated_at FROM projects ORDER BY created_at DESC')->fetchAll();
    $users = $db->query('SELECT id, email, role, created_at FROM users ORDER BY created_at')->fetchAll();
    $fileCount = $db->query('SELECT COUNT(*) FROM project_files')->fetchColumn();
    $notifCount = $db->query('SELECT COUNT(*) FROM notifications')->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель Mimimax</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; line-height: 1.5; }
        .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 24px; margin-bottom: 20px; }
        h2 { font-size: 18px; margin: 20px 0 10px; }

        /* Карточки */
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-label { font-size: 13px; color: #888; text-transform: uppercase; }
        .card-value { font-size: 28px; font-weight: 700; margin-top: 4px; }

        /* Таблица */
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
        th { background: #fafafa; font-weight: 600; color: #666; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f9f9f9; }

        /* Статусы */
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge-draft { background: #e0e0e0; color: #666; }
        .badge-in_progress { background: #e3f2fd; color: #1565c0; }
        .badge-completed { background: #e8f5e9; color: #2e7d32; }
        .badge-yes { background: #e8f5e9; color: #2e7d32; }
        .badge-no { background: #ffebee; color: #c62828; }

        /* Кнопки */
        .btn { display: inline-block; padding: 6px 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; }
        .btn-primary { background: #1a1a1a; color: #fff; }
        .btn-danger { background: #c62828; color: #fff; }
        .btn-outline { background: #fff; border: 1px solid #ddd; color: #333; }
        .btn:hover { opacity: 0.9; }
        .btn-sm { padding: 4px 10px; font-size: 12px; }

        /* Формы */
        input[type="text"], input[type="email"], input[type="password"] { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 100%; }
        label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #555; }
        .form-row { margin-bottom: 12px; }
        .form-inline { display: flex; gap: 8px; align-items: end; }
        .form-inline .form-row { flex: 1; margin-bottom: 0; }

        /* Сообщения */
        .alert { padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
        .alert-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }

        /* Секции */
        .section { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 14px; }

        /* Навигация */
        .nav { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
        .nav a { color: #555; text-decoration: none; font-size: 14px; }
        .nav a:hover { color: #000; }
        .nav-right { margin-left: auto; font-size: 13px; color: #888; }

        /* Модальное окно */
        .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; justify-content: center; align-items: center; }
        .modal-overlay.active { display: flex; }
        .modal { background: #fff; border-radius: 12px; padding: 24px; max-width: 420px; width: 90%; }
        .modal h3 { margin-bottom: 16px; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    </style>
</head>
<body>

<?php if (!$adminUser): ?>
<!-- ─── Страница входа ─────────────────────────────────────────────────── -->
<div class="container" style="max-width: 400px; margin-top: 100px;">
    <div class="section">
        <h1 style="text-align: center; margin-bottom: 24px;">Mimimax Admin</h1>
        <?php if (!empty($loginError)): ?>
            <div class="alert alert-error"><?= htmlspecialchars($loginError) ?></div>
        <?php endif; ?>
        <form method="POST">
            <?= csrf_field() ?>
            <div class="form-row">
                <label>Email</label>
                <input type="email" name="login_email" required autofocus>
            </div>
            <div class="form-row">
                <label>Пароль</label>
                <input type="password" name="login_password" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Войти</button>
        </form>
    </div>
</div>

<?php else: ?>
<!-- ─── Панель управления ───────────────────────────────────────────────── -->
<div class="container">
    <div class="nav">
        <strong>Mimimax</strong>
        <a href="index.php">Проекты</a>
        <a href="backup.php">Бэкап</a>
        <a href="../" target="_blank">Сайт</a>
        <span class="nav-right"><?= htmlspecialchars($adminUser['email']) ?> · <a href="?action=logout">Выйти</a></span>
    </div>

    <?php if (!empty($successMsg)): ?>
        <div class="alert alert-success"><?= htmlspecialchars($successMsg) ?></div>
    <?php endif; ?>

    <!-- Карточки -->
    <div class="cards">
        <div class="card">
            <div class="card-label">Проекты</div>
            <div class="card-value"><?= count($projects) ?></div>
        </div>
        <div class="card">
            <div class="card-label">Файлы</div>
            <div class="card-value"><?= $fileCount ?></div>
        </div>
        <div class="card">
            <div class="card-label">Уведомления</div>
            <div class="card-value"><?= $notifCount ?></div>
        </div>
        <div class="card">
            <div class="card-label">Пользователи</div>
            <div class="card-value"><?= count($users) ?></div>
        </div>
    </div>

    <!-- Проекты -->
    <div class="section">
        <div class="section-title">Проекты</div>
        <table>
            <thead>
                <tr>
                    <th>Название</th>
                    <th>Клиент</th>
                    <th>Статус</th>
                    <th>Пароль</th>
                    <th>Визуализатор</th>
                    <th>Создан</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($projects as $proj): ?>
                <tr>
                    <td><strong><?= htmlspecialchars($proj['title']) ?></strong></td>
                    <td><?= htmlspecialchars($proj['client_name']) ?></td>
                    <td><span class="badge badge-<?= htmlspecialchars($proj['status']) ?>"><?= htmlspecialchars($proj['status']) ?></span></td>
                    <td><span class="badge badge-<?= $proj['has_password'] ? 'yes' : 'no' ?>"><?= $proj['has_password'] ? 'есть' : 'нет' ?></span></td>
                    <td><span class="badge badge-<?= $proj['has_viz'] ? 'yes' : 'no' ?>"><?= $proj['has_viz'] ? 'есть' : 'нет' ?></span></td>
                    <td style="font-size:12px; color:#888;"><?= substr($proj['created_at'], 0, 10) ?></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="openModal('modal-pwd-<?= $proj['id'] ?>')">Пароль</button>
                        <button class="btn btn-outline btn-sm" onclick="openModal('modal-viz-<?= $proj['id'] ?>')">Визуализатор</button>
                        <button class="btn btn-danger btn-sm" onclick="openModal('modal-del-<?= $proj['id'] ?>')">Удалить</button>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Модальные окна для каждого проекта -->
    <?php foreach ($projects as $proj): ?>
        <!-- Сброс пароля -->
        <div class="modal-overlay" id="modal-pwd-<?= $proj['id'] ?>">
            <div class="modal">
                <h3>Сбросить пароль клиента</h3>
                <p style="font-size:14px; color:#666; margin-bottom:12px;"><?= htmlspecialchars($proj['title']) ?></p>
                <form method="POST">
                    <?= csrf_field() ?>
                    <input type="hidden" name="project_id" value="<?= $proj['id'] ?>">
                    <div class="form-row">
                        <label>Новый пароль</label>
                        <input type="password" name="new_password" required placeholder="Минимум 6 символов" minlength="6">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('modal-pwd-<?= $proj['id'] ?>')">Отмена</button>
                        <button type="submit" name="reset_password" class="btn btn-primary">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Сброс токена визуализатора -->
        <div class="modal-overlay" id="modal-viz-<?= $proj['id'] ?>">
            <div class="modal">
                <h3>Сбросить токен визуализатора</h3>
                <p style="font-size:14px; color:#666; margin-bottom:12px;"><?= htmlspecialchars($proj['title']) ?></p>
                <form method="POST">
                    <?= csrf_field() ?>
                    <input type="hidden" name="project_id" value="<?= $proj['id'] ?>">
                    <div class="form-row">
                        <label>Новый токен</label>
                        <input type="text" name="new_viz_token" required placeholder="Например: viz-token-abc123">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('modal-viz-<?= $proj['id'] ?>')">Отмена</button>
                        <button type="submit" name="reset_viz_token" class="btn btn-primary">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Удаление -->
        <div class="modal-overlay" id="modal-del-<?= $proj['id'] ?>">
            <div class="modal">
                <h3>Удалить проект?</h3>
                <p style="font-size:14px; color:#666; margin-bottom:12px;">«<?= htmlspecialchars($proj['title']) ?>» — это действие нельзя отменить.</p>
                <form method="POST">
                    <?= csrf_field() ?>
                    <input type="hidden" name="project_id" value="<?= $proj['id'] ?>">
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('modal-del-<?= $proj['id'] ?>')">Отмена</button>
                        <button type="submit" name="delete_project" class="btn btn-danger">Удалить</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endforeach; ?>

    <!-- Пользователи -->
    <div class="section">
        <div class="section-title">Пользователи</div>
        <table>
            <thead>
                <tr><th>Email</th><th>Роль</th><th>Создан</th></tr>
            </thead>
            <tbody>
            <?php foreach ($users as $user): ?>
                <tr>
                    <td><?= htmlspecialchars($user['email']) ?></td>
                    <td><span class="badge badge-<?= $user['role'] === 'designer' ? 'in_progress' : 'draft' ?>"><?= htmlspecialchars($user['role']) ?></span></td>
                    <td style="font-size:12px; color:#888;"><?= substr($user['created_at'], 0, 10) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
// Закрытие по клику на overlay
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
});
</script>
<?php endif; ?>

</body>
</html>
