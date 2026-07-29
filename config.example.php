<?php
/**
 * Mimimax — Configuration template
 *
 * Copy this file to config.php and edit the values for your hosting.
 *
 * On shared hosting:
 *   1. Copy config.example.php → config.php
 *   2. Set JWT_SECRET to a random string (generate: openssl rand -base64 32)
 *   3. Set ADMIN_EMAIL and ADMIN_PASSWORD
 *   4. Set CORS_ORIGIN to your domain
 *   5. Upload all files to your hosting
 *   6. Set permissions: uploads/ → 755, data/ → 755
 */

// ─── Security ──────────────────────────────────────────────────────────────
define('JWT_SECRET', 'CHANGE_ME_generate_with_opensql_rand_base64_32');
define('JWT_EXPIRES_IN', 7 * 24 * 3600); // 7 days in seconds

// ─── Admin account (created on first run) ──────────────────────────────────
define('ADMIN_EMAIL', 'admin@yourdomain.com');
define('ADMIN_PASSWORD', 'your-strong-password-here');

// ─── Demo project password ─────────────────────────────────────────────────
define('DEMO_PROJECT_PASSWORD', 'demo-password-change-me');

// ─── Paths ─────────────────────────────────────────────────────────────────
define('DB_PATH', __DIR__ . '/data/mimimax.db');
define('UPLOAD_DIR', __DIR__ . '/uploads');
define('RATELIMIT_DIR', __DIR__ . '/data/ratelimit');

// ─── CORS ──────────────────────────────────────────────────────────────────
define('CORS_ORIGIN', 'https://yourdomain.com');

// ─── File uploads ──────────────────────────────────────────────────────────
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50 MB
define('MAX_IMAGE_DIM', 2560);

// ─── Email ─────────────────────────────────────────────────────────────────
define('EMAIL_FROM', 'noreply@yourdomain.com');
