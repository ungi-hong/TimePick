import { Fragment, type ReactNode } from "react";

// Google Calendar の description は HTML が混ざることがあるので、
// <a href> の URL を可視テキスト側にも展開してから HTML を剥がす。
export const htmlToPlainText = (raw: string): string =>
  raw
    .replace(
      /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_, href, inner) => {
        const innerText = inner.replace(/<[^>]+>/g, "").trim();
        if (!innerText) return href;
        return innerText.includes(href) ? innerText : `${innerText} (${href})`;
      },
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const URL_RE = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCT_RE = /[.,;:!?)\]}>"']+$/;

const linkifyText = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(URL_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    let url = m[0];
    const trail = url.match(TRAILING_PUNCT_RE);
    if (trail) url = url.slice(0, -trail[0].length);
    nodes.push(
      <a
        key={`u-${m.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {url}
      </a>,
    );
    if (trail) nodes.push(trail[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

// プレーンテキストの URL をリンク化
export const renderLinkified = (text: string): ReactNode =>
  linkifyText(text).map((n, i) => <Fragment key={i}>{n}</Fragment>);

// HTML を剥がした上でリンク化 (Google Calendar の description 用)
export const renderRichDescription = (raw: string): ReactNode =>
  linkifyText(htmlToPlainText(raw)).map((n, i) => (
    <Fragment key={i}>{n}</Fragment>
  ));
