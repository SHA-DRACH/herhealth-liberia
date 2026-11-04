<?php
declare(strict_types=1);

/**
 * Applies the data-retention schedule (section 15). Schedule daily, e.g. cron:
 *   15 2 * * *  php /var/www/herhealth/scripts/retention_cleanup.php
 * Periods come from Settings (retention_*). Raw questions are never stored, so nothing to delete there.
 */
if (PHP_SAPI !== 'cli') exit("CLI only\n");
require dirname(__DIR__) . '/app/bootstrap.php';

$m = fn(string $k, string $d) => max(1, (int) Db::setting($k, $d));
$jobs = [
    'events' => ['DELETE FROM events WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? MONTH', $m('retention_analytics_months', '24')],
    'ai_interactions' => ['DELETE FROM ai_interactions WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? MONTH', $m('retention_ai_metadata_months', '24')],
    'feedback comments' => ['UPDATE feedback SET comment = NULL WHERE comment IS NOT NULL AND created_at < UTC_TIMESTAMP() - INTERVAL ? MONTH', $m('retention_feedback_months', '12')],
    'audit_logs' => ['DELETE FROM audit_logs WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? MONTH', $m('retention_audit_months', '24')],
    'rate_limits' => ['DELETE FROM rate_limits WHERE window_start < UTC_TIMESTAMP() - INTERVAL ? DAY', 1],
];
foreach ($jobs as $name => [$sql, $n]) {
    $count = Db::run($sql, [$n]);
    echo str_pad($name, 20) . " older than $n: $count row(s)\n";
}
audit('retention_cleanup', 'system', null, 'ran', null);
