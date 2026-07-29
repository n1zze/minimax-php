<?php
/**
 * Mimimax — Project routes
 */

require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../bootstrap.php';

// ─── Helpers ───────────────────────────────────────────────────────────────

function parse_project_row(array $row): array
{
    $data = json_decode($row['data'] ?? '{}', true) ?: [];

    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'clientName' => $row['client_name'],
        'status' => $row['status'],
        'passwordHash' => $row['password_hash'],
        'thumbnailPath' => $row['thumbnail_path'],
        'data' => $data,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'visualizerToken' => $row['visualizer_token'] ?? '',
        'city' => $data['city'] ?? '',
        'area' => $data['area'] ?? null,
        'year' => $data['year'] ?? null,
        'projectType' => $data['projectType'] ?? '',
        'pricePerSqm' => $data['pricePerSqm'] ?? null,
        'objectType' => $data['objectType'] ?? '',
    ];
}

function sanitize_project(array $project, string $role): array
{
    $safe = [
        'id' => $project['id'],
        'title' => $project['title'],
        'clientName' => $project['clientName'],
        'status' => $project['status'],
        'thumbnailPath' => $project['thumbnailPath'],
        'data' => $project['data'],
        'createdAt' => $project['createdAt'],
        'updatedAt' => $project['updatedAt'],
        'city' => $project['city'],
        'area' => $project['area'],
        'year' => $project['year'],
        'projectType' => $project['projectType'],
        'pricePerSqm' => $project['pricePerSqm'],
        'objectType' => $project['objectType'],
    ];

    if ($role === ROLE_VISUALIZER) {
        $safe['data'] = [
            'floorPlan' => $project['data']['floorPlan'] ?? ['images' => [], 'videoUrl' => '', 'videoTitle' => ''],
            'visualizations' => $project['data']['visualizations'] ?? [],
        ];
    }

    return $safe;
}

/**
 * Извлечь URL из элемента изображения (строка или массив).
 */
function extract_image_url($img): string
{
    if (is_string($img)) return $img;
    return $img['serverUrl'] ?? $img['src'] ?? '';
}

/**
 * Извлечь данные PDF-секции (brief, contract, approval и т.д.).
 * Возвращает массив или null если PDF не задан.
 */
function extract_pdf(?array $section): ?array
{
    if (empty($section['pdfUrl'])) return null;
    return [
        'title' => $section['title'] ?? '',
        'url' => $section['pdfUrl'],
        'name' => $section['pdfName'] ?? '',
    ];
}

/**
 * Преобразовать секции фронтенда в плоский JSON для хранения в БД.
 *
 * Фронтенд работает с вложенными объектами: sections.floorPlan.images[]
 * БД хранит плоский JSON: data.floorPlan.images[]
 * Эта функция делает преобразование.
 */
