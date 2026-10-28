import { input, label } from "./ui";

export interface ArticleValues {
  title?: string;
  summary?: string;
  content?: string;
  key_points?: string;
  warning_signs?: string;
}

/** Shared fields for English articles and translations. */
export function ArticleFields({ v = {}, disabled = false }: { v?: ArticleValues; disabled?: boolean }) {
  return (
    <fieldset disabled={disabled} className="grid gap-3">
      <label className={label}>
        Title
        <input name="title" defaultValue={v.title} className={input} required maxLength={160} />
      </label>
      <label className={label}>
        Summary (one or two short sentences)
        <textarea name="summary" defaultValue={v.summary} className={input} rows={2} maxLength={400} />
      </label>
      <label className={label}>
        Content (short paragraphs separated by a blank line)
        <textarea name="content" defaultValue={v.content} className={`${input} font-mono`} rows={12} required />
      </label>
      <label className={label}>
        Key things to remember (one per line)
        <textarea name="key_points" defaultValue={v.key_points} className={input} rows={4} />
      </label>
      <label className={label}>
        When should I get help? — warning signs (one per line, as approved by the health reviewer)
        <textarea name="warning_signs" defaultValue={v.warning_signs} className={input} rows={4} />
      </label>
    </fieldset>
  );
}
