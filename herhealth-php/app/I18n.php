<?php
declare(strict_types=1);

/**
 * Localization. Interface strings are kept outside the application logic in /locales/<code>.json.
 * The `languages` table records whether each language has been reviewed; only public languages can
 * be selected. Missing strings fall back to English.
 */
final class I18n
{
    private static array $strings = [];
    private static ?string $lang = null;

    public static function publicLanguages(): array
    {
        static $rows = null;
        if ($rows === null) {
            try { $rows = Db::all('SELECT code, name, native_name, status FROM languages WHERE is_public = 1 ORDER BY sort_order'); }
            catch (Throwable) { $rows = [['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'status' => 'PUBLISHED']]; }
        }
        return $rows;
    }

    public static function lang(): string
    {
        if (self::$lang) return self::$lang;
        $want = $_COOKIE['hh_lang'] ?? 'en';
        $codes = array_column(self::publicLanguages(), 'code');
        self::$lang = in_array($want, $codes, true) ? $want : 'en';
        return self::$lang;
    }

    public static function load(string $code): array
    {
        if (isset(self::$strings[$code])) return self::$strings[$code];
        $safe = preg_replace('/[^a-z\-]/', '', $code);
        $file = ROOT . "/locales/$safe.json";
        self::$strings[$code] = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
        return self::$strings[$code];
    }

    public static function t(string $key, array $vars = []): string
    {
        $s = self::load(self::lang())[$key] ?? self::load('en')[$key] ?? $key;
        foreach ($vars as $k => $v) $s = str_replace('{' . $k . '}', (string) $v, $s);
        return $s;
    }

    public static function status(string $code): ?string
    {
        foreach (self::publicLanguages() as $l) if ($l['code'] === $code) return $l['status'];
        return null;
    }
}

function t(string $key, array $vars = []): string
{
    return I18n::t($key, $vars);
}