function sections_to_flat_data(?array $sections): array
{
    if (!$sections) return [];

    $result = [];

    // PDF-документы (brief, contract, approvals)
    $result['briefPdf'] = extract_pdf($sections['brief'] ?? null);
    $result['contractPdf'] = extract_pdf($sections['contract'] ?? null);
    $result['floorPlanApprovalPdf'] = extract_pdf($sections['floorPlanApproval'] ?? null);
    $result['collagesApprovalPdf'] = extract_pdf($sections['collagesApproval'] ?? null);
    $result['drawingsApprovalPdf'] = extract_pdf($sections['drawingsApproval'] ?? null);
    $result['specificationApprovalPdf'] = extract_pdf($sections['specificationApproval'] ?? null);

    // Timeline
    $result['timeline'] = $sections['timeline']['steps'] ?? $sections['timeline'] ?? [];

    // План этажа
    $fp = $sections['floorPlan'] ?? null;
    $result['floorPlan'] = [
        'images' => [],
        'videoUrl' => $fp['videoUrl'] ?? '',
        'videoTitle' => $fp['videoTitle'] ?? '',
    ];
    foreach ($fp['images'] ?? [] as $img) {
        $result['floorPlan']['images'][] = extract_image_url($img);
    }

    // Коллажи
    $result['collages'] = [];
    foreach ($sections['collages']['items'] ?? [] as $item) {
        $result['collages'][] = extract_image_url($item);
    }

    // Визуализации (секция со вложенными вкладками)
    $result['visualizations'] = [];
    foreach ($sections['visualizations']['tabs'] ?? [] as $tabIndex => $tab) {
        $entry = [
            'id' => $tab['id'] ?? "vis-$tabIndex",
            'name' => $tab['title'] ?? $tab['name'] ?? '',
            'title' => $tab['title'] ?? $tab['name'] ?? '',
            'versionNumber' => $tab['versionNumber'] ?? null,
            'date' => $tab['date'] ?? null,
            'author' => $tab['author'] ?? null,
            'status' => $tab['status'] ?? null,
            'source' => $tab['source'] ?? null,
            'images' => [],
        ];
        foreach ($tab['images'] ?? [] as $img) {
            if (is_string($img)) {
                $entry['images'][] = ['src' => $img];
            } else {
                $entry['images'][] = [
                    'id' => $img['id'] ?? null,
                    'src' => $img['serverUrl'] ?? $img['src'] ?? '',
                    'alt' => $img['alt'] ?? '',
                    'name' => $img['name'] ?? '',
                    'uploadedBy' => $img['uploadedBy'] ?? null,
                    'serverUrl' => $img['serverUrl'] ?? null,
                ];
            }
        }
        $result['visualizations'][] = $entry;
    }

    // Чертежи
    $result['drawings'] = [];
    foreach ($sections['drawings']['items'] ?? [] as $item) {
        $result['drawings'][] = extract_image_url($item);
    }

    // Спецификация
    $result['specification'] = [
        'items' => $sections['specification']['items'] ?? [],
        'excelUrl' => $sections['specification']['excelUrl'] ?? '',
    ];

    // Финальный проект
    $fp2 = $sections['finalProject'] ?? null;
    $result['finalProject'] = [
        'items' => [],
        'pdfUrl' => $fp2['pdfUrl'] ?? '',
        'title' => $fp2['title'] ?? '',
    ];
    foreach ($fp2['items'] ?? [] as $item) {
        $result['finalProject']['items'][] = extract_image_url($item);
    }

    // Авторский надзор
    $as = $sections['authorSupervision'] ?? null;
    $reportPdf = !empty($as['pdfUrl'])
        ? ['title' => $as['title'] ?? '', 'url' => $as['pdfUrl']]
        : ($as['reportPdf'] ?? ['title' => '', 'url' => '']);
    $result['authorSupervision'] = [
        'diary' => $as['diary'] ?? [],
        'reportPdf' => $reportPdf,
    ];

    return $result;
}

function create_notification(PDO $db, array $data): string
{
    $id = uuid();
    $stmt = $db->prepare('INSERT INTO notifications (id, project_id, recipient_role, type, title, message, section, read) VALUES (?, ?, ?, ?, ?, ?, ?, 0)');
    $stmt->execute([
        $id,
        $data['projectId'],
        $data['recipientRole'],
        $data['type'],
        $data['title'],
        $data['message'] ?? '',
        $data['section'] ?? '',
    ]);
    return $id;
}

// ─── List Projects ─────────────────────────────────────────────────────────

