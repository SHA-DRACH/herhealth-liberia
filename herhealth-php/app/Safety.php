<?php
declare(strict_types=1);

/**
 * Deterministic safety layer. Runs BEFORE any knowledge retrieval or AI generation, so emergency,
 * protection and crisis questions never receive an ordinary answer. A language model can never lower
 * a risk level decided here.
 *
 * The lexicon lives in the `safety_terms` table. Only PROVISIONAL and CLINICALLY_VALIDATED terms are
 * active; PROPOSED terms wait for a registered nurse's decision in Admin → AI Safety Review.
 */
final class Safety
{
    public const SEVERITY = ['GREEN' => 0, 'AMBER' => 1, 'PROTECTION' => 2, 'MENTAL_HEALTH_CRISIS' => 3, 'RED' => 4];
    public const PATHWAY = ['RED' => 'EMERGENCY', 'PROTECTION' => 'PROTECTION', 'MENTAL_HEALTH_CRISIS' => 'MENTAL_HEALTH_CRISIS'];

    private const DOMAIN = ['health', 'medic', 'doctor', 'nurse', 'midwi', 'clinic', 'hospital', 'symptom', 'pain', 'bleed', 'blood', 'body',
        'period', 'menstru', 'pad', 'tampon', 'cycle', 'pms', 'cramp', 'puberty', 'ovul', 'fertil', 'infertil', 'hormon', 'menopaus',
        'pregnan', 'baby', 'babies', 'birth', 'deliver', 'labour', 'labor', 'antenatal', 'prenatal', 'postnatal', 'postpartum',
        'miscarr', 'abort', 'breast', 'breastfeed', 'newborn', 'infant', 'child', 'matern', 'mother', 'womb', 'uter', 'cervi',
        'vagin', 'vulv', 'penis', 'testic', 'sperm', 'egg', 'discharge', 'itch', 'smell', 'infect', 'std', 'sti', 'hiv', 'aids',
        'hpv', 'herpes', 'syphil', 'gonorr', 'chlamyd', 'cancer', 'screening', 'vaccin', 'condom', 'contracep', 'family',
        'implant', 'iud', 'injectable', 'pill', 'sex', 'consent', 'relationship', 'partner', 'rape', 'abuse', 'violen',
        'mental', 'stress', 'anxi', 'depress', 'sad', 'sleep', 'suicid', 'wellbeing', 'nutrition', 'food', 'eat', 'diet', 'weight',
        'fever', 'headache', 'nause', 'vomit', 'dizz', 'faint', 'urin', 'pee', 'lump', 'swell', 'swollen', 'rash', 'sore',
        'woman', 'women', 'girl', 'female', 'teen', 'adolesc', 'worry', 'worried', 'feel', 'mood', 'prep', 'pep',
        // Everyday words also used in Liberian English. Add validated Koloqua health terms here only
        // after a fluent reviewer has confirmed them (see docs/localization.md).
        'belly', 'sick'];

    private static ?array $terms = null;

    public static function normalize(string $text): array
    {
        $t = mb_strtolower($text, 'UTF-8');
        $t = preg_replace("/[\x{2018}\x{2019}\x{02BC}`]/u", "'", $t) ?? $t;
        $t = preg_replace("/[^\p{L}\p{N}']+/u", ' ', $t) ?? $t;
        return array_values(array_filter(explode(' ', trim($t)), fn($w) => $w !== ''));
    }

    /** @return array<int,array{level:string,term:string}> */
    public static function activeTerms(): array
    {
        if (self::$terms !== null) return self::$terms;
        self::$terms = Db::all("SELECT level, term FROM safety_terms WHERE status IN ('PROVISIONAL','CLINICALLY_VALIDATED') ORDER BY id");
        return self::$terms;
    }

    public static function resetCache(): void { self::$terms = null; }

    public static function lexiconHash(): string
    {
        return hash('sha256', json_encode(self::activeTerms()));
    }

    private static function phraseMatches(array $tokens, array $phrase): bool
    {
        $n = count($phrase);
        if ($n === 0) return false;
        for ($i = 0; $i + $n <= count($tokens); $i++) {
            $ok = true;
            for ($j = 0; $j < $n; $j++) {
                if (!str_starts_with($tokens[$i + $j], $phrase[$j])) { $ok = false; break; }
            }
            if ($ok) return true;
        }
        return false;
    }

    private static function termMatches(array $tokens, string $term): bool
    {
        foreach (explode('+', $term) as $part) {
            if (!self::phraseMatches($tokens, self::normalize($part))) return false;
        }
        return true;
    }

