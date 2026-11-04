<?php
declare(strict_types=1);

function public_dispatch(string $path): void
{
    $lang = I18n::lang();
    $seg = explode('/', trim($path, '/'));

    switch (true) {
        case $path === '/':
            render('public/home', ['nav' => 'home', 'categories' => Content::categories()]);
            return;

        case $path === '/welcome':
            render('public/welcome', ['nav' => '', 'languages' => I18n::publicLanguages(), 'bare' => true]);
            return;

        case $path === '/learn':
            $q = trim((string) ($_GET['q'] ?? ''));
            render('public/learn', ['nav' => 'learn', 'categories' => Content::categories(),
                'q' => $q, 'results' => $q !== '' ? Content::search(mb_substr($q, 0, 80)) : null]);
            return;

        case $seg[0] === 'learn' && count($seg) === 2:
            $cat = Content::category($seg[1]);
            if (!$cat) { not_found(); return; }
            render('public/category', ['nav' => 'learn', 'category' => $cat, 'articles' => Content::articlesIn((int) $cat['id'])]);
            return;

        case $seg[0] === 'article' && count($seg) === 2:
            $a = Content::article($seg[1], $lang);
            if (!$a) { not_found(); return; }
            render('public/article', ['nav' => 'learn', 'a' => $a, 'lang' => $lang]);
            return;

        case $path === '/listen':
            $rows = Db::all("SELECT au.*, a.slug, a.title AS article_title FROM audio_lessons au JOIN articles a ON a.id = au.article_id
                WHERE au.status = 'PUBLISHED' AND a.content_status = 'PUBLISHED' AND a.clinical_review_status = 'APPROVED' ORDER BY a.id");
            render('public/listen', ['nav' => 'listen', 'lessons' => $rows]);
            return;

        case $path === '/ask':
            no_store(); // section 14: do not keep Ask content in the browser cache
            render('public/ask', ['nav' => 'ask', 'voice' => Db::setting('voice_input_enabled', '1') === '1']);
            return;

        case $path === '/emergency':
            render('public/emergency', ['nav' => 'help', 'contacts' => emergency_contacts(),
                'signs' => lines((string) Db::val("SELECT when_to_get_help FROM articles WHERE slug = 'pregnancy-dangers' AND content_status = 'PUBLISHED'"))]);
            return;

        case $path === '/help':
            $county = in_array($_GET['county'] ?? '', Content::COUNTIES, true) ? $_GET['county'] : null;
            $service = array_key_exists($_GET['service'] ?? '', Content::SERVICES) ? $_GET['service'] : null;
            $q = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 60) ?: null;
            $searched = isset($_GET['county']) || isset($_GET['service']) || isset($_GET['q']);
            if ($searched) Analytics::record('referral_search', ['lang' => $lang, 'meta' => trim(($county ?? 'any') . '|' . ($service ?? 'any'))]);
            render('public/help', ['nav' => 'help', 'facilities' => Content::facilities($county, $service, $q),
                'county' => $county, 'service' => $service, 'q' => $q, 'searched' => $searched]);
            return;

        case $path === '/impact':
            $envs = Analytics::impactEnvironments();
            render('public/impact', ['nav' => 'impact', 'm' => Analytics::metrics($envs), 'testing' => Analytics::testingSummary()]);
            return;

        case $path === '/about':
            render('public/about', ['nav' => 'about',
                'reviewers' => Db::all("SELECT public_display_name, professional_qualification, regulatory_authority, organization_position, years_experience
                    FROM clinical_reviews WHERE decision = 'APPROVED' ORDER BY id")]);
            return;

        case $path === '/privacy':
            render('public/privacy', ['nav' => 'privacy']);
            return;

        case $path === '/feedback':
            render('public/feedback', ['nav' => '']);
            return;

        case $path === '/offline':
            render('public/offline', ['nav' => '']);
            return;

        case $path === '/language' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST':
            $code = (string) ($_POST['lang'] ?? 'en');
            if (in_array($code, array_column(I18n::publicLanguages(), 'code'), true)) {
                setcookie('hh_lang', $code, ['expires' => time() + 31536000, 'path' => base_url('/'), 'samesite' => 'Lax',
                    'secure' => !empty($_SERVER['HTTPS']), 'httponly' => false]);
            }
            $back = (string) ($_POST['back'] ?? '/');
            redirect(str_starts_with($back, '/') && !str_starts_with($back, '//') ? $back : '/');

        case $path === '/manifest.webmanifest':
            header('Content-Type: application/manifest+json');
            readfile(ROOT . '/public/manifest.webmanifest');
            return;

        default:
            not_found();
    }
}

function not_found(): void
{
    http_response_code(404);
    render('public/notfound', ['nav' => '']);
}

/** Verified emergency contacts from Settings: "Name | number | verified by | date" per line. Empty = none shown. */
function emergency_contacts(): array
{
    $out = [];
    foreach (lines(Db::setting('emergency_contacts', '')) as $l) {
        $p = array_map('trim', explode('|', $l));
        if (count($p) >= 4 && $p[0] && $p[1] && $p[2] && $p[3]) $out[] = ['name' => $p[0], 'number' => $p[1], 'by' => $p[2], 'date' => $p[3]];
    }
    return $out;
}