function route_list_projects(): void
{
    $user = require_auth();
    $db = get_db();

    $rows = $db->query("
        SELECT 
            id, title, client_name, status, thumbnail_path, created_at, updated_at,
            json_extract(data, '$.floorPlan.images[0]') as fp_thumb,
            json_extract(data, '$.visualizations[0].images[0]') as vis_thumb,
            json_extract(data, '$.collages[0]') as collage_thumb,
            json_extract(data, '$.city') as city,
            json_extract(data, '$.area') as area,
            json_extract(data, '$.year') as year,
            json_extract(data, '$.projectType') as project_type,
            json_extract(data, '$.pricePerSqm') as price_per_sqm,
            json_extract(data, '$.objectType') as object_type
        FROM projects 
        ORDER BY created_at DESC
    ")->fetchAll();

    $projects = [];
    foreach ($rows as $row) {
        $fpThumb = $row['fp_thumb'] ?? null;
        $visThumb = $row['vis_thumb'] ?? null;
        $collageThumb = $row['collage_thumb'] ?? null;

        $project = [
            'id' => $row['id'],
            'title' => $row['title'],
            'clientName' => $row['client_name'],
            'status' => $row['status'],
            'thumbnailPath' => $row['thumbnail_path'] ?: $fpThumb ?: $visThumb ?: $collageThumb ?: null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
            'city' => $row['city'] ?? '',
            'area' => $row['area'] !== null ? (float)$row['area'] : null,
            'year' => $row['year'] !== null ? (int)$row['year'] : null,
            'projectType' => $row['project_type'] ?? '',
            'pricePerSqm' => $row['price_per_sqm'] !== null ? (float)$row['price_per_sqm'] : null,
            'objectType' => $row['object_type'] ?? '',
        ];

        // Filter by role
        if ($user['role'] !== ROLE_DESIGNER) {
            $allowedId = $user['projectId'] ?? $user['visualizerProjectId'] ?? '';
            if ($allowedId && $allowedId !== $project['id']) continue;
        }

        $projects[] = $project;
    }

    json_response(200, $projects);
}

// ─── Get Project ───────────────────────────────────────────────────────────

function route_get_project(string $id): void
{
    $user = require_auth();
    require_project_access($user, $id);

    $db = get_db();
    $stmt = $db->prepare('SELECT id, title, client_name, status, password_hash, thumbnail_path, data, created_at, updated_at, visualizer_token FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        json_error(404, 'Проект не найден');
    }

    $project = parse_project_row($row);
    json_response(200, sanitize_project($project, $user['role']));
}

// ─── Get Project Access Info ───────────────────────────────────────────────

function route_get_project_access_info(string $id): void
{
    rate_limit("access_info:$id", 30, 60);

    $db = get_db();
    $stmt = $db->prepare('SELECT id, title, password_hash, visualizer_token FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        json_error(404, 'Проект не найден');
    }

    json_response(200, [
        'id' => $row['id'],
        'title' => $row['title'],
        'hasClientAccess' => !empty($row['password_hash']),
        'hasVisualizerAccess' => !empty($row['visualizer_token']),
    ]);
}

// ─── Create Project ────────────────────────────────────────────────────────

function route_create_project(): void
{
    $user = require_designer();
    $input = get_json_input();
    $db = get_db();

    $id = uuid();
    $projectData = array_merge($input['data'] ?? [], [
        'projectType' => $input['projectType'] ?? 'full_with_supervision',
        'pricePerSqm' => $input['pricePerSqm'] ?? null,
        'objectType' => $input['objectType'] ?? null,
    ]);

    $stmt = $db->prepare('INSERT INTO projects (id, title, client_name, status, password_hash, data) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $id,
        $input['title'] ?? 'Новый проект',
        $input['clientName'] ?? '',
        $input['status'] ?? 'draft',
        !empty($input['passwordHash']) ? password_hash($input['passwordHash'], PASSWORD_BCRYPT) : '',
        json_encode($projectData, JSON_UNESCAPED_UNICODE),
    ]);

    json_response(201, [
        'id' => $id,
        'title' => $input['title'] ?? 'Новый проект',
        'clientName' => $input['clientName'] ?? '',
        'status' => $input['status'] ?? 'draft',
        'projectType' => $projectData['projectType'],
        'pricePerSqm' => $projectData['pricePerSqm'],
        'objectType' => $projectData['objectType'],
    ]);
}

// ─── Update Project ────────────────────────────────────────────────────────

