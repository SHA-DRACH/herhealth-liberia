<?php
declare(strict_types=1);

/** Read-side queries for the public site. Only PUBLISHED + clinically APPROVED content is ever shown. */
final class Content
{
    private const PUBLIC_WHERE = "a.content_status = 'PUBLISHED' AND a.clinical_review_status = 'APPROVED'";

    public static function categories(): array
    {
        return Db::all('SELECT c.*, (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND ' . self::PUBLIC_WHERE . ') AS article_count
            FROM categories c ORDER BY c.sort_order, c.name');
    }

    public static function category(string $slug): ?array
    {
        return Db::one('SELECT * FROM categories WHERE slug = ?', [$slug]);
    }

    public static function articlesIn(int $categoryId): array
    {
        return Db::all('SELECT a.id, a.slug, a.title, a.summary, a.version,
                (SELECT COUNT(*) FROM audio_lessons au WHERE au.article_id = a.id AND au.status = \'PUBLISHED\') AS audio_count
            FROM articles a WHERE a.category_id = ? AND ' . self::PUBLIC_WHERE . ' ORDER BY a.id', [$categoryId]);
    }

    public static function search(string $q): array
    {
        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $q) . '%';
        return Db::all('SELECT a.slug, a.title, a.summary FROM articles a WHERE ' . self::PUBLIC_WHERE . '
            AND (a.title LIKE ? OR a.summary LIKE ? OR a.body LIKE ?) ORDER BY a.title LIMIT 20', [$like, $like, $like]);
    }

    /** Article in the reader's language if an APPROVED/PUBLISHED reviewed translation exists, else English. */
    public static function article(string $slug, string $lang): ?array
    {
        $a = Db::one('SELECT a.*, c.slug AS category_slug, c.name AS category_name FROM articles a
            JOIN categories c ON c.id = a.category_id WHERE a.slug = ? AND ' . self::PUBLIC_WHERE, [$slug]);
        if (!$a) return null;
        $a['shown_language'] = 'en';
        if ($lang !== 'en') {
            $tr = Db::one("SELECT * FROM article_translations WHERE article_id = ? AND language_code = ? AND status = 'PUBLISHED'
                AND is_machine_draft = 0 AND source_article_version = ?", [$a['id'], $lang, $a['version']]);
            if ($tr) {
                foreach (['title', 'summary', 'body', 'key_points', 'when_to_get_help'] as $f) if ($tr[$f]) $a[$f] = $tr[$f];
                $a['shown_language'] = $lang;
                $a['translation'] = $tr;
            }
        }
        $a['sources'] = self::sourcesFor((int) $a['id']);
        $a['reviewers'] = Db::all("SELECT cr.public_display_name, cr.reviewer_full_name, cr.professional_qualification,
                cr.regulatory_authority, cr.review_date FROM article_clinical_reviews acr
            JOIN clinical_reviews cr ON cr.id = acr.clinical_review_id WHERE acr.article_id = ? AND acr.article_version = ? AND cr.decision = 'APPROVED'",
            [$a['id'], $a['version']]);
        $a['audio'] = Db::one("SELECT * FROM audio_lessons WHERE article_id = ? AND status = 'PUBLISHED'
            ORDER BY (language_code = ?) DESC, (voice_type = 'HUMAN') DESC, id DESC LIMIT 1", [$a['id'], $lang]);
        return $a;
    }

    public static function sourcesFor(int $articleId): array
    {
        return Db::all('SELECT s.organization, s.title, s.url, s.publication_date, s.access_date FROM article_sources x
            JOIN sources s ON s.id = x.source_id WHERE x.article_id = ? ORDER BY s.organization', [$articleId]);
    }

    public static function safetyMessage(string $pathway, string $lang): array
    {
        $m = Db::one('SELECT title, body, status FROM safety_messages WHERE pathway = ? AND language_code IN (?, \'en\')
            ORDER BY (language_code = ?) DESC LIMIT 1', [$pathway, $lang, $lang]);
        return $m ? ['title' => $m['title'], 'body' => paragraphs($m['body']), 'status' => $m['status']] : ['title' => '', 'body' => [], 'status' => ''];
    }

    public const SERVICES = ['MATERNAL' => 'Maternal care', 'ANTENATAL' => 'Antenatal care', 'FAMILY_PLANNING' => 'Family planning',
        'HIV_STI' => 'HIV / STI services', 'ADOLESCENT' => 'Adolescent health', 'EMERGENCY' => 'Emergency care',
        'GBV_SUPPORT' => 'GBV / survivor support', 'CERVICAL_SCREENING' => 'Cervical screening', 'GENERAL' => 'General health'];

    public const COUNTIES = ['Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi',
        'Maryland', 'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe'];

    /** Verified facilities only — never AI-generated, never unverified. */
    public static function facilities(?string $county, ?string $service, ?string $q): array
    {
        $sql = "SELECT f.* FROM facilities f WHERE f.status = 'VERIFIED'";
        $p = [];
        if ($county) { $sql .= ' AND f.county = ?'; $p[] = $county; }
        if ($service) { $sql .= ' AND EXISTS (SELECT 1 FROM facility_services s WHERE s.facility_id = f.id AND s.service = ? AND s.verified = 1)'; $p[] = $service; }
        if ($q) { $sql .= ' AND (f.name LIKE ? OR f.district LIKE ? OR f.location_detail LIKE ?)'; $like = '%' . $q . '%'; array_push($p, $like, $like, $like); }
        $rows = Db::all($sql . ' ORDER BY f.county, f.name LIMIT 50', $p);
        foreach ($rows as &$r) {
            $r['services'] = array_column(Db::all('SELECT service FROM facility_services WHERE facility_id = ? AND verified = 1', [$r['id']]), 'service');
        }
        return $rows;
    }
}
