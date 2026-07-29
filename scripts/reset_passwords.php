<?php
// Reset all project passwords (they were double-hashed)
$db = new PDO('sqlite:data/mimimax.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Set a known password for all projects
$password = 'client123';
$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $db->prepare('UPDATE projects SET password_hash = ? WHERE password_hash IS NOT NULL AND password_hash != ""');
$affected = $stmt->execute([$hash]);

echo "Reset password for all projects to: $password\n";
echo "Affected rows: " . $stmt->rowCount() . "\n";

// Verify
$stmt = $db->query("SELECT title, substr(password_hash, 1, 7) as prefix FROM projects");
foreach ($stmt->fetchAll() as $row) {
    echo "  " . $row['title'] . " → " . $row['prefix'] . " (valid: " . (password_verify($password, $row['prefix'] . substr(password_hash($password, PASSWORD_BCRYPT), 7)) ? 'checking...' : 'check manually') . ")\n";
}

// Verify with proper check
$stmt = $db->query("SELECT title, password_hash FROM projects WHERE password_hash IS NOT NULL AND password_hash != ''");
foreach ($stmt->fetchAll() as $row) {
    $valid = password_verify($password, $row['password_hash']);
    echo "  " . $row['title'] . " → verify('$password'): " . ($valid ? 'YES' : 'NO') . "\n";
}
