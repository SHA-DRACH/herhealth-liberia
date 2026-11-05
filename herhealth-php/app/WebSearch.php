<?php
declare(strict_types=1);

/**
 * Trusted-sites web answers (used only when the clinically reviewed library has no answer).
 *
 * Rules enforced here and in AskPipeline:
 *  - only for in-scope GREEN/AMBER questions — never emergencies, abuse, crisis, medicines or diagnosis;
 *  - search is restricted to an allowlist of public-health organisations (Settings → web_search_domains);
 *  - every answer must cite at least one allowlisted page, passes the same post-generation safety check,
 *    and is labelled "not reviewed by HerHealth nurses";
 *  - the question is sent with names, phone numbers and e-mails removed, and is never stored by HerHealth;
 *  - an administrator can switch the feature off (Settings → web_search_enabled), e.g. for the UNICEF demo.
 *
 * Provider: the Anthropic Messages API web-search server tool (raw HTTP, matching the provider-independent
 * AI layer in Ai.php; this project deliberately has no Composer dependencies).
 */
final class WebSearch
{
    public const DEFAULT_DOMAINS = 'who.int,unicef.org,unfpa.org,cdc.gov,nhs.uk,moh.gov.lr,medlineplus.gov,fhi360.org';

    public static function apiKey(): ?string
    {
        return env('WEB_SEARCH_API_KEY') ?: (env('AI_PROVIDER') === 'anthropic' ? env('AI_API_KEY') : null);
    }

    public static function enabled(): bool
    {
        return Db::setting('web_search_enabled', '0') === '1' && self::apiKey() !== null;
    }

    /** @return string[] */
    public static function domains(): array
    {
        $list = array_filter(array_map(fn($d) => strtolower(trim($d)), explode(',', Db::setting('web_search_domains', self::DEFAULT_DOMAINS))));
        return array_values(array_filter($list, fn($d) => (bool) preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $d)));
    }

    private const SYSTEM = "You are the web-answer layer of HerHealth Liberia, an educational reproductive and maternal health information service for women and girls in Liberia.\n"
        . "Search ONLY the allowed public-health websites and answer the user's question in plain, warm language a woman with little schooling can follow when it is read aloud: at most 110 words, short sentences, no lists, no markdown.\n"
        . "Rules: use only facts from pages you found; never diagnose; never name prescription medicines, doses or brands; never invent facilities, phone numbers or sources; never guarantee outcomes; "
        . "always say to see a nurse, midwife or health worker if the problem is serious, getting worse or not going away. Where it fits, mention that care is available at health facilities in Liberia.\n"
        . "If the allowed websites do not clearly answer the question, reply with exactly: NO_ANSWER";

    /**
     * @return array{text:string,sources:array<int,array{organization:string,title:string,url:string}>,grounding:string}|null
     */
    public static function answer(string $question, string $lang): ?array
    {
        $key = self::apiKey();
        $domains = self::domains();
        if (!$key || !$domains) return null;
        $model = env('WEB_SEARCH_MODEL', 'claude-opus-5-5');
        $body = [
            'model' => $model,
            'max_tokens' => 4000,
            'output_config' => ['effort' => 'low'],
            'system' => self::SYSTEM . ($lang === 'lir-en' ? "\nThe user reads Liberian English; keep words very simple." : ''),
            'tools' => [[
                'type' => 'web_search_20260209',
                'name' => 'web_search',
                'max_uses' => 3,
                'allowed_domains' => $domains,
                'user_location' => ['type' => 'approximate', 'country' => 'LR'],
            ]],
            // Server-side refusal fallback: a declined request is retried on another model inside the same call.
            'fallbacks' => 'default',
            'messages' => [['role' => 'user', 'content' => $question]],
        ];
        $headers = ['x-api-key: ' . $key, 'anthropic-version: 2023-06-01', 'anthropic-beta: server-side-fallback-2026-07-01'];

        $res = null;
        for ($i = 0; $i < 3; $i++) {                       // continue a paused server-tool turn at most twice
            $res = self::post(rtrim((string) env('WEB_SEARCH_BASE_URL', 'https://api.anthropic.com'), '/') . '/v1/messages', $headers, $body);
            if (!$res || ($res['stop_reason'] ?? '') !== 'pause_turn') break;
            $body['messages'][] = ['role' => 'assistant', 'content' => $res['content']];
        }
        if (!$res || in_array($res['stop_reason'] ?? '', ['refusal', 'max_tokens'], true)) return null;

        $text = ''; $sources = []; $grounding = '';
        foreach ($res['content'] ?? [] as $block) {
            if (($block['type'] ?? '') !== 'text') continue;
            $text .= $block['text'];
            foreach ($block['citations'] ?? [] as $c) {
                if (empty($c['url'])) continue;
                $grounding .= ' ' . ($c['cited_text'] ?? '');
                $sources[$c['url']] = ['url' => $c['url'], 'title' => (string) ($c['title'] ?? $c['url']), 'organization' => self::orgFor($c['url'])];
            }
        }
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        if ($text === '' || str_contains($text, 'NO_ANSWER')) return null;
        // Keep only citations on allowlisted domains; no trusted citation → no answer.
        $sources = array_values(array_filter($sources, fn($s) => self::allowed($s['url'], $domains)));
        if (!$sources) return null;
        return ['text' => $text, 'sources' => array_slice($sources, 0, 4), 'grounding' => $grounding];
    }

    private static function allowed(string $url, array $domains): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        foreach ($domains as $d) if ($host === $d || str_ends_with($host, '.' . $d)) return true;
        return false;
    }

    private static function orgFor(string $url): string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $map = ['who.int' => 'World Health Organization', 'unicef.org' => 'UNICEF', 'unfpa.org' => 'UNFPA', 'cdc.gov' => 'US CDC',
            'nhs.uk' => 'NHS (UK)', 'moh.gov.lr' => 'Ministry of Health, Liberia', 'medlineplus.gov' => 'MedlinePlus (US NLM)', 'fhi360.org' => 'FHI 360'];
        foreach ($map as $d => $org) if ($host === $d || str_ends_with($host, '.' . $d)) return $org;
        return $host;
    }

    private static function post(string $url, array $headers, array $body): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int) env('WEB_SEARCH_TIMEOUT', '45'),
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_POSTFIELDS => json_encode($body),
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false || $code >= 400) {
            error_log("WebSearch HTTP $code $err " . substr((string) $raw, 0, 300));
            return null;
        }
        $j = json_decode((string) $raw, true);
        return is_array($j) ? $j : null;
    }
}
