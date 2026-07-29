<?php
/**
 * Mimimax — JWT implementation (HMAC-SHA256, no dependencies)
 */

require_once __DIR__ . '/../config.php';

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload): string
{
    $header = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));

    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + JWT_EXPIRES_IN;
    $body = base64url_encode(json_encode($payload));

    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$body", JWT_SECRET, true)
    );

    return "$header.$body.$signature";
}

function jwt_decode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $signature] = $parts;

    // Verify signature
    $expected = base64url_encode(
        hash_hmac('sha256', "$header.$body", JWT_SECRET, true)
    );

    if (!hash_equals($expected, $signature)) return null;

    $payload = json_decode(base64url_decode($body), true);
    if (!is_array($payload)) return null;

    // Check expiry
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;

    return $payload;
}
