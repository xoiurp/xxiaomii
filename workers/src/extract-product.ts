/**
 * Product HTML Extractor v3
 *
 * Dois modos de operação:
 *   1. { "url": "..." }  → Fetch automático (pode perder imagens lazy/mobile)
 *   2. { "html": "..." } → Usuário fornece HTML do browser (recomendado)
 *
 * Limpa o HTML mantendo CSS links externos e scripts estruturais.
 * Remove tracking, analytics, ads e lixo.
 */

import { ExtractionResult, Env } from './types';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ============================================
// Whitelist / Blacklist
// ============================================

const KEEP_SCRIPT_CONTENT: RegExp[] = [
  /view-height/,
  /rootFontSize/,
  /documentElement[\s\S]*?fontSize/,
];

const KEEP_SCRIPT_SRC: RegExp[] = [
  /local-config.*\.js/i,
];

const REMOVE_PATTERNS: RegExp[] = [
  /googletagmanager/i,
  /gtm\.js/i,
  /gtag/i,
  /fbevents/i,
  /facebook\.net/i,
  /connect\.facebook/i,
  /ads-twitter/i,
  /static\.ads-twitter/i,
  /doubleclick/i,
  /googleadservices/i,
  /google.*?viewthroughconversion/i,
  /go-mpulse\.net/i,
  /boomerang/i,
  /BOOMR/i,
  /remoteEntry\.js/i,
  /BuyProductChannel/i,
  /infraConfigDataLayer/i,
  /dataLayer/i,
  /consent_blackbar/i,
  /onetrust/i,
];

// ============================================
// Handler principal
// ============================================

export async function handleExtractProduct(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = env.ADMIN_EXTRACT_TOKEN;

  if (token && authHeader !== `Bearer ${token}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { url?: string; html?: string; mode?: 'desktop' | 'mobile' };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url && !body.html) {
    return Response.json({
      success: false,
      error: 'Provide either "url" (auto-fetch) or "html" (raw HTML from browser). "mode" optional: "desktop" | "mobile"'
    }, { status: 400 });
  }

  try {
    let fullHtml: string;

    if (body.html) {
      // Modo direto: usuário fornece o HTML do browser
      fullHtml = body.html;
    } else {
      // Modo fetch: busca automaticamente (pode perder imagens lazy)
      const response = await fetch(body.url!, {
        headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html' },
        redirect: 'follow',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch page: HTTP ${response.status}`);
      }
      fullHtml = await response.text();
    }

    const mode = body.mode || 'desktop';
    const result = cleanProductHtml(fullHtml, mode, body.url || 'direct-html');
    return Response.json(result, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// ============================================
// Limpeza principal
// ============================================

function cleanProductHtml(fullHtml: string, mode: 'desktop' | 'mobile', sourceUrl: string): ExtractionResult {
  const title = extractTitle(fullHtml);

  // 1. Limpar o <head>
  const cleanedHead = cleanHead(fullHtml);

  // 2. Extrair o conteúdo principal (<main> ou fly-birds-page)
  const productHtml = extractMainContent(fullHtml);
  if (!productHtml) {
    throw new Error('Could not find product content (<main> or fly-birds-page) in the page');
  }

  // 3. Sanitizar o body (remover scripts, tracking pixels)
  const cleanBody = sanitizeBody(productHtml);

  // 4. Montar HTML completo limpo
  const cleanedHtml = `<head>\n${cleanedHead}\n</head>\n${cleanBody}`;

  // 5. Detectar rem base
  const remBase = detectRemBase(fullHtml);

  // 6. Contagens
  const imageCount = (cleanBody.match(/<img\s/gi) || []).length;
  const pictureCount = (cleanBody.match(/<picture\s/gi) || []).length;
  const usedClasses = collectCssClasses(cleanBody);

  return {
    success: true,
    title,
    html: cleanBody,
    css: '',
    combinedHtml: cleanedHtml,
    remBase,
    imageCount,
    classCount: usedClasses.size,
    sourceUrl,
    mode,
    pictureCount,
  };
}

// ============================================
// Limpeza do <head>
// ============================================

function cleanHead(fullHtml: string): string {
  const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch || !headMatch[1]) return '';

  const headContent = headMatch[1];
  const kept: string[] = [];

  // Captura tags no head: self-closing e com conteúdo
  const elementRegex = /<(meta|link|script|style|title)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>|>)/gi;
  let match: RegExpExecArray | null;

  while ((match = elementRegex.exec(headContent)) !== null) {
    const element = match[0];
    const tagName = (match[1] || '').toLowerCase();

    if (shouldKeepHeadElement(tagName, element)) {
      kept.push(element.trim());
    }
  }

  // Capturar <link> self-closing sem /> (ex: <link ... > )
  // A regex acima pode perder links que terminam só com >
  const linkOnlyRegex = /<link\b[^>]*>/gi;
  while ((match = linkOnlyRegex.exec(headContent)) !== null) {
    const el = match[0];
    // Evitar duplicatas
    if (!kept.includes(el.trim()) && shouldKeepLink(el)) {
      kept.push(el.trim());
    }
  }

  return kept.join('\n');
}

function shouldKeepHeadElement(tagName: string, element: string): boolean {
  switch (tagName) {
    case 'meta': return shouldKeepMeta(element);
    case 'link': return shouldKeepLink(element);
    case 'script': return shouldKeepScript(element);
    case 'style': return shouldKeepStyle(element);
    case 'title': return true;
    default: return false;
  }
}

