<?php
declare(strict_types=1);

/**
 * Provider-independent AI layer (section 24). HerHealth does not depend on one vendor:
 *  - "none"     : no model; the answer is the exact clinically approved passage (default, offline-safe)
 *  - "anthropic": Anthropic Messages API
 *  - "openai"   : any OpenAI-compatible chat-completions endpoint (incl. self-hosted models)
 * Every provider only rephrases the approved passages it is given; output is post-checked and the
 * approved passage is used instead whenever the check fails or the provider errors.
 */
final class Ai
{
    public static function provider(): string
    {
        $p = env('AI_PROVIDER', 'none');
        return in_array($p, ['none', 'anthropic', 'openai'], true) && ($p === 'none' || env('AI_API_KEY')) ? $p : 'none';
    }

    private const SYSTEM = "You are the writing layer of HerHealth Liberia, an educational reproductive and maternal health information service.\n"
        . "Rewrite the APPROVED PASSAGES into a short, warm, plain-language answer (max 120 words) to the user's question.\n"
        . "Rules: use ONLY facts in the passages; never diagnose; never name prescription medicines or doses; never invent facilities, phone numbers or sources; "
        . "never guarantee outcomes; always encourage professional care when the passages mention it. If the passages do not answer the question, reply exactly: NO_ANSWER.\n"
        . "Write in {LANG}. Use short sentences.";

    /** @return array{text:string,provider:string} */
    public static function generate(string $question, array $passages, string $langName): array
    {
        $provider = self::provider();
        $fallback = $passages[0]['answer'] ?? '';
        if ($provider === 'none' || !$passages) return ['text' => $fallback, 'provider' => 'none'];

        $ctx = '';
        foreach ($passages as $i => $p) $ctx .= 'PASSAGE ' . ($i + 1) . ' (' . $p['article_title'] . "):\n" . $p['answer'] . "\n\n";
        $system = str_replace('{LANG}', $langName, self::SYSTEM);
        $user = "APPROVED PASSAGES:\n$ctx\nUSER QUESTION:\n$question";

        try {
            $text = $provider === 'anthropic' ? self::anthropic($system, $user) : self::openai($system, $user);
        } catch (Throwable $e) {
            error_log('AI provider error: ' . $e->getMessage());
            return ['text' => $fallback, 'provider' => 'none'];
        }
        $text = trim((string) $text);
        if ($text === '' || str_contains($text, 'NO_ANSWER')) return ['text' => $fallback, 'provider' => 'none'];
        return ['text' => $text, 'provider' => $provider];
    }

    private static function http(string $url, array $headers, array $body): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int) env('AI_TIMEOUT', '20'),
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_POSTFIELDS => json_encode($body),
        ]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false || $code >= 400) throw new RuntimeException("AI HTTP $code");
        return json_decode((string) $res, true) ?: [];
    }

    private static function anthropic(string $system, string $user): string
    {
        $r = self::http(env('AI_BASE_URL', 'https://api.anthropic.com') . '/v1/messages',
            ['x-api-key: ' . env('AI_API_KEY'), 'anthropic-version: 2023-06-01'],
            ['model' => env('AI_MODEL', ''), 'max_tokens' => 400, 'system' => $system,
             'messages' => [['role' => 'user', 'content' => $user]]]);
        return $r['content'][0]['text'] ?? '';
    }

    private static function openai(string $system, string $user): string
    {
        $r = self::http(rtrim((string) env('AI_BASE_URL', 'https://api.openai.com/v1'), '/') . '/chat/completions',
            ['Authorization: Bearer ' . env('AI_API_KEY')],
            ['model' => env('AI_MODEL', ''), 'max_tokens' => 400, 'temperature' => 0.2,
             'messages' => [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $user]]]);
        return $r['choices'][0]['message']['content'] ?? '';
    }
}