function route_update_project(string $id): void
{
    $user = require_auth();
    require_project_access($user, $id);

    if ($user['role'] !== ROLE_DESIGNER && $user['role'] !== ROLE_VISUALIZER) {
        json_error(403, 'Клиент не может изменять проект');
    }

    $input = get_json_input();
    $db = get_db();

    // Get existing data
    $stmt = $db->prepare('SELECT id, data FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        json_error(404, 'Проект не найден');
    }

    $existingData = json_decode($existing['data'] ?? '{}', true) ?: [];
    $sets = [];
    $values = [];

    if ($user['role'] === ROLE_VISUALIZER) {
        if (empty($input['sections']['visualizations'])) {
            json_error(403, 'Визуализатор может изменять только визуализации проекта');
        }

        $updatedData = array_merge($existingData, [
            'visualizations' => sections_to_flat_data(['visualizations' => $input['sections']['visualizations']])['visualizations'],
        ]);

        $sets[] = 'data = ?';
        $values[] = json_encode($updatedData, JSON_UNESCAPED_UNICODE);
    } else {
        // Designer can update everything
        $fields = [
            'title' => 'title',
            'clientName' => 'client_name',
            'status' => 'status',
            'passwordHash' => 'password_hash',
            'visualizerToken' => 'visualizer_token',
            'thumbnailPath' => 'thumbnail_path',
        ];

        foreach ($fields as $inputKey => $dbCol) {
            if (isset($input[$inputKey])) {
                $sets[] = "$dbCol = ?";
                // Hash sensitive fields
                if ($inputKey === 'passwordHash' || $inputKey === 'visualizerToken') {
                    $values[] = $input[$inputKey] ? password_hash($input[$inputKey], PASSWORD_BCRYPT) : '';
                } else {
                    $values[] = $input[$inputKey];
                }
            }
        }

        // Update data JSON
        $dataFields = ['city', 'area', 'year', 'projectType', 'pricePerSqm', 'objectType'];
        $dataChanged = isset($input['data']) || isset($input['sections']);

        foreach ($dataFields as $field) {
            if (array_key_exists($field, $input)) {
                $existingData[$field] = $input[$field];
                $dataChanged = true;
            }
        }

        if (isset($input['data'])) {
            $existingData = array_merge($existingData, $input['data']);
        }

        if (isset($input['sections'])) {
            $existingData = array_merge($existingData, sections_to_flat_data($input['sections']));
        }

        if ($dataChanged) {
            $sets[] = 'data = ?';
            $values[] = json_encode($existingData, JSON_UNESCAPED_UNICODE);
        }
    }

    if (empty($sets)) {
        json_error(400, 'Нет данных для обновления');
    }

    $sets[] = "updated_at = datetime('now')";
    $values[] = $id;

    $sql = 'UPDATE projects SET ' . implode(', ', $sets) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    // Auto-notify client on meaningful update
    $meaningfulUpdate = isset($input['sections']) || isset($input['data']) || $user['role'] === ROLE_VISUALIZER;
    if ($meaningfulUpdate) {
        try {
            $titleStmt = $db->prepare('SELECT title FROM projects WHERE id = ?');
            $titleStmt->execute([$id]);
            $projectTitle = $titleStmt->fetchColumn() ?: 'Проект';
            $author = $user['role'] === ROLE_VISUALIZER ? 'Визуализатор' : 'Дизайнер';

            create_notification($db, [
                'projectId' => $id,
                'recipientRole' => ROLE_CLIENT,
                'type' => 'update',
                'title' => 'Обновление проекта',
                'message' => "$author обновил материалы проекта «$projectTitle»",
                'section' => '',
            ]);
        } catch (Exception $e) {
            // Non-critical
        }
    }

    json_response(200, ['ok' => true]);
}

// ─── Delete Project ────────────────────────────────────────────────────────

function route_delete_project(string $id): void
{
    require_designer();
    $db = get_db();

    $stmt = $db->prepare('SELECT id FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_error(404, 'Проект не найден');
    }

    // Get file IDs before deleting (to clean up disk files)
    $fileStmt = $db->prepare('SELECT id FROM project_files WHERE project_id = ?');
    $fileStmt->execute([$id]);
    $fileIds = $fileStmt->fetchAll(PDO::FETCH_COLUMN);

    $stmt = $db->prepare('DELETE FROM projects WHERE id = ?');
    $stmt->execute([$id]);

    // Clean up orphaned files from disk
    foreach ($fileIds as $fileId) {
        $patterns = glob(UPLOAD_DIR . '/' . $fileId . '.*');
        foreach ($patterns as $filePath) {
            if (is_file($filePath)) {
                @unlink($filePath);
            }
        }
    }

    json_response(200, ['ok' => true]);
}
