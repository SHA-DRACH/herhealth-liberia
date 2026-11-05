<?php
declare(strict_types=1);

/** Public JSON API. No sessions, no cookies required, same-origin only, rate limited. */
function api_dispatch(string $path, string $method): void
{
    no_store();
    same_origin_check();

    if ($path === '/api/ask' && $method === 'POST') {
        if (!rate_limit('ask', 30, 600)) json_out(['error' => 'Too many questions in a short time. Please wait a few minutes.'], 429);
        $in = json_input();
        $q = is_string($in['question'] ?? null) ? $in['question'] : '';
        $lang = in_array($in['lang'] ?? 'en', array_column(I18n::publicLanguages(), 'code'), true) ? $in['lang'] : 'en';
        $session = is_string($in['session'] ?? null) ? substr($in['session'], 0, 64) : null;
        $res = AskPipeline::run($q, $lang, $session, ($in['mode'] ?? '') === 'VOICE' ? 'VOICE' : 'TEXT');
        json_out($res, isset($res['error']) ? 422 : 200);
    }

    if ($path === '/api/event' && $method === 'POST') {
        if (!rate_limit('event', 300, 600)) json_out(['ok' => false], 429);
        $in = json_input();
        $type = (string) ($in['type'] ?? '');
        if (!in_array($type, Analytics::CLIENT_EVENTS, true)) json_out(['error' => 'Unknown event'], 422);
        $articleId = null;
        if (!empty($in['article'])) $articleId = Db::val('SELECT id FROM articles WHERE slug = ?', [(string) $in['article']]) ?: null;
        Analytics::record($type, [
            'device' => is_string($in['device'] ?? null) ? substr($in['device'], 0, 64) : null,
            'session' => is_string($in['session'] ?? null) ? substr($in['session'], 0, 64) : null,
            'lang' => is_string($in['lang'] ?? null) ? $in['lang'] : null,
            'article' => $articleId ? (int) $articleId : null,
        ]);
        json_out(['ok' => true]);
    }

    if ($path === '/api/feedback' && $method === 'POST') {
        if (!rate_limit('feedback', 20, 600)) json_out(['error' => 'Please wait before sending more feedback.'], 429);
        $in = json_input();
        $target = in_array($in['target'] ?? 'APP', ['ARTICLE', 'ANSWER', 'APP'], true) ? $in['target'] : 'APP';
        $useful = in_array($in['useful'] ?? null, ['YES', 'NO'], true) ? $in['useful'] : null;
        $comment = is_string($in['comment'] ?? null) ? trim(strip_identifiers(mb_substr($in['comment'], 0, 1000))) : '';
        $articleId = !empty($in['article']) ? (Db::val('SELECT id FROM articles WHERE slug = ?', [(string) $in['article']]) ?: null) : null;
        if (!$useful && $comment === '') json_out(['error' => 'Empty feedback'], 422);
        Db::insert('feedback', ['environment' => app_env(), 'target_type' => $target, 'article_id' => $articleId, 'useful' => $useful,
            'comment' => $comment ?: null, 'language_code' => substr((string) ($in['lang'] ?? 'en'), 0, 16)]);
        Analytics::record('feedback_submitted', ['session' => is_string($in['session'] ?? null) ? $in['session'] : null,
            'lang' => (string) ($in['lang'] ?? 'en'), 'meta' => $target]);
        json_out(['ok' => true]);
    }

    if ($path === '/api/facilities' && $method === 'GET') {
        $county = in_array($_GET['county'] ?? '', Content::COUNTIES, true) ? $_GET['county'] : null;
        $rows = Content::facilities($county, null, null);
        json_out(['facilities' => array_map(fn($f) => array_intersect_key($f, array_flip(['id', 'name', 'facility_type', 'county', 'district',
            'location_detail', 'telephone', 'verification_date', 'last_reverified_date', 'services'])), $rows)]);
    }

    if ($path === '/api/impact' && $method === 'GET') {
        $m = Analytics::metrics(Analytics::impactEnvironments());
        unset($m['safety_run']['lexicon_hash'], $m['safety_run']['triggered_by']);
        json_out($m);
    }

    json_out(['error' => 'Not found'], 404);
}
