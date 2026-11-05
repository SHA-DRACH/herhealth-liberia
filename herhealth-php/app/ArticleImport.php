<?php
declare(strict_types=1);

/**
 * Turns an uploaded file (.docx, .txt, .md, .html) into a DRAFT article.
 * Headings named like "Key points" / "Key things to remember" and "When to get help" / "Danger signs" /
 * "See a health worker if" become the matching sections; everything else is body text.
 * Imported articles are never published automatically: they start as DRAFT / NOT_REVIEWED and must go
 * through clinical review like any other article.
 */
final class ArticleImport
{
    public const MAX_BYTES = 5 * 1024 * 1024;

    /** @return array{0: ?array, 1: ?string} [parsed, error] */
    public static function fromUpload(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return [null, 'Choose a file to upload.'];
        if ($file['error'] !== UPLOAD_ERR_OK) return [null, 'Upload failed (code ' . $file['error'] . ').'];
        if ($file['size'] > self::MAX_BYTES) return [null, 'The file is larger than 5 MB.'];
        $ext = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        try {
            $blocks = match ($ext) {
                'docx' => $mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || $mime === 'application/zip'
                    ? self::docx($file['tmp_name']) : throw new RuntimeException('This is not a valid Word (.docx) file.'),
                'txt', 'md' => str_starts_with((string) $mime, 'text/') || $mime === 'application/octet-stream'
                    ? self::text((string) file_get_contents($file['tmp_name'])) : throw new RuntimeException('This is not a text file.'),
                'html', 'htm' => self::html((string) file_get_contents($file['tmp_name'])),
                default => throw new RuntimeException('Upload a Word (.docx), text (.txt), Markdown (.md) or web page (.html) file. For PDF, copy the text into a .txt or Word file first.'),
            };
        } catch (Throwable $e) {
            return [null, $e instanceof RuntimeException ? $e->getMessage() : 'The file could not be read.'];
        }
        $parsed = self::structure($blocks, pathinfo((string) $file['name'], PATHINFO_FILENAME));
        if (mb_strlen($parsed['body']) < 80) return [null, 'The file has too little text to become an article.'];
        return [$parsed, null];
    }

    /** @return array<int,array{0:string,1:string}> list of [type: h|p|li, text] */
    private static function docx(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) throw new RuntimeException('The Word file could not be opened.');
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if ($xml === false) throw new RuntimeException('The Word file has no document text.');
        $dom = new DOMDocument();
        $dom->loadXML($xml, LIBXML_NONET);   // no network access; external entities are not loaded in PHP 8
        $xp = new DOMXPath($dom);
        $xp->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
        $out = [];
        foreach ($xp->query('//w:body/w:p') as $p) {
            $text = trim(implode('', array_map(fn($t) => $t->nodeValue, iterator_to_array($xp->query('.//w:t', $p)))));
            if ($text === '') continue;
            $style = (string) ($xp->query('./w:pPr/w:pStyle/@w:val', $p)->item(0)?->nodeValue ?? '');
            $isList = $xp->query('./w:pPr/w:numPr', $p)->length > 0;
            $type = preg_match('/^(heading|title)/i', $style) ? 'h' : ($isList ? 'li' : 'p');
            $out[] = [$type, $text];
        }
        return $out;
    }

    private static function text(string $raw): array
    {
        $raw = str_replace("\r\n", "\n", $raw);
        $out = [];
        foreach (preg_split('/\n\s*\n|\n(?=\s*(#|[-*•]|\d+[.)])\s)/', $raw) ?: [] as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '') continue;
            if (preg_match('/^#{1,6}\s+(.+)$/', $chunk, $m)) $out[] = ['h', trim($m[1])];
            elseif (preg_match('/^([-*•]|\d+[.)])\s+(.+)$/s', $chunk, $m)) $out[] = ['li', trim(preg_replace('/\s+/', ' ', $m[2]))];
            else $out[] = ['p', trim(preg_replace('/\s+/', ' ', $chunk))];
        }
        return $out;
    }

    private static function html(string $raw): array
    {
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8"?>' . $raw, LIBXML_NONET);
        libxml_clear_errors();
        foreach (['script', 'style', 'nav', 'header', 'footer', 'form'] as $tag) {
            foreach (iterator_to_array($dom->getElementsByTagName($tag)) as $n) $n->parentNode?->removeChild($n);
        }
        $out = [];
        foreach ((new DOMXPath($dom))->query('//h1|//h2|//h3|//p|//li') as $n) {
            $text = trim(preg_replace('/\s+/u', ' ', $n->textContent) ?? '');
            if ($text === '') continue;
            $out[] = [in_array($n->nodeName, ['h1', 'h2', 'h3'], true) ? 'h' : ($n->nodeName === 'li' ? 'li' : 'p'), $text];
        }
        return $out;
    }

    /** @param array<int,array{0:string,1:string}> $blocks */
    private static function structure(array $blocks, string $fallbackTitle): array
    {
        $title = null; $section = 'body';
        $body = []; $key = []; $help = [];
        foreach ($blocks as [$type, $text]) {
            if ($type === 'h') {
                if ($title === null) { $title = $text; continue; }
                $section = match (true) {
                    (bool) preg_match('/key (points|things|facts|messages)|remember|summary/i', $text) => 'key',
                    (bool) preg_match('/when (to|should).*(help|care|doctor|health worker)|danger signs|warning signs|see a health worker|seek (help|care)/i', $text) => 'help',
                    default => 'body',
                };
                if ($section === 'body') $body[] = $text . ':';
                continue;
            }
            if ($title === null && $type === 'p' && mb_strlen($text) <= 120) { $title = $text; continue; }
            if ($section === 'key') $key[] = $text;
            elseif ($section === 'help') $help[] = $text;
            else $body[] = $type === 'li' ? '• ' . $text : $text;
        }
        // Merge "Heading:" lines and bullets into the paragraph that follows/precedes them.
        $paras = [];
        foreach ($body as $b) {
            if ($paras && (str_starts_with($b, '• ') || str_ends_with(end($paras), ':'))) $paras[count($paras) - 1] .= "\n" . $b;
            else $paras[] = $b;
        }
        $title = mb_substr($title ?? ucfirst(str_replace(['-', '_'], ' ', $fallbackTitle)), 0, 200);
        $summary = '';
        foreach ($paras as $p) if (!str_ends_with($p, ':')) { $summary = $p; break; }
        $summary = mb_strlen($summary) > 300 ? rtrim(mb_substr($summary, 0, 297)) . '…' : $summary;
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $title) ?: $title)) ?? '', '-') ?: 'article';
        return ['title' => $title, 'slug' => mb_substr($slug, 0, 100), 'summary' => $summary, 'body' => implode("\n\n", $paras),
            'key_points' => implode("\n", $key), 'when_to_get_help' => implode("\n", $help)];
    }
}