    /** @return array{level:string,levels:string[]} */
    public static function classify(string $question): array
    {
        $tokens = self::normalize($question);
        $hit = [];
        foreach (self::activeTerms() as $t) if (self::termMatches($tokens, $t['term'])) $hit[$t['level']] = true;
        $levels = array_keys($hit);
        usort($levels, fn($a, $b) => self::SEVERITY[$b] <=> self::SEVERITY[$a]);
        return ['level' => $levels[0] ?? 'GREEN', 'levels' => $levels];
    }

    public static function isMedicationRequest(string $q): bool
    {
        $m = '(?:medicines?|medications?|drugs?|pills?|tablets?|injections?|herbs?|herbal\s+\w+|antibiotics?|painkillers?)';
        $patterns = [
            "/\b(?:what|which)\s+(?:kind\s+of\s+|type\s+of\s+)?$m\b/u",
            "/\b$m\s+(?:should|can|must|do)\s+i\s+(?:take|use|buy|get)\b/u",
            "/\b(?:give|recommend|prescribe|suggest|tell)\s+(?:me\s+)?(?:a\s+|some\s+|the\s+)?$m\b/u",
            '/\b(?:dose|doses|dosage|dosing|how\s+many\s+(?:pills|tablets|capsules)|how\s+much\s+(?:medicine|medication))\b/u',
            '/\bprescri(?:be|ption)\b/u',
        ];
        $text = implode(' ', self::normalize($q));
        foreach ($patterns as $p) if (preg_match($p, $text)) return true;
        return false;
    }

    public static function isOutOfScope(string $q): bool
    {
        foreach (self::normalize($q) as $w) {
            foreach (self::DOMAIN as $p) {
                if (strlen($p) <= 3 ? ($w === $p || $w === $p . 's') : str_starts_with($w, $p)) return false;
            }
        }
        return true;
    }

    /**
     * Post-generation check: blocks generated text that diagnoses, prescribes, guarantees outcomes,
     * invents phone numbers or discourages care. Returns a flag name or null when the text is safe.
     */
    public static function postCheck(string $answer, string $groundingText): ?string
    {
        $a = mb_strtolower($answer);
        $checks = [
            'diagnosis' => '/\b(you have|you are suffering from|this is definitely|i diagnose|your diagnosis)\b/u',
            'prescription' => '/\b(\d+\s?(mg|ml|tablets?|pills?)\b|take \d|dosage of)/u',
            'guarantee' => '/\b(guarantee|100% (safe|cure)|will definitely cure|no need to worry at all)\b/u',
            'discourages_care' => '/\b(no need to see|don\'t need (a|to see a) (doctor|nurse|health worker)|avoid (the )?(clinic|hospital))\b/u',
        ];
        foreach ($checks as $flag => $re) if (preg_match($re, $a)) return $flag;
        // Any phone-like number must already appear in the approved grounding text.
        if (preg_match_all('/\+?\d[\d\s\-]{5,}\d/', $answer, $m)) {
            foreach ($m[0] as $num) if (!str_contains($groundingText, trim($num))) return 'invented_number';
        }
        return null;
    }
}

/** Small English stemmer + IDF retrieval over approved knowledge chunks (same algorithm as the static preview). */
final class Retrieval
{
    private const STOP = 'a an the and or but if of to in on at for with by from as is are was were be been being it its this that these those you your yours i me my we our they them their he she his her can could may might will would should do does did not no so than then there here what when where which who whom why how also very just more most some any about into over under such only own same too have has had get got am im i\'m want know tell please much many ok okay fine alright right thing things really yes make makes';

    private static ?array $index = null;

    public static function stem(string $w): string
    {
        foreach (['pregnan', 'menstru', 'contracep', 'breastfeed'] as $p) if (str_starts_with($w, $p)) return $p;
        foreach (['ations', 'ation', 'ings', 'ing', 'edly', 'ies', 'ied', 'ed', 'ly', 'es', 's'] as $s) {
            if (strlen($w) > strlen($s) + 3 && str_ends_with($w, $s)) {
                return ($s === 'ies' || $s === 'ied') ? substr($w, 0, -strlen($s)) . 'y' : substr($w, 0, -strlen($s));
            }
        }
        return $w;
    }

    public static function keywords(string $text): array
    {
        static $stop = null;
        $stop ??= array_flip(explode(' ', self::STOP));
        $out = [];
        foreach (Safety::normalize($text) as $w) {
            if (strlen($w) <= 1 || isset($stop[$w]) || ctype_digit($w)) continue;
            $out[self::stem($w)] = true;
        }
        return array_keys($out);
    }

