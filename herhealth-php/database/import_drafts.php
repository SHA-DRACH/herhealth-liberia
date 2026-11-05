<?php
declare(strict_types=1);

/**
 * Imports researched articles as DRAFTS awaiting clinical review (never published by this script).
 *   php database/import_drafts.php [database/draft-articles-2026-11.json]
 * Safe to run more than once: existing slugs and source keys are skipped.
 */
if (PHP_SAPI !== 'cli') exit("CLI only\n");
require_once dirname(__DIR__) . '/app/bootstrap.php';

function import_draft_articles(string $file): array
{
    $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    $added = 0; $skipped = 0;
    $pdo = Db::pdo();
    $pdo->beginTransaction();
    foreach ($data['categories'] ?? [] as $c) {
        if (!Db::val('SELECT id FROM categories WHERE slug = ?', [$c['slug']])) {
            Db::insert('categories', ['slug' => $c['slug'], 'name' => $c['name'], 'icon' => $c['icon'],
                'sort_order' => (int) Db::val('SELECT COALESCE(MAX(sort_order),0) + 1 FROM categories')]);
        }
    }
    foreach ($data['sources'] as $key => $s) {
        if (!Db::val('SELECT id FROM sources WHERE source_key = ?', [$key])) {
            Db::insert('sources', ['source_key' => $key, 'organization' => $s['org'], 'title' => $s['title'], 'url' => $s['url'],
                'publication_date' => $s['date'] ?? null, 'access_date' => gmdate('Y-m-d'),
                'licence_note' => 'Third-party content: paraphrased with attribution; original licence applies. No endorsement implied.']);
        }
    }
    foreach ($data['articles'] as $a) {
        if (Db::val('SELECT id FROM articles WHERE slug = ?', [$a['slug']])) { $skipped++; continue; }
        $row = ['article_code' => 'HH-ART-TMP' . bin2hex(random_bytes(3)), 'slug' => $a['slug'],
            'category_id' => (int) Db::val('SELECT id FROM categories WHERE slug = ?', [$a['category']]),
            'title' => $a['title'], 'summary' => $a['summary'], 'body' => implode("\n\n", $a['body']),
            'key_points' => implode("\n", $a['keyPoints'] ?? []), 'when_to_get_help' => implode("\n", $a['whenToGetHelp'] ?? []),
            'version' => '0.1', 'content_status' => 'CLINICAL_REVIEW', 'clinical_review_status' => 'PENDING'];
        $id = Db::insert('articles', $row);
        Db::run('UPDATE articles SET article_code = ? WHERE id = ?', [sprintf('HH-ART-%03d', $id), $id]);
        Db::insert('article_versions', ['article_id' => $id, 'version' => '0.1', 'title' => $row['title'], 'summary' => $row['summary'],
            'body' => $row['body'], 'key_points' => $row['key_points'], 'when_to_get_help' => $row['when_to_get_help'],
            'content_status' => 'CLINICAL_REVIEW', 'medically_significant' => 1,
            'change_note' => 'Researched from official sources (' . gmdate('j M Y') . '); draft submitted for clinical review']);
        foreach ($a['sources'] as $sk) {
            Db::insert('article_sources', ['article_id' => $id, 'source_id' => (int) Db::val('SELECT id FROM sources WHERE source_key = ?', [$sk])]);
        }
        foreach ($a['faqs'] ?? [] as $j => $f) {
            Db::insert('knowledge_chunks', ['article_id' => $id, 'question' => $f['q'], 'tags' => $f['tags'] ?? null, 'answer' => $f['a'], 'sort_order' => $j]);
        }
        $added++;
    }
    $pdo->commit();
    return [$added, $skipped];
}

if (realpath($argv[0]) === realpath(__FILE__)) {
    $file = $argv[1] ?? __DIR__ . '/draft-articles-2026-11.json';
    [$added, $skipped] = import_draft_articles($file);
    echo "Draft articles added: $added (already present: $skipped). Status: CLINICAL_REVIEW — not public until approved.\n";
}
