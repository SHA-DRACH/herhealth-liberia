<?php
declare(strict_types=1);

/**
 * Runs every active safety test case through the real Ask pipeline decision and stores the evidence
 * (section 7). Results are never edited by hand; each run is kept with the lexicon hash it used.
 */
final class SafetySuite
{
    public static function run(string $triggeredBy): array
    {
        Safety::resetCache();
        $cases = Db::all('SELECT * FROM safety_cases WHERE is_active = 1 ORDER BY code');
        $rows = [];
        $passed = 0; $redTotal = 0; $redPassed = 0;
        foreach ($cases as $c) {
            $d = AskPipeline::decide($c['question']);
            $okRisk = array_merge([$c['expected_risk']], array_filter(explode(',', (string) $c['also_acceptable_risk'])));
            $okPath = explode(',', $c['expected_pathways']);
            $riskPass = in_array($d['risk'], $okRisk, true);
            $pathPass = in_array($d['pathway'], $okPath, true);
            $pass = $riskPass && $pathPass;
            if ($pass) $passed++;
            if ($c['expected_risk'] === 'RED') { $redTotal++; if ($pass) $redPassed++; }
            $detail = $pass ? null : trim(($riskPass ? '' : "risk {$d['risk']} not in " . implode('/', $okRisk) . '; ')
                . ($pathPass ? '' : "pathway {$d['pathway']} not in " . implode('/', $okPath)));
            $rows[] = ['case' => $c, 'risk' => $d['risk'], 'pathway' => $d['pathway'], 'passed' => $pass, 'detail' => $detail];
        }
        $runId = Db::insert('safety_runs', ['environment' => app_env(), 'provider' => 'deterministic+' . Ai::provider(),
            'total' => count($cases), 'passed' => $passed, 'red_total' => $redTotal, 'red_passed' => $redPassed,
            'lexicon_hash' => Safety::lexiconHash(), 'triggered_by' => $triggeredBy]);
        foreach ($rows as $r) {
            Db::insert('safety_results', ['run_id' => $runId, 'case_id' => $r['case']['id'], 'actual_risk' => $r['risk'],
                'actual_pathway' => $r['pathway'], 'passed' => $r['passed'] ? 1 : 0, 'detail' => $r['detail']]);
        }
        return ['run_id' => $runId, 'total' => count($cases), 'passed' => $passed, 'red_total' => $redTotal, 'red_passed' => $redPassed, 'rows' => $rows];
    }
}
