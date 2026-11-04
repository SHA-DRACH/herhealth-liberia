<?php
declare(strict_types=1);

/**
 * Anonymous analytics (sections 17–19).
 * - Every event carries its environment (development | testing | pilot | production).
 * - Device and session identifiers are random values created in the browser and stored here only
 *   as keyed hashes. No IP address, name, phone number or question text is stored.
 * - The public Impact page reads ONLY the environments selected in Settings → impact_environments.
 * - Numbers are never edited by hand: they are counted from the events table at request time.
 */
final class Analytics
{
    public const EVENTS = ['app_open', 'session_start', 'article_view', 'audio_started', 'audio_completed', 'question_asked',
        'question_supported', 'referral_search', 'language_selected', 'feedback_submitted', 'quick_exit', 'offline_save'];

    /** Events the browser may send directly (others are recorded server-side only). */
    public const CLIENT_EVENTS = ['app_open', 'session_start', 'article_view', 'audio_started', 'audio_completed',
        'language_selected', 'quick_exit', 'offline_save'];

    public static function record(string $type, array $o = []): void
    {
        if (!in_array($type, self::EVENTS, true)) return;
        Db::insert('events', [
            'environment' => app_env(),
            'event_type' => $type,
            'anon_user' => !empty($o['device']) ? khash('d:' . $o['device']) : null,
            'session_hash' => !empty($o['session']) ? khash('s:' . $o['session']) : null,
            'language_code' => isset($o['lang']) ? substr((string) $o['lang'], 0, 16) : null,
            'article_id' => $o['article'] ?? null,
            'meta' => isset($o['meta']) ? mb_substr((string) $o['meta'], 0, 120) : null,
        ]);
    }

    /** @return string[] */
    public static function impactEnvironments(): array
    {
        $v = Db::setting('impact_environments', 'testing,pilot');
        $envs = array_values(array_intersect(array_map('trim', explode(',', $v)), ['development', 'testing', 'pilot', 'production']));
        return $envs ?: ['testing', 'pilot'];
    }

    /** Aggregated metrics for the chosen environments. Methodology in docs/impact-methodology.md. */
    public static function metrics(array $envs): array
    {
        $in = implode(',', array_fill(0, count($envs), '?'));
        $count = fn(string $type) => (int) Db::val("SELECT COUNT(*) FROM events WHERE environment IN ($in) AND event_type = ?", [...$envs, $type]);

        $users = (int) Db::val("SELECT COUNT(DISTINCT anon_user) FROM events WHERE environment IN ($in) AND anon_user IS NOT NULL", $envs);
        $sessions = (int) Db::val("SELECT COUNT(DISTINCT session_hash) FROM events WHERE environment IN ($in) AND session_hash IS NOT NULL", $envs);
        $fb = Db::one("SELECT SUM(useful = 'YES') AS yes, COUNT(useful) AS total FROM feedback WHERE environment IN ($in)", $envs);
        $usefulPct = ($fb && (int) $fb['total'] > 0) ? round(100 * (int) $fb['yes'] / (int) $fb['total']) : null;
        $run = Db::one('SELECT * FROM safety_runs ORDER BY id DESC LIMIT 1');
        $last = Db::val("SELECT MAX(created_at) FROM events WHERE environment IN ($in)", $envs);

        return [
            'users' => $users,
            'sessions' => $sessions,
            'articles_viewed' => $count('article_view'),
            'audio_played' => $count('audio_started'),
            'audio_completed' => $count('audio_completed'),
            'questions_supported' => $count('question_supported'),
            'referral_searches' => $count('referral_search'),
            'languages_available' => (int) Db::val("SELECT COUNT(*) FROM languages WHERE is_public = 1"),
            'languages_validated' => (int) Db::val("SELECT COUNT(*) FROM languages WHERE is_public = 1 AND status IN ('APPROVED','PUBLISHED')"),
            'useful_pct' => $usefulPct,
            'useful_n' => (int) ($fb['total'] ?? 0),
            'safety_run' => $run,
            'last_updated' => $last,
            'environments' => $envs,
        ];
    }

    /** Usability-testing summary (section 22). Only recorded sessions are counted. */
    public static function testingSummary(): array
    {
        $tests = (int) Db::val('SELECT COUNT(*) FROM user_tests WHERE consent_confirmed = 1');
        $tasks = Db::one('SELECT SUM(t.attempted) AS attempted, SUM(t.completed) AS completed FROM user_test_tasks t
            JOIN user_tests u ON u.id = t.user_test_id WHERE u.consent_confirmed = 1');
        $r = Db::one("SELECT AVG(ease_rating) AS ease, AVG(understandability_rating) AS under,
                SUM(understandability_rating >= 4) AS under_ok, COUNT(understandability_rating) AS under_n,
                SUM(useful_to_community = 'YES') AS useful_yes, COUNT(useful_to_community) AS useful_n,
                COUNT(DISTINCT language_code) AS langs, AVG(completion_time_seconds) AS avg_time
            FROM user_tests WHERE consent_confirmed = 1");
        $pct = fn($a, $b) => ((int) $b > 0) ? round(100 * (int) $a / (int) $b) : null;
        $perTask = Db::all('SELECT t.task_no, SUM(t.attempted) AS attempted, SUM(t.completed) AS completed, AVG(NULLIF(t.seconds,0)) AS avg_seconds
            FROM user_test_tasks t JOIN user_tests u ON u.id = t.user_test_id WHERE u.consent_confirmed = 1 GROUP BY t.task_no ORDER BY t.task_no');
        return [
            'participants' => $tests,
            'tasks_attempted' => (int) ($tasks['attempted'] ?? 0),
            'tasks_completed' => (int) ($tasks['completed'] ?? 0),
            'completion_pct' => $pct($tasks['completed'] ?? 0, $tasks['attempted'] ?? 0),
            'understandable_pct' => $pct($r['under_ok'] ?? 0, $r['under_n'] ?? 0),
            'useful_pct' => $pct($r['useful_yes'] ?? 0, $r['useful_n'] ?? 0),
            'avg_ease' => $r['ease'] !== null ? round((float) $r['ease'], 1) : null,
            'avg_understand' => $r['under'] !== null ? round((float) $r['under'], 1) : null,
            'languages_tested' => (int) ($r['langs'] ?? 0),
            'avg_time' => $r['avg_time'] !== null ? (int) $r['avg_time'] : null,
            'per_task' => $perTask,
            'verified_facilities' => (int) Db::val("SELECT COUNT(*) FROM facilities WHERE status = 'VERIFIED'"),
            'safety_run' => Db::one('SELECT * FROM safety_runs ORDER BY id DESC LIMIT 1'),
        ];
    }
}
