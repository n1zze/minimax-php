<?php
/**
 * Mimimax — Database seed (demo data)
 */

require_once __DIR__ . '/helpers.php';

function seed_database(PDO $db): void
{
    // Admin account
    $adminId = uuid();
    $stmt = $db->prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $adminId,
        ADMIN_EMAIL,
        password_hash(ADMIN_PASSWORD, PASSWORD_BCRYPT),
        'designer',
    ]);

    // Demo projects
    $demoPassword = DEMO_PROJECT_PASSWORD;
    $projects = [
        [
            'id' => uuid(),
            'title' => 'Квартира на Тверской',
            'client_name' => 'Анна Смирнова',
            'status' => 'in_progress',
            'data' => [
                'city' => 'Москва',
                'area' => 85,
                'year' => 2025,
                'timeline' => [
                    ['step' => 'Замер', 'date' => '2025-01-10', 'status' => 'done'],
                    ['step' => 'Концепция', 'date' => '2025-02-01', 'status' => 'done'],
                    ['step' => 'Коллажи', 'date' => '2025-03-01', 'status' => 'in_progress'],
                    ['step' => 'Визуализации', 'date' => '2025-04-01', 'status' => 'pending'],
                    ['step' => 'Чертежи', 'date' => '2025-05-01', 'status' => 'pending'],
                    ['step' => 'Спецификация', 'date' => '2025-06-01', 'status' => 'pending'],
                    ['step' => 'Реализация', 'date' => '2025-07-01', 'status' => 'pending'],
                ],
                'contractPdf' => ['title' => 'Договор №001', 'url' => '#'],
                'floorPlan' => ['images' => [], 'videoUrl' => ''],
                'floorPlanApprovalPdf' => ['title' => 'Утверждение планировки', 'url' => '#'],
                'collages' => [],
                'collagesApprovalPdf' => ['title' => 'Утверждение коллажей', 'url' => '#'],
                'visualizations' => [],
                'drawings' => [],
                'drawingsApprovalPdf' => ['title' => 'Утверждение чертежей', 'url' => '#'],
                'specification' => ['items' => []],
                'specificationApprovalPdf' => ['title' => 'Утверждение спецификации', 'url' => '#'],
                'finalProject' => [],
                'authorSupervision' => ['diary' => [], 'reportPdf' => ['title' => '', 'url' => '']],
            ],
        ],
        [
            'id' => uuid(),
            'title' => 'Дом в Подмосковье',
            'client_name' => 'Дмитрий Козлов',
            'status' => 'completed',
            'data' => [
                'city' => 'Подмосковье',
                'area' => 240,
                'year' => 2024,
                'timeline' => [
                    ['step' => 'Замер', 'date' => '2024-01-15', 'status' => 'done'],
                    ['step' => 'Концепция', 'date' => '2024-02-15', 'status' => 'done'],
                    ['step' => 'Коллажи', 'date' => '2024-03-15', 'status' => 'done'],
                    ['step' => 'Визуализации', 'date' => '2024-04-15', 'status' => 'done'],
                    ['step' => 'Чертежи', 'date' => '2024-05-15', 'status' => 'done'],
                    ['step' => 'Спецификация', 'date' => '2024-06-15', 'status' => 'done'],
                    ['step' => 'Реализация', 'date' => '2024-09-15', 'status' => 'done'],
                ],
                'contractPdf' => ['title' => 'Договор №002', 'url' => '#'],
                'floorPlan' => ['images' => [], 'videoUrl' => ''],
                'floorPlanApprovalPdf' => ['title' => '', 'url' => ''],
                'collages' => [],
                'collagesApprovalPdf' => ['title' => '', 'url' => ''],
                'visualizations' => [],
                'drawings' => [],
                'drawingsApprovalPdf' => ['title' => '', 'url' => ''],
                'specification' => ['items' => []],
                'specificationApprovalPdf' => ['title' => '', 'url' => ''],
                'finalProject' => [],
                'authorSupervision' => ['diary' => [], 'reportPdf' => ['title' => '', 'url' => '']],
            ],
        ],
        [
            'id' => uuid(),
            'title' => 'Офис на Пресне',
            'client_name' => 'TechCorp',
            'status' => 'draft',
            'data' => [
                'city' => 'Москва',
                'area' => 120,
                'year' => 2025,
                'timeline' => [],
                'contractPdf' => ['title' => '', 'url' => ''],
                'floorPlan' => ['images' => [], 'videoUrl' => ''],
                'floorPlanApprovalPdf' => ['title' => '', 'url' => ''],
                'collages' => [],
                'collagesApprovalPdf' => ['title' => '', 'url' => ''],
                'visualizations' => [],
                'drawings' => [],
                'drawingsApprovalPdf' => ['title' => '', 'url' => ''],
                'specification' => ['items' => []],
                'specificationApprovalPdf' => ['title' => '', 'url' => ''],
                'finalProject' => [],
                'authorSupervision' => ['diary' => [], 'reportPdf' => ['title' => '', 'url' => '']],
            ],
        ],
    ];

    $stmt = $db->prepare('INSERT INTO projects (id, title, client_name, status, password_hash, visualizer_token, data) VALUES (?, ?, ?, ?, ?, ?, ?)');

    foreach ($projects as $p) {
        $stmt->execute([
            $p['id'],
            $p['title'],
            $p['client_name'],
            $p['status'],
            password_hash($demoPassword, PASSWORD_BCRYPT),
            password_hash('viz-token-' . substr($p['id'], 0, 8), PASSWORD_BCRYPT),
            json_encode($p['data'], JSON_UNESCAPED_UNICODE),
        ]);
    }
}
