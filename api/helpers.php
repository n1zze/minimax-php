<?php
/**
 * Mimimax — Utility functions
 */

require_once __DIR__ . '/../config.php';

// ─── Logging ───────────────────────────────────────────────────────────────
//
// Пишет сообщение в файл data/app.log.
// Как посмотреть логи: откройте файл data/app.log в текстовом редакторе.
//

function app_log(string $level, string $message): void
{
    $logDir = dirname(DB_PATH);
    $logFile = $logDir . '/app.log';

    // Ротация: если файл > 5MB, переименовать в .old
    if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
        @rename($logFile, $logFile . '.old');
    }

    $line = date('Y-m-d H:i:s') . " [$level] $message\n";
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

// ─── JSON Response ─────────────────────────────────────────────────────────

function json_response(int $code, $data): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(int $code, string $message): void
{
    json_response($code, ['error' => $message]);
}

// ─── Input ─────────────────────────────────────────────────────────────────

function get_json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ─── CORS ──────────────────────────────────────────────────────────────────

function cors_headers(): void
{
    $origin = CORS_ORIGIN;
    if ($origin) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    } else {
        // No explicit origin — reflect request origin (development only)
        // WARNING: In production, always set CORS_ORIGIN to your domain
        $reqOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($reqOrigin) {
            // Basic validation: must be http(s)
            if (preg_match('#^https?://#', $reqOrigin)) {
                header("Access-Control-Allow-Origin: $reqOrigin");
                header('Access-Control-Allow-Credentials: true');
            }
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ─── Security Headers ──────────────────────────────────────────────────────

function security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-XSS-Protection: 1; mode=block');
    // HSTS only over HTTPS (browsers ignore it on HTTP anyway)
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    // Prevent MIME sniffing of uploaded files
    header('X-Download-Options: noopen');
}

// ─── Rate Limiting (file-based) ────────────────────────────────────────────

function rate_limit(string $key, int $maxAttempts, int $windowSeconds): void
{
    $dir = RATELIMIT_DIR;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    // Periodic cleanup: delete expired rate-limit files (~1 in 100 chance)
    if (random_int(1, 100) === 1) {
        $cutoff = time() - $windowSeconds * 2;
        foreach (glob($dir . '/*.json') as $rlFile) {
            if (filemtime($rlFile) < $cutoff) {
                @unlink($rlFile);
            }
        }
    }

    $file = $dir . '/' . md5($key) . '.json';
    $now = time();
    $data = ['count' => 0, 'start' => $now];

    if (file_exists($file)) {
        $stored = json_decode(file_get_contents($file), true);
        if (is_array($stored)) {
            $data = $stored;
        }
    }

    if ($now - $data['start'] > $windowSeconds) {
        $data = ['count' => 1, 'start' => $now];
    } else {
        $data['count']++;
    }

    file_put_contents($file, json_encode($data), LOCK_EX);

    if ($data['count'] >= $maxAttempts) {
        json_error(429, 'Слишком много запросов, попробуйте позже');
    }
}

// ─── UUID v4 ───────────────────────────────────────────────────────────────

function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant 1
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

// ─── MIME Detection ────────────────────────────────────────────────────────

const MAGIC_BYTES = [
    'image/jpeg' => ["\xFF\xD8\xFF"],
    'image/png'  => ["\x89\x50\x4E\x47"],
    'image/webp' => ["\x52\x49\x46\x46"], // RIFF....WEBP
    'application/pdf' => ["\x25\x50\x44\x46"], // %PDF
];

const MIME_TO_EXT = [
    'image/jpeg' => ['.jpg', '.jpeg'],
    'image/png'  => ['.png'],
    'image/webp' => ['.webp'],
    'application/pdf' => ['.pdf'],
];

function detect_mime_from_buffer(string $buffer): ?string
{
    foreach (MAGIC_BYTES as $mime => $signatures) {
        foreach ($signatures as $sig) {
            if (strncmp($buffer, $sig, strlen($sig)) === 0) {
                if ($mime === 'image/webp') {
                    $marker = substr($buffer, 8, 4);
                    if ($marker !== 'WEBP') continue;
                }
                return $mime;
            }
        }
    }
    return null;
}

// ─── Image Optimization (GD) ───────────────────────────────────────────────

function optimize_image(string $buffer, string $detectedMime): ?array
{
    if (!str_starts_with($detectedMime, 'image/')) return null;
    if (!function_exists('imagecreatefromjpeg')) return null;

    $src = @imagecreatefromstring($buffer);
    if (!$src) return null;

    $w = imagesx($src);
    $h = imagesy($src);
    $maxDim = MAX_IMAGE_DIM;

    if ($w > $maxDim || $h > $maxDim) {
        $ratio = min($maxDim / $w, $maxDim / $h);
        $newW = (int)round($w * $ratio);
        $newH = (int)round($h * $ratio);
        $dst = imagecreatetruecolor($newW, $newH);
        if ($detectedMime === 'image/png') {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
        }
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($src);
        $src = $dst;
    }

    ob_start();
    $ok = false;
    switch ($detectedMime) {
        case 'image/jpeg':
            $ok = imagejpeg($src, null, 82);
            break;
        case 'image/png':
            $ok = imagepng($src, null, 8);
            break;
        case 'image/webp':
            $ok = imagewebp($src, null, 82);
            break;
    }
    imagedestroy($src);

    if (!$ok) {
        ob_end_clean();
        return null;
    }

    $out = ob_get_clean();
    if (!$out) return null;

    return ['buffer' => $out, 'mime' => $detectedMime];
}

// ─── Request URI Parsing ───────────────────────────────────────────────────

function get_request_path(): string
{
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    // Remove query string
    $path = parse_url($uri, PHP_URL_PATH);
    // Remove /api prefix if present
    if (str_starts_with($path, '/api/')) {
        $path = substr($path, 4); // keep the leading /
    } elseif ($path === '/api') {
        $path = '/';
    }
    return $path ?: '/';
}

function get_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}
