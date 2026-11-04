<?php
declare(strict_types=1);

/**
 * Ask HerHealth — grounded pipeline (section 8). Order is fixed:
 *  1 input validation → 2 identifier stripping → 3 language detection → 4 safety classification →
 *  5 intent classification → 6 approved knowledge retrieval → 7 confidence threshold →
 *  8 grounded generation → 9 post-generation safety check → 10 source attribution → 11 anonymous analytics
 * RED / PROTECTION / MENTAL_HEALTH_CRISIS bypass retrieval and generation entirely.
 * The raw question is never written to the database or logs.
 */
final class AskPipeline
{
    public const MIN_CONFIDENCE = 0.5;

    private const LIR_MARKERS = ['wetin', 'deh', 'dey', 'da', 'nah', 'abeg', 'pekin', 'plenty', 'so so', 'small small', 'my belly'];

    public static function detectLanguage(string $text, string $uiLang): string
    {
        $t = ' ' . implode(' ', Safety::normalize($text)) . ' ';
        foreach (self::LIR_MARKERS as $m) if (str_contains($t, " $m ")) return 'lir-en';
        return $uiLang;
    }

    /** Deterministic decision only (used by the safety suite and by run()). */
    public static function decide(string $question): array
    {
        $c = Safety::classify($question);
        $special = array_values(array_filter($c['levels'], fn($l) => isset(Safety::PATHWAY[$l])));
        if ($special) {
            return ['pathway' => Safety::PATHWAY[$special[0]], 'risk' => $c['level'],
                'alsoApplies' => array_map(fn($l) => Safety::PATHWAY[$l], array_slice($special, 1))];
        }
        if (Safety::isMedicationRequest($question)) return ['pathway' => 'MEDICATION', 'risk' => $c['level']];
        $matches = Retrieval::search($question, self::MIN_CONFIDENCE);
        if (!$matches) return ['pathway' => Safety::isOutOfScope($question) ? 'OUT_OF_SCOPE' : 'FALLBACK', 'risk' => $c['level']];
        return ['pathway' => 'ANSWER', 'risk' => $c['level'], 'matches' => $matches];
    }

    public static function run(string $raw, string $uiLang, ?string $sessionId, string $inputMode = 'TEXT'): array
    {
        $t0 = microtime(true);
        // 1. input validation
        $raw = trim(preg_replace('/\s+/u', ' ', $raw) ?? '');
        if (mb_strlen($raw) < 3) return ['error' => t('ask.tooShort')];
        $raw = mb_substr($raw, 0, 500);
        // 2. identifier stripping
        $q = strip_identifiers($raw);
        // 3. language detection (UI language decides the reply; detection is recorded for localization evidence)
        $detected = self::detectLanguage($q, $uiLang);
        // 4–7. safety → intent → retrieval → confidence
        $d = self::decide($q);
        $out = ['pathway' => $d['pathway'], 'risk' => $d['risk'], 'alsoApplies' => $d['alsoApplies'] ?? []];
        $articleId = null; $confidence = null; $provider = 'none'; $flag = null; $category = null;

        if ($d['pathway'] === 'ANSWER') {
            $best = $d['matches'][0];
            $confidence = round($best['coverage'], 3);
            $passages = array_map(fn($m) => $m['item'], array_slice($d['matches'], 0, 3));
            $item = $best['item'];
            $articleId = (int) $item['article_id'];
            $category = $item['category'];
            // 8. grounded generation (provider-independent; "none" returns the approved passage verbatim)
            $langName = $uiLang === 'lir-en' ? 'simple Liberian English' : 'simple English';
            $gen = Ai::generate($q, $passages, $langName);
            $answer = $gen['text'];
            $provider = $gen['provider'];
            // 9. post-generation safety check
            $grounding = implode("\n", array_column($passages, 'answer'));
            if ($provider !== 'none' && ($flag = Safety::postCheck($answer, $grounding))) {
                $answer = $item['answer'];
                $provider = 'none';
            }
            // 10. source attribution (approved sources of the matched article only)
            $out += [
                'answer' => $answer,
                'matchedQuestion' => $item['question'],
                'article' => ['slug' => $item['slug'], 'title' => $item['article_title'], 'version' => $item['version']],
                'sources' => Content::sourcesFor($articleId),
                'whenToGetHelp' => lines($item['when_to_get_help']),
                'related' => array_values(array_map(fn($m) => ['question' => $m['item']['question'], 'slug' => $m['item']['slug']],
                    array_slice($d['matches'], 1, 2))),
                'confidence' => $confidence,
                'generatedBy' => $provider === 'none' ? 'approved-passage' : 'ai-rephrased',
            ];
            if ($d['risk'] === 'AMBER') $out['amberNote'] = t('ask.amberNote');
        } else {
            $out['message'] = Content::safetyMessage($d['pathway'], $uiLang);
        }

        // 11. anonymous analytics — metadata only, never the question text
        try {
            Db::insert('ai_interactions', [
                'environment' => app_env(),
                'session_hash' => $sessionId ? khash($sessionId) : null,
                'language_code' => $detected,
                'input_mode' => $inputMode === 'VOICE' ? 'VOICE' : 'TEXT',
                'risk_level' => $d['risk'],
                'pathway' => $d['pathway'],
                'topic_category' => $category,
                'matched_article_id' => $articleId,
                'confidence' => $confidence,
                'provider' => $provider,
                'postcheck_flag' => $flag,
                'latency_ms' => (int) ((microtime(true) - $t0) * 1000),
            ]);
            Analytics::record('question_asked', ['session' => $sessionId, 'lang' => $uiLang, 'meta' => $d['pathway']]);
            if ($d['pathway'] !== 'OUT_OF_SCOPE') {
                Analytics::record('question_supported', ['session' => $sessionId, 'lang' => $uiLang, 'article' => $articleId, 'meta' => $d['pathway']]);
            }
        } catch (Throwable $e) { error_log('analytics: ' . $e->getMessage()); }

        return $out;
    }
}
