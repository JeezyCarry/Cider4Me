import { Readability } from '@mozilla/readability';
import { MAX_IMPLICIT_CONTEXT_CHARS } from '../shared/constants';
import type { PageContext, PageContextBlock } from '../shared/types';

function hashString(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `ctx_${Math.abs(hash)}`;
}

function normalizeContent(content: string): { content: string; blocks: PageContextBlock[] } {
  const lines = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = lines.slice(0, 120).map<PageContextBlock>((line) => ({
    kind: line.startsWith('#') ? 'heading' : line.startsWith('- ') ? 'list' : 'paragraph',
    text: line,
  }));

  return {
    content: lines.join('\n\n').slice(0, MAX_IMPLICIT_CONTEXT_CHARS),
    blocks,
  };
}

function htmlToMarkdownish(html: string): string {
  return html
    .replace(/<pre[\s\S]*?<code[\s\S]*?>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, (_, code: string) => `\n\n\
\
${code.replace(/<[^>]+>/g, '').trim()}\n\
\
`)
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => `\n${'#'.repeat(Number(level))} ${text.replace(/<[^>]+>/g, '').trim()}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text: string) => `\n- ${text.replace(/<[^>]+>/g, '').trim()}`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text: string) => `\n\n${text.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parsePageContextFromDocument(documentToParse: Document, url = documentToParse.location.href): PageContext {
  const clone = new DOMParser().parseFromString(documentToParse.documentElement.outerHTML, 'text/html');
  const article = new Readability(clone).parse();

  const title = article?.title ?? documentToParse.title ?? 'Untitled page';
  const contentSource = article?.content ? htmlToMarkdownish(article.content) : documentToParse.body?.innerText ?? '';
  const normalized = normalizeContent(contentSource);
  const hash = hashString(`${url}:${title}:${normalized.content.slice(0, 1000)}`);

  return {
    title,
    url,
    byline: article?.byline ?? undefined,
    excerpt: article?.excerpt ?? undefined,
    content: normalized.content,
    blocks: normalized.blocks,
    hash,
    capturedAt: new Date().toISOString(),
  };
}
