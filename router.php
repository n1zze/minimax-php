<?php
/**
 * Router script for PHP built-in server (development/testing only)
 * Usage: php -S localhost:8080 router.php
 */

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Serve static files
if ($path !== '/' && file_exists(__DIR__ . $path)) {
    // Don't serve PHP files directly from non-api paths
    if (!str_starts_with($path, '/api/') && pathinfo($path, PATHINFO_EXTENSION) !== 'php') {
        return false; // Let built-in server handle it
    }
}

// Route API requests
if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/index.php';
    return;
}

// SPA fallback
if (!str_starts_with($path, '/api/')) {
    $file = __DIR__ . $path;
    if ($path !== '/' && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        return false;
    }
    if (is_file(__DIR__ . '/index.html')) {
        require __DIR__ . '/index.html';
    } else {
        http_response_code(200);
        echo '<html><body><h1>Mimimax</h1><p>Build frontend: <code>npm run build</code></p></body></html>';
    }
    return;
}

http_response_code(404);
echo '404 Not Found';
