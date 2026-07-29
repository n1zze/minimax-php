<?php
/**
 * Mimimax — Database initialization
 */

require_once __DIR__ . '/../config.php';

function get_db(): PDO
{
    static $db = null;
    if ($db) return $db;

    $dir = dirname(DB_PATH);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $db = new PDO('sqlite:' . DB_PATH, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $db->exec('PRAGMA journal_mode=WAL');
    $db->exec('PRAGMA foreign_keys=ON');
    $db->exec('PRAGMA busy_timeout=5000'); // Wait up to 5s for locks
    $db->exec('PRAGMA synchronous=NORMAL'); // WAL mode safe default

    // Create tables
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'designer',
            created_at TEXT DEFAULT (datetime('now'))
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            client_name TEXT DEFAULT '',
            status TEXT DEFAULT 'draft',
            password_hash TEXT,
            visualizer_token TEXT,
            thumbnail_path TEXT,
            data TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS project_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            section TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            size INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            recipient_role TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT DEFAULT '',
            section TEXT DEFAULT '',
            read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    ");

    // Indexes
    $db->exec('CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_project_files_section ON project_files(project_id, section)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id, recipient_role, read)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)');

    // Seed if empty
    $count = $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count == 0) {
        require_once __DIR__ . '/seed.php';
        seed_database($db);
    }

    return $db;
}