    /** Only clinically approved, approved/published content enters the knowledge base. */
    private static function index(): array
    {
        if (self::$index) return self::$index;
        $rows = Db::all("SELECT k.id, k.question, k.tags, k.answer, a.id AS article_id, a.slug, a.title AS article_title,
                a.when_to_get_help, a.version, c.slug AS category
            FROM knowledge_chunks k JOIN articles a ON a.id = k.article_id JOIN categories c ON c.id = a.category_id
            WHERE a.clinical_review_status = 'APPROVED' AND a.content_status IN ('APPROVED','PUBLISHED')");
        $entries = [];
        $df = [];
        foreach ($rows as $r) {
            $r['kind'] = 'qa';
            $e = ['item' => $r,
                'q' => array_flip(self::keywords($r['question'])),
                'strong' => array_flip(self::keywords(($r['tags'] ?? '') . ' ' . $r['article_title'])),
                'weak' => array_flip(self::keywords($r['answer']))];
            foreach (array_keys($e['q'] + $e['strong'] + $e['weak']) as $w) $df[$w] = ($df[$w] ?? 0) + 1;
            $entries[] = $e;
        }
        // Full article text: every paragraph, key point and "when to get help" line of approved articles is
        // also searchable, so spoken questions phrased differently from the Q&A still find reviewed content.
        // These passages have no "question" field, so a matching Q&A pair always ranks above them.
        $arts = Db::all("SELECT a.id AS article_id, a.slug, a.title AS article_title, a.summary, a.body, a.key_points, a.when_to_get_help,
                a.version, c.slug AS category FROM articles a JOIN categories c ON c.id = a.category_id
            WHERE a.clinical_review_status = 'APPROVED' AND a.content_status IN ('APPROVED','PUBLISHED')");
        foreach ($arts as $a) {
            $passages = paragraphs($a['body']);
            if ($kp = lines($a['key_points'])) $passages[] = implode(' ', $kp);
            if ($wh = lines($a['when_to_get_help'])) $passages[] = 'See a health worker if: ' . implode('; ', $wh) . '.';
            $strong = array_flip(self::keywords($a['article_title'] . ' ' . $a['summary']));
            foreach ($passages as $i => $p) {
                $item = ['id' => 'p' . $a['article_id'] . '-' . $i, 'question' => $a['article_title'], 'tags' => null, 'answer' => $p,
                    'article_id' => $a['article_id'], 'slug' => $a['slug'], 'article_title' => $a['article_title'],
                    'when_to_get_help' => $a['when_to_get_help'], 'version' => $a['version'], 'category' => $a['category'], 'kind' => 'passage'];
                $e = ['item' => $item, 'q' => [], 'strong' => $strong, 'weak' => array_flip(self::keywords($p))];
                foreach (array_keys($e['strong'] + $e['weak']) as $w) $df[$w] = ($df[$w] ?? 0) + 1;
                $entries[] = $e;
            }
        }
        $n = max(1, count($entries));
        $max = 0.0;
        foreach ($df as $c) $max = max($max, log(1 + $n / $c));
        return self::$index = ['entries' => $entries, 'df' => $df, 'n' => $n, 'max' => $max ?: 1.0];
    }

    /** @return array<int,array{item:array,coverage:float,score:float}> */
    public static function search(string $question, float $minCoverage = 0.5): array
    {
        $q = self::keywords($question);
        if (!$q) return [];
        $idx = self::index();
        $idf = fn($w) => isset($idx['df'][$w]) ? log(1 + $idx['n'] / $idx['df'][$w]) : $idx['max'] * 1.5;
        $total = array_sum(array_map($idf, $q));
        $results = [];
        foreach ($idx['entries'] as $e) {
            $found = 0.0; $score = 0.0;
            foreach ($q as $w) {
                $wt = $idf($w);
                if (isset($e['q'][$w])) { $found += $wt; $score += $wt * 2; }
                elseif (isset($e['strong'][$w])) { $found += $wt; $score += $wt * 1.6; }
                elseif (isset($e['weak'][$w])) { $found += $wt * 0.8; $score += $wt; }
            }
            $cov = $total > 0 ? $found / $total : 0;
            if ($cov >= $minCoverage) $results[] = ['item' => $e['item'], 'coverage' => $cov, 'score' => $score];
        }
        usort($results, fn($a, $b) => [$b['score'], $b['coverage']] <=> [$a['score'], $a['coverage']]);
        return $results;
    }
}