function shouldKeepMeta(element: string): boolean {
  if (/charset/i.test(element)) return true;
  if (/viewport/i.test(element)) return true;
  if (/X-UA-Compatible/i.test(element)) return true;
  if (/theme-color/i.test(element)) return true;
  if (/color-scheme/i.test(element)) return true;
  return false;
}

function shouldKeepLink(element: string): boolean {
  // Verificar blacklist primeiro
  if (REMOVE_PATTERNS.some(p => p.test(element))) return false;

  if (/rel=["']stylesheet["']/i.test(element)) return true;
  if (/rel=["']preconnect["']/i.test(element)) return true;
  if (/rel=["']dns-prefetch["']/i.test(element)) return true;
  if (/rel=["']preload["']/i.test(element) && /as=["']image["']/i.test(element)) return true;
  if (/rel=["']preload["']/i.test(element) && /as=["']font["']/i.test(element)) return true;
  return false;
}

function shouldKeepScript(element: string): boolean {
  if (/type=["']application\/ld\+json["']/i.test(element)) return false;

  const srcMatch = element.match(/src=["']([^"']+)["']/i);
  const src = srcMatch ? srcMatch[1] : '';

  if (src) {
    if (REMOVE_PATTERNS.some(p => p.test(src))) return false;
    if (KEEP_SCRIPT_SRC.some(p => p.test(src))) return true;
    return false;
  }

  // Scripts inline
  const content = element.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  if (REMOVE_PATTERNS.some(p => p.test(content))) return false;
  if (KEEP_SCRIPT_CONTENT.some(p => p.test(content))) return true;
  return false;
}

function shouldKeepStyle(element: string): boolean {
  const content = element.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '').trim();
  if (/imageye/i.test(content)) return false;
  if (content.length > 0) return true;
  return false;
}

// ============================================
// Extração do conteúdo principal
// ============================================

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match && match[1] ? match[1].trim() : 'Untitled';
}

function extractMainContent(html: string): string | null {
  const mainStart = html.search(/<main\b/i);
  if (mainStart !== -1) {
    return extractBalancedTag(html, mainStart, 'main');
  }

  const flyBirdsStart = html.indexOf('fly-birds-page_');
  if (flyBirdsStart === -1) return null;

  const tagStart = html.lastIndexOf('<', flyBirdsStart);
  if (tagStart === -1) return null;

  const tagNameMatch = html.slice(tagStart).match(/^<(\w+)/);
  if (!tagNameMatch || !tagNameMatch[1]) return null;

  return extractBalancedTag(html, tagStart, tagNameMatch[1]);
}

function extractBalancedTag(html: string, startPos: number, tagName: string): string | null {
  let depth = 0;
  const segment = html.slice(startPos);
  const allTags = new RegExp(`(<${tagName}\\b[^>]*>|</${tagName}>)`, 'gi');
  let match: RegExpExecArray | null;

  while ((match = allTags.exec(segment)) !== null) {
    if (match[0].startsWith(`</${tagName}`)) {
      depth--;
      if (depth === 0) {
        return segment.slice(0, match.index + match[0].length);
      }
    } else {
      depth++;
    }
  }

  return depth > 0 ? segment : null;
}

// ============================================
// Sanitização do body
// ============================================

function sanitizeBody(html: string): string {
  return html
    // Remover scripts
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remover noscript
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    // Remover iframes
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    // Remover tracking pixels (1x1)
    .replace(/<img\b[^>]*(?:width|height)\s*=\s*["']?1["']?\s[^>]*>/gi, '')
    // Remover comentários HTML
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remover data-background-image vazio
    .replace(/\s*data-background-image=""\s*/g, ' ')
    // Limpar whitespace excessivo
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// ============================================
// Utilitários
// ============================================

function collectCssClasses(html: string): Set<string> {
  const classes = new Set<string>();
  const classAttrRegex = /class="([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = classAttrRegex.exec(html)) !== null) {
    if (match[1]) {
      match[1].split(/\s+/).forEach(cls => {
        const trimmed = cls.trim();
        if (trimmed) classes.add(trimmed);
      });
    }
  }

  return classes;
}

function detectRemBase(html: string): string | null {
  // 1. Atributo style do <html>
  const htmlStyleMatch = html.match(/<html[^>]*style="[^"]*font-size:\s*([^;"]+)/i);
  if (htmlStyleMatch && htmlStyleMatch[1]) return htmlStyleMatch[1].trim();

  // 2. Padrão Xiaomi: t>=1226?t/10:122.6
  const calcMatch = html.match(/(\w+)\s*>=\s*(\d+)\s*\?\s*\1\s*\/\s*(\d+)\s*:\s*([\d.]+)/);
  if (calcMatch && calcMatch[3]) {
    const divisor = calcMatch[3];
    const minValue = calcMatch[4];
    return `calc(100vw / ${divisor}) /* min: ${minValue}px, desktop 1920/${divisor} = ${Math.round(1920 / parseInt(divisor))}px */`;
  }

  // 3. fontSize direto
  const scriptFontMatch = html.match(/documentElement\.style\.fontSize\s*=\s*['"]([^'"]+)['"]/i);
  if (scriptFontMatch && scriptFontMatch[1]) return scriptFontMatch[1].trim();

  return null;
}
