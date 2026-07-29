<?php
$db = new PDO('sqlite:data/mimimax.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stmt = $db->query("SELECT id, title, substr(password_hash, 1, 7) as prefix, length(password_hash) as len FROM projects WHERE password_hash IS NOT NULL AND password_hash != ''");
foreach ($stmt->fetchAll() as $row) {
    echo $row['title'] . ' | prefix: ' . $row['prefix'] . ' | len: ' . $row['len'] . PHP_EOL;
}
