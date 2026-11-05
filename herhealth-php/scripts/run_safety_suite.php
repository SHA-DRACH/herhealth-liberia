<?php
declare(strict_types=1);

/**
 * Runs the full AI safety suite and stores the evidence in the database and in storage/evidence/.
 *   php scripts/run_safety_suite.php
 * Exit code 0 only when every case passes.
 */
if (PHP_SAPI !== 'cli') exit("CLI only\n");
require dirname(__DIR__) . '/app/bootstrap.php';
require ROOT . '/app/SafetySuite.php';

$r = SafetySuite::run('cli');
$lines = [];
foreach ($r['rows'] as $row) {
    $c = $row['case'];
    $lines[] = sprintf('%-4s %-11s %-22s %-21s %-12s %s', $row['passed'] ? 'PASS' : 'FAIL', $c['code'], $c['category'],
        $row['pathway'], $row['risk'], $row['passed'] ? '' : '<- ' . $row['detail'] . ($c['clinical_status'] === 'AWAITING_CLINICAL_DECISION' ? ' [awaiting clinical decision]' : ''));
}
$summary = sprintf("Run #%d  %s  environment=%s\nTotal: %d/%d passed   RED/emergency: %d/%d escalated   lexicon=%s\n",
    $r['run_id'], gmdate('Y-m-d H:i:s') . ' UTC', app_env(), $r['passed'], $r['total'], $r['red_passed'], $r['red_total'], substr(Safety::lexiconHash(), 0, 12));
echo implode("\n", $lines), "\n\n", $summary;
$file = ROOT . '/storage/evidence/safety-run-' . $r['run_id'] . '-' . gmdate('Ymd-His') . '.txt';
file_put_contents($file, $summary . "\n" . implode("\n", $lines) . "\n");
echo "Evidence saved: storage/evidence/" . basename($file) . "\n";
exit($r['passed'] === $r['total'] ? 0 : 1);
