<?php
declare(strict_types=1);

require __DIR__ . '/entities.php';
require ROOT . '/app/SafetySuite.php';

function admin_dispatch(string $path, string $method): void
{
    admin_session_start();
    no_store();
    $seg = array_values(array_filter(explode('/', trim(substr($path, strlen('/admin')), '/')), 'strlen'));
    $isPost = $method === 'POST';
    if ($isPost) csrf_check();

    $route = $seg[0] ?? '';
    switch ($route) {
        case 'login': admin_login($isPost); return;
        case 'logout': if ($isPost) Auth::logout(); redirect('admin/login');
        case 'password': admin_password($isPost); return;
        case '': admin_dashboard(); return;
        case 'articles': admin_articles($seg, $isPost); return;
        case 'safety': admin_safety($isPost); return;
        case 'analytics': admin_analytics(); return;
        case 'testing': admin_testing(); return;
        case 'settings': admin_settings($isPost); return;
        case 'export': admin_export($seg[1] ?? '', $_GET['format'] ?? 'csv'); return;
        case 'evidence': admin_evidence($_GET['format'] ?? 'md'); return;
        case 'r': admin_resource($seg, $isPost); return;
        default:
            http_response_code(404);
            render('admin/message', ['user' => Auth::require(), 'title' => 'Not found', 'message' => 'This admin page does not exist.'], 'admin');
    }
}

// ------------------------------------------------------------------ authentication

function admin_login(bool $isPost): void
{
    $error = null;
    if ($isPost) {
        $r = Auth::attempt((string) post('email'), (string) ($_POST['password'] ?? ''));
        if ($r === true) redirect('admin');
        $error = $r;
    }
    render('admin/login', ['error' => $error], null);
}

function admin_password(bool $isPost): void
{
    $u = Auth::require();
    $error = null;
    if ($isPost) {
        $row = Db::one('SELECT password_hash FROM admin_users WHERE id = ?', [$u['id']]);
        $new = (string) ($_POST['new_password'] ?? '');
        if (!password_verify((string) ($_POST['current_password'] ?? ''), $row['password_hash'])) $error = 'Your current password is incorrect.';
        elseif ($new !== ($_POST['confirm_password'] ?? '')) $error = 'The new passwords do not match.';
        elseif ($msg = Auth::validPassword($new)) $error = $msg;
        elseif (password_verify($new, $row['password_hash'])) $error = 'Choose a password different from the current one.';
        else {
            Db::run('UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $u['id']]);
            session_regenerate_id(true);
            audit('password_changed', 'admin_user', (string) $u['id']);
            flash('Password changed.');
            redirect('admin');
        }
    }
    render('admin/password', ['user' => $u, 'error' => $error, 'forced' => (bool) $u['must_change_password']], 'admin');
}

// ------------------------------------------------------------------ dashboard + definition of done

function readiness(): array
{
    $v = fn($sql, $p = []) => (int) Db::val($sql, $p);
    $run = Db::one('SELECT * FROM safety_runs ORDER BY id DESC LIMIT 1');
    $articles = $v("SELECT COUNT(*) FROM articles WHERE content_status = 'PUBLISHED'");
    $reviewed = $v("SELECT COUNT(*) FROM articles WHERE content_status = 'PUBLISHED' AND clinical_review_status = 'APPROVED'");
    $tests = Analytics::testingSummary();
    $lir = Db::one("SELECT status FROM languages WHERE code = 'lir-en'");
    return [
        ['Core health content documented as clinically reviewed', $articles > 0 && $reviewed === $articles, "$reviewed / $articles published articles approved"],
        ['Clinical reviewers recorded', $v("SELECT COUNT(*) FROM clinical_reviews WHERE decision = 'APPROVED'") >= 2,
            $v("SELECT COUNT(*) FROM clinical_reviews WHERE decision = 'APPROVED'") . ' approved records · ' . $v("SELECT COUNT(*) FROM clinical_reviews WHERE review_date IS NULL OR license_number IS NULL") . ' missing date/licence'],
        ['Validated AI safety suite passes 100%', $run && $run['passed'] === $run['total'], $run ? "{$run['passed']}/{$run['total']} passed · RED {$run['red_passed']}/{$run['red_total']}" : 'Not run yet'],
        ['Emergency scenarios bypass ordinary AI', $run && $run['red_passed'] === $run['red_total'] && $run['red_total'] > 0, $run ? "RED {$run['red_passed']}/{$run['red_total']}" : 'Not run yet'],
        ['Liberian English validated', in_array($lir['status'] ?? '', ['APPROVED', 'PUBLISHED'], true), 'Status: ' . human_enum($lir['status'] ?? 'missing')],
        ['Real human-recorded audio lessons', $v("SELECT COUNT(*) FROM audio_lessons WHERE status = 'PUBLISHED' AND voice_type = 'HUMAN' AND file_path IS NOT NULL") >= 1,
            $v("SELECT COUNT(*) FROM audio_lessons WHERE status = 'PUBLISHED' AND voice_type = 'HUMAN'") . ' human · ' . $v("SELECT COUNT(*) FROM audio_lessons WHERE status = 'PUBLISHED' AND voice_type = 'DEVICE_TTS'") . ' device-voice'],
        ['Verified referral directory (target 10–20)', $tests['verified_facilities'] >= 10, $tests['verified_facilities'] . ' verified · ' . $v("SELECT COUNT(*) FROM facilities WHERE status = 'PENDING_VERIFICATION'") . ' pending'],
        ['Structured user testing (15–25 adults)', $tests['participants'] >= 15, $tests['participants'] . ' consented sessions recorded'],
        ['Privacy retention periods formally confirmed', Db::setting('retention_confirmed', '0') === '1', 'Settings → retention_confirmed'],
        ['Public metrics exclude development traffic', !in_array('development', Analytics::impactEnvironments(), true), 'Impact shows: ' . implode(', ', Analytics::impactEnvironments())],
        ['Running in a non-development environment', app_env() !== 'development', 'APP_ENV = ' . app_env()],
    ];
}

function admin_dashboard(): void
{
    $u = Auth::require();
    $v = fn($sql) => (int) Db::val($sql);
    $stats = [
        ['Published articles', $v("SELECT COUNT(*) FROM articles WHERE content_status = 'PUBLISHED'"), 'articles', '📖'],
        ['Awaiting clinical review', $v("SELECT COUNT(*) FROM articles WHERE content_status = 'CLINICAL_REVIEW' OR clinical_review_status IN ('PENDING','CHANGES_REQUIRED')"), 'articles?status=CLINICAL_REVIEW', '🩺'],
        ['Verified facilities', $v("SELECT COUNT(*) FROM facilities WHERE status = 'VERIFIED'"), 'r/facilities?f_status=VERIFIED', '📍'],
        ['Facilities to verify', $v("SELECT COUNT(*) FROM facilities WHERE status IN ('PENDING_VERIFICATION','NEEDS_REVERIFICATION')"), 'r/facilities?f_status=PENDING_VERIFICATION', '⏳'],
        ['New feedback', $v("SELECT COUNT(*) FROM feedback WHERE status = 'NEW'"), 'r/feedback?f_status=NEW', '💬'],
        ['Test sessions', $v('SELECT COUNT(*) FROM user_tests'), 'testing', '🧪'],
        ['Proposed safety terms', $v("SELECT COUNT(*) FROM safety_terms WHERE status = 'PROPOSED'"), 'safety', '🛡️'],
        ['AI interactions (all env.)', $v('SELECT COUNT(*) FROM ai_interactions'), 'r/ai-interactions', '🤖'],
    ];
    $recent = Db::all('SELECT l.*, u.full_name FROM audit_logs l LEFT JOIN admin_users u ON u.id = l.admin_id ORDER BY l.id DESC LIMIT 8');
    render('admin/dashboard', ['user' => $u, 'stats' => $stats, 'ready' => readiness(), 'recent' => $recent], 'admin');
}

// ------------------------------------------------------------------ articles: workflow + version control (section 6)

const WORKFLOW = ['DRAFT', 'CLINICAL_REVIEW', 'APPROVED', 'TRANSLATION', 'LANGUAGE_REVIEW', 'PUBLISHED', 'ARCHIVED'];

function bump_version(string $v, bool $major): string
{
    [$a, $b] = array_map('intval', explode('.', $v . '.0'));
    return $major ? ($a + 1) . '.0' : $a . '.' . ($b + 1);
}

function admin_articles(array $seg, bool $isPost): void
{
    $u = Auth::require(['CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'LANGUAGE_REVIEWER', 'ANALYST']);
    $canEdit = Auth::can(['CONTENT_EDITOR']);
    $canClinical = Auth::can(['CLINICAL_REVIEWER']);
    $id = $seg[1] ?? null;

    if ($id === null) {
        $where = []; $p = [];
        if (!empty($_GET['status'])) { $where[] = 'a.content_status = ?'; $p[] = $_GET['status']; }
        if (!empty($_GET['clinical'])) { $where[] = 'a.clinical_review_status = ?'; $p[] = $_GET['clinical']; }
        if (!empty($_GET['category'])) { $where[] = 'a.category_id = ?'; $p[] = $_GET['category']; }
        if (($q = trim((string) ($_GET['q'] ?? ''))) !== '') { $where[] = '(a.title LIKE ? OR a.article_code LIKE ?)'; $p[] = "%$q%"; $p[] = "%$q%"; }
        $rows = Db::all('SELECT a.*, c.name AS category,
                (SELECT GROUP_CONCAT(cr.public_display_name SEPARATOR ", ") FROM article_clinical_reviews x JOIN clinical_reviews cr ON cr.id = x.clinical_review_id
                    WHERE x.article_id = a.id AND x.article_version = a.version AND cr.decision = "APPROVED") AS reviewers,
                (SELECT COUNT(*) FROM article_sources s WHERE s.article_id = a.id) AS source_count,
                (SELECT COUNT(*) FROM knowledge_chunks k WHERE k.article_id = a.id) AS chunk_count
            FROM articles a JOIN categories c ON c.id = a.category_id' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY a.id', $p);
        render('admin/articles', ['user' => $u, 'rows' => $rows, 'canEdit' => $canEdit, 'categories' => Db::all('SELECT id, name FROM categories ORDER BY sort_order')], 'admin');
        return;
    }

    // Upload a file (.docx / .txt / .md / .html) → new DRAFT article that must go through clinical review.
    if ($id === 'import') {
        if (!$isPost || !$canEdit) redirect('admin/articles');
        require_once ROOT . '/app/ArticleImport.php';
        [$parsed, $err] = ArticleImport::fromUpload($_FILES['file'] ?? []);
        $catId = (int) post('category_id');
        if (!$err && !Db::val('SELECT id FROM categories WHERE id = ?', [$catId])) $err = 'Choose a category.';
        if ($err) { flash($err, 'error'); redirect('admin/articles'); }
        $slug = $parsed['slug']; $n = 2;
        while (Db::val('SELECT COUNT(*) FROM articles WHERE slug = ?', [$slug])) $slug = $parsed['slug'] . '-' . $n++;
        $pdo = Db::pdo(); $pdo->beginTransaction();
        $aid = Db::insert('articles', ['article_code' => 'HH-ART-TMP' . bin2hex(random_bytes(3)), 'slug' => $slug, 'category_id' => $catId,
            'title' => $parsed['title'], 'summary' => $parsed['summary'], 'body' => $parsed['body'], 'key_points' => $parsed['key_points'],
            'when_to_get_help' => $parsed['when_to_get_help'], 'version' => '0.1', 'content_status' => 'DRAFT', 'clinical_review_status' => 'NOT_REVIEWED']);
        Db::run('UPDATE articles SET article_code = ? WHERE id = ?', [sprintf('HH-ART-%03d', $aid), $aid]);
        if ($sid = (int) post('source_id')) Db::insert('article_sources', ['article_id' => $aid, 'source_id' => $sid]);
        $name = basename((string) ($_FILES['file']['name'] ?? 'file'));
        Db::insert('article_versions', ['article_id' => $aid, 'version' => '0.1', 'title' => $parsed['title'], 'summary' => $parsed['summary'],
            'body' => $parsed['body'], 'key_points' => $parsed['key_points'], 'when_to_get_help' => $parsed['when_to_get_help'],
            'content_status' => 'DRAFT', 'medically_significant' => 1, 'change_note' => 'Imported from uploaded file ' . mb_substr($name, 0, 120), 'created_by' => $u['id']]);
        $pdo->commit();
        audit('import', 'article', (string) $aid, $name);
        flash('Imported as a draft. Check the text, add its sources, then submit it for clinical review. It is not public until a nurse approves it.');
        redirect('admin/articles/' . $aid);
    }

    $article = $id === 'new' ? null : Db::one('SELECT * FROM articles WHERE id = ?', [(int) $id]);
    if ($id !== 'new' && !$article) { flash('Article not found.', 'error'); redirect('admin/articles'); }
    $error = null;

    if ($isPost) {
        $action = (string) post('action', 'save');
        $aid = $article ? (int) $article['id'] : 0;

        if ($action === 'save' && $canEdit) {
            $data = [
                'title' => mb_substr((string) post('title'), 0, 200), 'summary' => mb_substr((string) post('summary'), 0, 500),
                'body' => (string) post('body'), 'key_points' => (string) post('key_points'), 'when_to_get_help' => (string) post('when_to_get_help'),
                'category_id' => (int) post('category_id'), 'slug' => preg_replace('/[^a-z0-9-]/', '', strtolower((string) post('slug'))),
                'is_priority_audio' => post('is_priority_audio') ? 1 : 0,
            ];
            $sources = array_map('intval', (array) ($_POST['sources'] ?? []));
            $significant = (bool) post('medically_significant');
            $note = mb_substr((string) post('change_note'), 0, 500);
            if (!$data['title'] || !$data['summary'] || !$data['body'] || !$data['slug'] || !$data['category_id']) $error = 'Title, slug, category, summary and body are required.';
            elseif (Db::val('SELECT COUNT(*) FROM articles WHERE slug = ? AND id <> ?', [$data['slug'], $aid])) $error = 'Another article already uses this slug.';
            elseif ($article && $note === '') $error = 'Describe what changed (change note) — it is kept in the version history.';
            if (!$error) {
                $pdo = Db::pdo(); $pdo->beginTransaction();
                if (!$article) {
                    $data['article_code'] = sprintf('HH-ART-%03d', (int) Db::val('SELECT COALESCE(MAX(id),0) + 1 FROM articles'));
                    $data['version'] = '0.1'; $data['content_status'] = 'DRAFT'; $data['clinical_review_status'] = 'NOT_REVIEWED';
                    $aid = Db::insert('articles', $data);
                    $note = $note ?: 'Created';
                    $significant = true;
                } else {
                    $contentChanged = false;
                    foreach (['title', 'summary', 'body', 'key_points', 'when_to_get_help'] as $f) if (trim((string) $article[$f]) !== trim($data[$f])) $contentChanged = true;
                    if ($contentChanged) {
                        $data['version'] = bump_version($article['version'], $significant);
                        if ($significant && in_array($article['clinical_review_status'], ['APPROVED', 'PENDING', 'CHANGES_REQUIRED'], true)) {
                            // Medically significant change: requires clinical re-review; withdrawn from the knowledge base.
                            $data['content_status'] = 'CLINICAL_REVIEW';
                            $data['clinical_review_status'] = 'PENDING';
                        } elseif ($article['clinical_review_status'] === 'APPROVED') {
                            // Editorial change: approval carried forward to the new version, recorded in the audit trail.
                            Db::run('INSERT IGNORE INTO article_clinical_reviews (article_id, clinical_review_id, article_version)
                                SELECT article_id, clinical_review_id, ? FROM article_clinical_reviews WHERE article_id = ? AND article_version = ?',
                                [$data['version'], $aid, $article['version']]);
                        }
                    }
                    Db::update('articles', $data, 'id', $aid);
                }
                Db::run('DELETE FROM article_sources WHERE article_id = ?', [$aid]);
                foreach ($sources as $sid) Db::insert('article_sources', ['article_id' => $aid, 'source_id' => $sid]);
                $cur = Db::one('SELECT * FROM articles WHERE id = ?', [$aid]);
                if (!$article || ($cur['version'] !== $article['version'])) {
                    Db::insert('article_versions', ['article_id' => $aid, 'version' => $cur['version'], 'title' => $cur['title'], 'summary' => $cur['summary'],
                        'body' => $cur['body'], 'key_points' => $cur['key_points'], 'when_to_get_help' => $cur['when_to_get_help'],
                        'content_status' => $cur['content_status'], 'medically_significant' => $significant ? 1 : 0, 'change_note' => $note, 'created_by' => $u['id']]);
                }
                $pdo->commit();
                audit($article ? 'update' : 'create', 'article', (string) $aid, "v{$cur['version']} " . ($significant ? '[medically significant] ' : '') . $note);
                flash($article && $cur['content_status'] === 'CLINICAL_REVIEW' && $article['content_status'] !== 'CLINICAL_REVIEW'
                    ? "Saved as version {$cur['version']}. Medically significant change: the article is back in clinical review and removed from the public site and the AI knowledge base until re-approved."
                    : "Saved (version {$cur['version']}).");
                redirect('admin/articles/' . $aid);
            }
        }

        if ($action === 'approve' && $canClinical && $article) {
            $reviews = array_map('intval', (array) ($_POST['reviews'] ?? []));
            $valid = $reviews ? (int) Db::val('SELECT COUNT(*) FROM clinical_reviews WHERE decision = "APPROVED" AND id IN (' . implode(',', $reviews) . ')') : 0;
            if (!$valid) $error = 'Select at least one APPROVED clinical review record.';
            elseif (!Db::val('SELECT COUNT(*) FROM article_sources WHERE article_id = ?', [$article['id']])) $error = 'Add at least one source before clinical approval.';
            else {
                foreach ($reviews as $rid) Db::run('REPLACE INTO article_clinical_reviews (article_id, clinical_review_id, article_version) VALUES (?,?,?)', [$article['id'], $rid, $article['version']]);
                Db::update('articles', ['clinical_review_status' => 'APPROVED', 'content_status' => 'APPROVED',
                    'clinical_review_date' => post('review_date') ?: null], 'id', $article['id']);
                audit('clinical_approve', 'article', (string) $article['id'], 'v' . $article['version'] . ' reviews: ' . implode(',', $reviews));
                flash('Clinical approval recorded. The article can now be translated or published.');
                redirect('admin/articles/' . $article['id']);
            }
        }

        if ($action === 'changes' && $canClinical && $article) {
            Db::update('articles', ['clinical_review_status' => 'CHANGES_REQUIRED', 'content_status' => 'DRAFT'], 'id', $article['id']);
            audit('clinical_changes_required', 'article', (string) $article['id'], (string) post('comment'));
            flash('Marked as changes required.');
            redirect('admin/articles/' . $article['id']);
        }

        if ($action === 'status' && $article) {
            $to = (string) post('to');
            $allowed = in_array($to, WORKFLOW, true);
            if (!$allowed) $error = 'Unknown status.';
            elseif ($to === 'CLINICAL_REVIEW' && !$canEdit) $error = 'Only content editors can submit for review.';
            elseif (in_array($to, ['APPROVED'], true)) $error = 'Use “Record clinical approval” to approve.';
            elseif (in_array($to, ['TRANSLATION', 'LANGUAGE_REVIEW', 'PUBLISHED'], true) && $article['clinical_review_status'] !== 'APPROVED') $error = 'Only clinically approved content can move to translation or be published.';
            elseif ($to === 'PUBLISHED' && !$canEdit) $error = 'Only content editors can publish.';
            else {
                if ($to === 'CLINICAL_REVIEW' && $article['clinical_review_status'] !== 'APPROVED') Db::update('articles', ['clinical_review_status' => 'PENDING'], 'id', $article['id']);
                Db::update('articles', ['content_status' => $to], 'id', $article['id']);
                audit('status', 'article', (string) $article['id'], $article['content_status'] . ' → ' . $to);
                flash('Status changed to ' . human_enum($to) . '.');
                redirect('admin/articles/' . $article['id']);
            }
        }

        if ($action === 'delete' && $canEdit && $article) {
            if ($article['content_status'] === 'PUBLISHED') $error = 'Archive a published article instead of deleting it.';
            else {
                Db::run('DELETE FROM articles WHERE id = ?', [$article['id']]);
                audit('delete', 'article', (string) $article['id'], $article['title']);
                flash('Article deleted.');
                redirect('admin/articles');
            }
        }
        if (!$error) $error = 'You do not have permission for that action.';
    }

    $aid = $article['id'] ?? 0;
    render('admin/article_edit', [
        'user' => $u, 'a' => $article, 'error' => $error, 'canEdit' => $canEdit, 'canClinical' => $canClinical,
        'categories' => Db::all('SELECT id, name FROM categories ORDER BY sort_order'),
        'sources' => Db::all('SELECT id, organization, title FROM sources ORDER BY organization, title'),
        'selectedSources' => array_column(Db::all('SELECT source_id FROM article_sources WHERE article_id = ?', [$aid]), 'source_id'),
        'reviews' => Db::all('SELECT id, reviewer_full_name, public_display_name, decision FROM clinical_reviews ORDER BY id'),
        'linked' => Db::all('SELECT x.*, cr.public_display_name, cr.reviewer_full_name, cr.decision FROM article_clinical_reviews x
            JOIN clinical_reviews cr ON cr.id = x.clinical_review_id WHERE x.article_id = ? ORDER BY x.linked_at', [$aid]),
        'versions' => Db::all('SELECT v.*, u.full_name FROM article_versions v LEFT JOIN admin_users u ON u.id = v.created_by WHERE v.article_id = ? ORDER BY v.id DESC', [$aid]),
        'chunks' => Db::all('SELECT id, question FROM knowledge_chunks WHERE article_id = ? ORDER BY sort_order', [$aid]),
        'translations' => Db::all('SELECT t.id, t.language_code, t.status, t.source_article_version FROM article_translations t WHERE t.article_id = ?', [$aid]),
        'audio' => Db::all('SELECT id, language_code, voice_type, status FROM audio_lessons WHERE article_id = ?', [$aid]),
    ], 'admin');
}

// ------------------------------------------------------------------ generic resources (CRUD)

function entity_or_404(string $slug): array
{
    $E = admin_entities();
    if (!isset($E[$slug])) { http_response_code(404); exit('Unknown resource'); }
    return $E[$slug] + ['pk' => 'id', 'create' => true, 'delete' => true, 'view_roles' => [], 'search' => [], 'filters' => [], 'readonly' => false];
}

function fk_options(array $f): array
{
    return array_column(Db::all($f['sql']), 'label', 'id');
}

function admin_resource(array $seg, bool $isPost): void
{
    $slug = $seg[1] ?? '';
    $cfg = entity_or_404($slug);
    $u = Auth::require(array_merge($cfg['roles'], $cfg['view_roles']));
    $canEdit = !$cfg['readonly'] && Auth::can($cfg['roles']);
    $table = $cfg['table']; $pk = $cfg['pk'];
    $id = $seg[2] ?? null;

    if ($id === null) {
        [$where, $p] = resource_where($cfg);
        $page = max(1, (int) ($_GET['page'] ?? 1)); $per = 50;
        $total = (int) Db::val("SELECT COUNT(*) FROM `$table`$where", $p);
        $rows = Db::all("SELECT * FROM `$table`$where ORDER BY {$cfg['order']} LIMIT $per OFFSET " . (($page - 1) * $per), $p);
        render('admin/list', ['user' => $u, 'slug' => $slug, 'cfg' => $cfg, 'rows' => $rows, 'total' => $total, 'page' => $page, 'per' => $per, 'canEdit' => $canEdit], 'admin');
        return;
    }

    $row = $id === 'new' ? null : Db::one("SELECT * FROM `$table` WHERE `$pk` = ?", [$id]);
    if ($id !== 'new' && !$row) { flash('Record not found.', 'error'); redirect("admin/r/$slug"); }
    if ($id === 'new' && (!$cfg['create'] || !$canEdit)) redirect("admin/r/$slug");
    $error = null;

    if ($isPost && $canEdit) {
        if (post('action') === 'delete') {
            if (!$cfg['delete'] || !$row) $error = 'This record cannot be deleted.';
            elseif (isset($cfg['delete_check']) && ($msg = $cfg['delete_check']($row[$pk]))) $error = $msg;
            else {
                Db::run("DELETE FROM `$table` WHERE `$pk` = ?", [$row[$pk]]);
                if (!empty($row['file_path'])) @unlink(ROOT . '/public/uploads/audio/' . basename($row['file_path']));
                audit('delete', $slug, (string) $row[$pk], json_encode(array_diff_key($row, ['password_hash' => 1]), JSON_UNESCAPED_UNICODE));
                flash(ucfirst($cfg['singular']) . ' deleted.');
                redirect("admin/r/$slug");
            }
        } else {
            [$data, $error] = collect_fields($cfg, $row);
            if (!$error && isset($cfg['validate'])) $error = $cfg['validate']($data + ($row ?? []), $row);
            if (!$error) {
                try {
                    $pdo = Db::pdo(); $pdo->beginTransaction();
                    if ($row) { Db::update($table, $data, $pk, $row[$pk]); $newId = $row[$pk]; }
                    else { $newId = Db::insert($table, $data); if ($pk !== 'id') $newId = $data[$pk]; }
                    if (!empty($cfg['services'])) save_services((int) $newId);
                    if (!empty($cfg['tasks'])) save_tasks((int) $newId);
                    if (isset($cfg['after_save'])) $cfg['after_save']((int) $newId, $data + ($row ?? []), $row);
                    $pdo->commit();
                    $changed = $row ? array_keys(array_diff_assoc(array_map('strval', array_intersect_key($data, $row)), array_map('strval', array_intersect_key($row, $data)))) : array_keys($data);
                    audit($row ? 'update' : 'create', $slug, (string) $newId, 'fields: ' . implode(', ', array_diff($changed, ['password_hash'])));
                    flash(ucfirst($cfg['singular']) . ' saved.');
                    redirect("admin/r/$slug/" . rawurlencode((string) $newId));
                } catch (PDOException $e) {
                    if (Db::pdo()->inTransaction()) Db::pdo()->rollBack();
                    $error = str_contains($e->getMessage(), 'Duplicate') ? 'A record with the same unique value already exists.' : 'Could not save: ' . (DEBUG ? $e->getMessage() : 'database error.');
                }
            }
            $row = array_merge($row ?? [], $data ?? [], $_POST);
        }
    }

    $extra = [];
    if (!empty($cfg['services'])) $extra['services'] = $row && isset($row['id']) ? array_column(Db::all('SELECT service, verified FROM facility_services WHERE facility_id = ?', [$row['id']]), 'verified', 'service') : [];
    if (!empty($cfg['tasks'])) $extra['tasks'] = $row && isset($row['id']) ? array_column(Db::all('SELECT * FROM user_test_tasks WHERE user_test_id = ?', [$row['id']]), null, 'task_no') : [];
    render('admin/form', ['user' => $u, 'slug' => $slug, 'cfg' => $cfg, 'row' => $row, 'isNew' => $id === 'new', 'canEdit' => $canEdit, 'error' => $error] + $extra, 'admin');
}

function resource_where(array $cfg): array
{
    $w = []; $p = [];
    if (($q = trim((string) ($_GET['q'] ?? ''))) !== '' && $cfg['search']) {
        $w[] = '(' . implode(' OR ', array_map(fn($c) => "`$c` LIKE ?", $cfg['search'])) . ')';
        foreach ($cfg['search'] as $_) $p[] = '%' . $q . '%';
    }
    foreach ($cfg['filters'] as $f) {
        $v = $_GET['f_' . $f] ?? '';
        if ($v !== '') { $w[] = "`$f` = ?"; $p[] = $v; }
    }
    return [$w ? ' WHERE ' . implode(' AND ', $w) : '', $p];
}

function collect_fields(array $cfg, ?array $row): array
{
    $data = [];
    foreach ($cfg['fields'] as $name => $f) {
        $type = $f[1];
        if ($type === 'readonly' || !empty($f['virtual'])) continue;
        if (!empty($f['create_only']) && $row) continue;
        if ($type === 'password') {
            $pw = (string) ($_POST[$name] ?? '');
            if ($pw !== '') {
                if ($msg = Auth::validPassword($pw)) return [[], $msg];
                $data['password_hash'] = password_hash($pw, PASSWORD_DEFAULT);
            } elseif (!$row) return [[], 'Set an initial password for the new user.'];
            continue;
        }
        if ($type === 'file') {
            [$file, $err] = handle_audio_upload($name);
            if ($err) return [[], $err];
            if ($file) {
                if (!empty($row['file_path'])) @unlink(ROOT . '/public/uploads/audio/' . basename($row['file_path']));
                $data += $file;
            }
            continue;
        }
        $v = $_POST[$name] ?? null;
        if ($type === 'bool') { $data[$name] = $v ? 1 : 0; continue; }
        $v = is_string($v) ? trim($v) : $v;
        if ($v === '' || $v === null) {
            if (!empty($f['required'])) return [[], "“{$f[0]}” is required."];
            $data[$name] = null; continue;
        }
        switch ($type) {
            case 'int': if (!preg_match('/^-?\d+$/', $v)) return [[], "“{$f[0]}” must be a whole number."]; $data[$name] = (int) $v; break;
            case 'decimal': if (!is_numeric($v)) return [[], "“{$f[0]}” must be a number."]; $data[$name] = (float) $v; break;
            case 'date': if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) || !strtotime($v)) return [[], "“{$f[0]}” must be a date."]; $data[$name] = $v; break;
            case 'email': if (!filter_var($v, FILTER_VALIDATE_EMAIL)) return [[], "“{$f[0]}” must be an e-mail address."]; $data[$name] = strtolower($v); break;
            case 'url': if (!filter_var($v, FILTER_VALIDATE_URL) || !preg_match('#^https?://#', $v)) return [[], "“{$f[0]}” must be a web address."]; $data[$name] = $v; break;
            case 'select': if (!array_key_exists($v, $f['options'])) return [[], "Choose a valid “{$f[0]}”."]; $data[$name] = $v; break;
            case 'fk': if (!array_key_exists($v, fk_options($f))) return [[], "Choose a valid “{$f[0]}”."]; $data[$name] = $v; break;
            default: $data[$name] = mb_substr((string) $v, 0, $type === 'textarea' ? 60000 : 500);
        }
    }
    return [$data, null];
}

function handle_audio_upload(string $name): array
{
    if (empty($_FILES[$name]) || $_FILES[$name]['error'] === UPLOAD_ERR_NO_FILE) return [null, null];
    $f = $_FILES[$name];
    if ($f['error'] !== UPLOAD_ERR_OK) return [null, 'Upload failed (code ' . $f['error'] . ').'];
    if ($f['size'] > 8 * 1024 * 1024) return [null, 'Audio file is larger than 8 MB. Compress it (32–64 kbps mono) and try again.'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['audio/mpeg' => 'mp3', 'audio/mp3' => 'mp3', 'audio/mp4' => 'm4a', 'audio/x-m4a' => 'm4a', 'audio/ogg' => 'ogg', 'audio/opus' => 'opus', 'audio/webm' => 'webm', 'video/webm' => 'webm'][$mime] ?? null;
    if (!$ext) return [null, "Unsupported file type ($mime). Use MP3, M4A, OGG/Opus or WebM audio."];
    $file = bin2hex(random_bytes(12)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], ROOT . '/public/uploads/audio/' . $file)) return [null, 'Could not store the file.'];
    return [['file_path' => $file, 'mime_type' => $mime, 'size_bytes' => (int) $f['size']], null];
}

function save_services(int $facilityId): void
{
    Db::run('DELETE FROM facility_services WHERE facility_id = ?', [$facilityId]);
    foreach ((array) ($_POST['services'] ?? []) as $s) {
        if (!array_key_exists($s, Content::SERVICES)) continue;
        Db::insert('facility_services', ['facility_id' => $facilityId, 'service' => $s, 'verified' => !empty($_POST['service_verified'][$s]) ? 1 : 0]);
    }
}

const TEST_TASKS = [
    1 => 'Find information about when someone should seek help for menstrual-health problems',
    2 => 'Listen to a health article',
    3 => 'Ask HerHealth a reproductive-health question',
    4 => 'Find a health service',
    5 => 'Change application language',
];

function save_tasks(int $testId): void
{
    Db::run('DELETE FROM user_test_tasks WHERE user_test_id = ?', [$testId]);
    foreach (TEST_TASKS as $n => $_) {
        $t = $_POST['task'][$n] ?? [];
        Db::insert('user_test_tasks', ['user_test_id' => $testId, 'task_no' => $n, 'attempted' => !empty($t['attempted']) ? 1 : 0,
            'completed' => !empty($t['completed']) ? 1 : 0, 'seconds' => ($t['seconds'] ?? '') !== '' ? max(0, (int) $t['seconds']) : null,
            'errors' => max(0, (int) ($t['errors'] ?? 0))]);
    }
}

// ------------------------------------------------------------------ export / download

function admin_export(string $slug, string $format): void
{
    if ($slug === 'articles') {
        Auth::require(['CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'LANGUAGE_REVIEWER', 'ANALYST']);
        $rows = Db::all('SELECT a.article_code, a.slug, c.name AS category, a.title, a.summary, a.version, a.content_status, a.clinical_review_status,
                a.clinical_review_date, (SELECT GROUP_CONCAT(cr.public_display_name SEPARATOR "; ") FROM article_clinical_reviews x
                    JOIN clinical_reviews cr ON cr.id = x.clinical_review_id WHERE x.article_id = a.id AND x.article_version = a.version) AS clinical_reviewers,
                (SELECT GROUP_CONCAT(CONCAT(s.organization, ": ", s.title, " <", s.url, ">") SEPARATOR " | ") FROM article_sources x JOIN sources s ON s.id = x.source_id WHERE x.article_id = a.id) AS sources,
                a.updated_at AS last_updated FROM articles a JOIN categories c ON c.id = a.category_id ORDER BY a.id');
        output_export('herhealth-articles', $rows, $format);
    }
    if ($slug === 'safety-run') {
        Auth::require(['CLINICAL_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']);
        $runId = (int) ($_GET['run'] ?? Db::val('SELECT MAX(id) FROM safety_runs'));
        $rows = Db::all('SELECT r.run_id, c.code, c.category, c.question, c.expected_risk, c.also_acceptable_risk, c.expected_pathways,
                r.actual_risk, r.actual_pathway, IF(r.passed, "PASS", "FAIL") AS result, r.detail, c.clinical_status
            FROM safety_results r JOIN safety_cases c ON c.id = r.case_id WHERE r.run_id = ? ORDER BY c.code', [$runId]);
        output_export("herhealth-safety-run-$runId", $rows, $format);
    }
    $cfg = entity_or_404($slug);
    Auth::require(array_merge($cfg['roles'], $cfg['view_roles']));
    $cols = [$cfg['pk']];
    foreach ($cfg['fields'] as $n => $f) if (!in_array($f[1], ['password', 'file'], true) && empty($f['virtual']) && $n !== $cfg['pk']) $cols[] = $n;
    if ($slug === 'clinical-reviews' && !Auth::can(['CLINICAL_REVIEWER'])) $cols = array_diff($cols, ['license_number']);
    [$where, $p] = resource_where($cfg);
    $rows = Db::all('SELECT ' . implode(',', array_map(fn($c) => "`$c`", $cols)) . " FROM `{$cfg['table']}`$where ORDER BY {$cfg['order']}", $p);
    if ($slug === 'user-tests') {
        foreach ($rows as &$r) foreach (Db::all('SELECT * FROM user_test_tasks WHERE user_test_id = ? ORDER BY task_no', [$r['id']]) as $t) {
            $r["task{$t['task_no']}_completed"] = $t['attempted'] ? ($t['completed'] ? 'yes' : 'no') : 'not attempted';
            $r["task{$t['task_no']}_seconds"] = $t['seconds'];
        }
        unset($r);
    }
    audit('export', $slug, null, "format=$format rows=" . count($rows));
    output_export('herhealth-' . $slug, $rows, $format);
}

function output_export(string $name, array $rows, string $format): void
{
    $file = $name . '-' . date('Y-m-d');
    if ($format === 'json') {
        header('Content-Type: application/json; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"$file.json\"");
        echo json_encode(['exported_at' => gmdate('c'), 'environment' => app_env(), 'count' => count($rows), 'rows' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"$file.csv\"");
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel opens accents/emoji correctly
    if ($rows) {
        fputcsv($out, array_keys($rows[0]));
        foreach ($rows as $r) {
            // Neutralise spreadsheet formula injection
            fputcsv($out, array_map(fn($v) => is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v, $r));
        }
    }
    fclose($out);
    exit;
}

/** Section 22 evidence package: only measured numbers from the database. */
function admin_evidence(string $format): void
{
    Auth::require(['ANALYST', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER']);
    $t = Analytics::testingSummary();
    $run = $t['safety_run'];
    $m = Analytics::metrics(Analytics::impactEnvironments());
    $data = [
        'generated_at' => gmdate('c'),
        'adult_participants' => $t['participants'],
        'tasks_attempted' => $t['tasks_attempted'],
        'successful_completion_pct' => $t['completion_pct'],
        'information_understandable_pct' => $t['understandable_pct'],
        'prototype_useful_pct' => $t['useful_pct'],
        'ai_safety_scenarios_passed' => $run ? "{$run['passed']}/{$run['total']}" : null,
        'red_emergency_scenarios_passed' => $run ? "{$run['red_passed']}/{$run['red_total']}" : null,
        'languages_tested' => $t['languages_tested'],
        'verified_facilities' => $t['verified_facilities'],
        'clinically_reviewed_articles' => (int) Db::val("SELECT COUNT(*) FROM articles WHERE clinical_review_status = 'APPROVED' AND content_status = 'PUBLISHED'"),
        'impact_metrics' => array_diff_key($m, ['safety_run' => 1]),
        'per_task' => $t['per_task'],
        'changes_made_because_of_testing' => Db::all('SELECT change_date, finding, change_made FROM testing_changes ORDER BY change_date'),
    ];
    audit('export', 'evidence', null, "format=$format");
    if ($format === 'json') output_export('herhealth-evidence', [$data], 'json');
    $na = fn($v, $s = '') => $v === null ? 'not yet measured' : $v . $s;
    $md = "# HerHealth Liberia — testing evidence summary\n\nGenerated " . gmdate('j M Y H:i') . " UTC from recorded data only.\n\n"
        . "| Measure | Result |\n|---|---|\n"
        . "| Adult participants | {$data['adult_participants']} |\n| Tasks attempted | {$data['tasks_attempted']} |\n"
        . '| Successful completion | ' . $na($data['successful_completion_pct'], '%') . " |\n| Information understandable | " . $na($data['information_understandable_pct'], '%') . " |\n"
        . '| Prototype useful | ' . $na($data['prototype_useful_pct'], '%') . " |\n| AI safety scenarios passed | " . $na($data['ai_safety_scenarios_passed']) . " |\n"
        . '| RED emergency scenarios passed | ' . $na($data['red_emergency_scenarios_passed']) . " |\n| Languages tested | {$data['languages_tested']} |\n"
        . "| Verified facilities | {$data['verified_facilities']} |\n| Clinically reviewed articles | {$data['clinically_reviewed_articles']} |\n\n## Changes made because of testing\n\n";
    foreach ($data['changes_made_because_of_testing'] as $c) $md .= "- **Finding:** {$c['finding']} → **Change:** {$c['change_made']}" . ($c['change_date'] ? " ({$c['change_date']})" : '') . "\n";
    if (!$data['changes_made_because_of_testing']) $md .= "_None recorded yet._\n";
    header('Content-Type: text/markdown; charset=utf-8');
    header('Content-Disposition: attachment; filename="herhealth-evidence-' . date('Y-m-d') . '.md"');
    echo $md;
    exit;
}

// ------------------------------------------------------------------ AI safety review

function admin_safety(bool $isPost): void
{
    $u = Auth::require(['CLINICAL_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']);
    if ($isPost && post('action') === 'run' && Auth::can(['CLINICAL_REVIEWER', 'CONTENT_EDITOR'])) {
        $r = SafetySuite::run($u['email']);
        $lines = [];
        foreach ($r['rows'] as $row) $lines[] = ($row['passed'] ? 'PASS ' : 'FAIL ') . $row['case']['code'] . ' ' . $row['pathway'] . ' ' . $row['risk'] . ($row['detail'] ? ' <- ' . $row['detail'] : '');
        @file_put_contents(ROOT . '/storage/evidence/safety-run-' . $r['run_id'] . '-' . gmdate('Ymd-His') . '.txt',
            "Run #{$r['run_id']} {$r['passed']}/{$r['total']} RED {$r['red_passed']}/{$r['red_total']} by {$u['email']}\n" . implode("\n", $lines) . "\n");
        audit('safety_suite_run', 'safety_run', (string) $r['run_id'], "{$r['passed']}/{$r['total']} RED {$r['red_passed']}/{$r['red_total']}");
        flash("Safety suite run #{$r['run_id']}: {$r['passed']}/{$r['total']} passed, RED {$r['red_passed']}/{$r['red_total']} escalated.");
        redirect('admin/safety');
    }
    if ($isPost && post('action') === 'decide' && Auth::can(['CLINICAL_REVIEWER'])) {
        $term = Db::one("SELECT * FROM safety_terms WHERE id = ? AND status = 'PROPOSED'", [(int) post('term_id')]);
        $decision = (string) post('decision');
        $by = trim((string) post('decided_by')); $on = (string) post('decided_at'); $note = trim((string) post('note'));
        if (!$term || !in_array($decision, ['AMBER', 'RED', 'REJECT'], true) || $by === '' || !strtotime($on)) {
            flash('Choose a decision and record which registered nurse decided and when.', 'error');
        } else {
            Db::update('safety_terms', ['status' => $decision === 'REJECT' ? 'REJECTED' : 'CLINICALLY_VALIDATED',
                'level' => $decision === 'REJECT' ? $term['level'] : $decision, 'decided_by' => $by, 'decided_at' => $on,
                'rationale' => trim($term['rationale'] . "\nDecision: " . $decision . ($note ? " — $note" : ''))], 'id', $term['id']);
            audit('clinical_safety_decision', 'safety_term', (string) $term['id'], "{$term['term']}: $decision by $by on $on. $note");
            flash('Decision recorded. Update the related test case’s clinical status and expected result if the nurses changed it, then re-run the suite.');
        }
        redirect('admin/safety');
    }
    $run = Db::one('SELECT * FROM safety_runs ORDER BY id DESC LIMIT 1');
    render('admin/safety', ['user' => $u, 'run' => $run,
        'results' => $run ? Db::all('SELECT r.*, c.code, c.category, c.question, c.expected_risk, c.expected_pathways, c.clinical_status, c.id AS case_id
            FROM safety_results r JOIN safety_cases c ON c.id = r.case_id WHERE r.run_id = ? ORDER BY r.passed, c.code', [$run['id']]) : [],
        'history' => Db::all('SELECT * FROM safety_runs ORDER BY id DESC LIMIT 10'),
        'proposed' => Db::all("SELECT * FROM safety_terms WHERE status = 'PROPOSED' ORDER BY id"),
        'awaiting' => Db::all("SELECT * FROM safety_cases WHERE clinical_status = 'AWAITING_CLINICAL_DECISION'"),
        'reviewers' => Db::all("SELECT public_display_name, reviewer_full_name FROM clinical_reviews WHERE decision = 'APPROVED'"),
        'pathways' => Db::all('SELECT pathway, environment, COUNT(*) AS n FROM ai_interactions GROUP BY pathway, environment ORDER BY n DESC'),
        'flags' => (int) Db::val('SELECT COUNT(*) FROM ai_interactions WHERE postcheck_flag IS NOT NULL'),
    ], 'admin');
}

// ------------------------------------------------------------------ analytics

function admin_analytics(): void
{
    $u = Auth::require(['ANALYST', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER']);
    $all = ['development', 'testing', 'pilot', 'production'];
    $envs = array_values(array_intersect((array) ($_GET['env'] ?? Analytics::impactEnvironments()), $all)) ?: Analytics::impactEnvironments();
    $in = implode(',', array_fill(0, count($envs), '?'));
    render('admin/analytics', ['user' => $u, 'envs' => $envs, 'all' => $all, 'm' => Analytics::metrics($envs),
        'byEnv' => Db::all('SELECT environment, event_type, COUNT(*) AS n FROM events GROUP BY environment, event_type ORDER BY environment, event_type'),
        'daily' => Db::all("SELECT DATE(created_at) AS d, COUNT(*) AS n FROM events WHERE environment IN ($in) AND created_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY GROUP BY d ORDER BY d", $envs),
        'topArticles' => Db::all("SELECT a.title, COUNT(*) AS n FROM events e JOIN articles a ON a.id = e.article_id WHERE e.environment IN ($in) AND e.event_type = 'article_view' GROUP BY a.id ORDER BY n DESC LIMIT 10", $envs),
        'pathways' => Db::all("SELECT pathway, COUNT(*) AS n FROM ai_interactions WHERE environment IN ($in) GROUP BY pathway ORDER BY n DESC", $envs),
        'langs' => Db::all("SELECT language_code, input_mode, COUNT(*) AS n FROM ai_interactions WHERE environment IN ($in) GROUP BY language_code, input_mode", $envs),
    ], 'admin');
}

function admin_testing(): void
{
    $u = Auth::require(['ANALYST', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER']);
    render('admin/testing', ['user' => $u, 't' => Analytics::testingSummary(), 'tasks' => TEST_TASKS,
        'sessions' => Db::all('SELECT * FROM user_tests ORDER BY test_date DESC, participant_code LIMIT 30'),
        'changes' => Db::all('SELECT * FROM testing_changes ORDER BY change_date DESC')], 'admin');
}

// ------------------------------------------------------------------ settings

function admin_settings(bool $isPost): void
{
    $u = Auth::require([]);
    if ($isPost) {
        foreach (Db::all('SELECT skey FROM settings') as $s) {
            if (!array_key_exists('s_' . $s['skey'], $_POST)) continue;
            $val = trim((string) $_POST['s_' . $s['skey']]);
            $old = Db::setting($s['skey']);
            if ($s['skey'] === 'impact_environments') {
                $val = implode(',', array_intersect(array_map('trim', explode(',', $val)), ['development', 'testing', 'pilot', 'production'])) ?: 'testing,pilot';
            }
            if ($s['skey'] === 'quick_exit_url' && !preg_match('#^https?://#', $val)) $val = 'https://www.google.com/';
            Db::run('UPDATE settings SET svalue = ? WHERE skey = ?', [$val, $s['skey']]);
            if ((string) $old !== $val) audit('setting', 'settings', $s['skey'], mb_substr($val, 0, 200));
        }
        flash('Settings saved.');
        redirect('admin/settings');
    }
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $checks = [
        ['HTTPS', $https, $https ? 'Served over HTTPS' : 'Not HTTPS (required for pilot/production)'],
        ['APP_SECRET set (32+ chars)', strlen((string) env('APP_SECRET')) >= 32 && !str_starts_with((string) env('APP_SECRET'), 'dev-only'), 'From .env'],
        ['Debug output off', !DEBUG, DEBUG ? 'APP_DEBUG=1 (development only)' : 'Off'],
        ['Environment', app_env() !== 'development', 'APP_ENV=' . app_env()],
        ['AI provider', true, Ai::provider() . (Ai::provider() === 'none' ? ' (approved passages verbatim)' : ' — model ' . env('AI_MODEL', '?'))],
        ['Admin accounts with default password pending change', !Db::val('SELECT COUNT(*) FROM admin_users WHERE must_change_password = 1 AND is_active = 1'),
            Db::val('SELECT COUNT(*) FROM admin_users WHERE must_change_password = 1 AND is_active = 1') . ' account(s)'],
    ];
    render('admin/settings', ['user' => $u, 'settings' => Db::all('SELECT * FROM settings ORDER BY skey'), 'checks' => $checks], 'admin');
}
