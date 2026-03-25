#!/usr/bin/env node

/**
 * clean-xiaomi-html.js
 *
 * Limpa HTML de paginas de produto Xiaomi para uso no iframe da loja.
 * Mantem CSS links externos e scripts estruturais, remove tracking/analytics/ads.
 *
 * USO:
 *   1. Abra a pagina do produto Xiaomi no Chrome (desktop ou mobile)
 *   2. DevTools (F12) > Console > cole: copy(document.documentElement.outerHTML)
 *   3. Salve num arquivo .html (ex: raw-desktop.html)
 *   4. Rode:
 *        node scripts/clean-xiaomi-html.js raw-desktop.html
 *        node scripts/clean-xiaomi-html.js raw-desktop.html -o saida.html
 *        node scripts/clean-xiaomi-html.js raw-desktop.html raw-mobile.html
 *
 * SAIDA:
 *   - <nome>-clean.html (desktop)
 *   - <nome>-clean-mobile.html (se fornecido segundo arquivo)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Config
// ============================================

const KEEP_SCRIPT_CONTENT = [
  /view-height/,
  /rootFontSize/,
  /documentElement[\s\S]*?fontSize/,
];

const KEEP_SCRIPT_SRC = [
  /local-config.*\.js/i,
];

const REMOVE_PATTERNS = [
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
  /cdn\.cookielaw/i,
  /optanon/i,
];

// ============================================
// Limpeza do <head>
// ============================================

function shouldKeepMeta(el) {
  if (/charset/i.test(el)) return true;
  if (/viewport/i.test(el)) return true;
  if (/X-UA-Compatible/i.test(el)) return true;
  if (/theme-color/i.test(el)) return true;
  if (/color-scheme/i.test(el)) return true;
  return false;
}

function shouldKeepLink(el) {
  if (REMOVE_PATTERNS.some(p => p.test(el))) return false;
  if (/rel=["']stylesheet["']/i.test(el)) return true;
  if (/rel=["']preconnect["']/i.test(el)) return true;
  if (/rel=["']dns-prefetch["']/i.test(el)) return true;
  if (/rel=["']preload["']/i.test(el) && /as=["']image["']/i.test(el)) return true;
  if (/rel=["']preload["']/i.test(el) && /as=["']font["']/i.test(el)) return true;
  return false;
}

function shouldKeepScript(el) {
  if (/type=["']application\/ld\+json["']/i.test(el)) return false;

  const srcMatch = el.match(/src=["']([^"']+)["']/i);
  const src = srcMatch ? srcMatch[1] : '';

  if (src) {
    if (REMOVE_PATTERNS.some(p => p.test(src))) return false;
    if (KEEP_SCRIPT_SRC.some(p => p.test(src))) return true;
    return false;
  }

  const content = el.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  if (REMOVE_PATTERNS.some(p => p.test(content))) return false;
  if (KEEP_SCRIPT_CONTENT.some(p => p.test(content))) return true;
  return false;
}

function shouldKeepStyle(el) {
  const content = el.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '').trim();
  if (/imageye/i.test(content)) return false;
  if (content.length > 0) return true;
  return false;
}

function cleanHead(fullHtml) {
  const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch || !headMatch[1]) return '';

  const headContent = headMatch[1];
  const kept = [];
  const seen = new Set();

  // Tags com conteudo (script, style, title)
  const elementRegex = /<(meta|link|script|style|title)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>|>)/gi;
  let match;

  while ((match = elementRegex.exec(headContent)) !== null) {
    const el = match[0].trim();
    const tag = (match[1] || '').toLowerCase();
    if (seen.has(el)) continue;

    let keep = false;
    switch (tag) {
      case 'meta': keep = shouldKeepMeta(el); break;
      case 'link': keep = shouldKeepLink(el); break;
      case 'script': keep = shouldKeepScript(el); break;
      case 'style': keep = shouldKeepStyle(el); break;
      case 'title': keep = true; break;
    }

    if (keep) {
      kept.push(el);
      seen.add(el);
    }
  }

  // Capturar <link> que terminam so com > (sem />)
  const linkRegex = /<link\b[^>]*>/gi;
  while ((match = linkRegex.exec(headContent)) !== null) {
    const el = match[0].trim();
    if (!seen.has(el) && shouldKeepLink(el)) {
      kept.push(el);
      seen.add(el);
    }
  }

  return kept.join('\n');
}

// ============================================
// Extracao do conteudo principal
// ============================================

function extractBalancedTag(html, startPos, tagName) {
  let depth = 0;
  const segment = html.slice(startPos);
  const allTags = new RegExp(`(<${tagName}\\b[^>]*>|</${tagName}>)`, 'gi');
  let match;

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

function extractMainContent(html) {
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

function activateLazyImages(html) {
  let result = html;
  let lazyImgCount = 0;
  let lazySrcsetCount = 0;
  let lazyBgCount = 0;

  // 1) <img data-src="URL"> → <img src="URL">
  //    Se ja tem src, substitui pelo data-src (que e a URL real)
  result = result.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    const dataSrcMatch = attrs.match(/data-src="([^"]+)"/i);
    if (!dataSrcMatch) return match;

    lazyImgCount++;
    let newAttrs = attrs;

    // Remover data-src
    newAttrs = newAttrs.replace(/\s*data-src="[^"]*"/i, '');

    // Substituir ou adicionar src
    if (/\ssrc="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\ssrc="[^"]*"/i, ` src="${dataSrcMatch[1]}"`);
    } else {
      newAttrs = ` src="${dataSrcMatch[1]}"` + newAttrs;
    }

    // Remover classe "lazy" das imgs
    newAttrs = newAttrs.replace(/\bclass="([^"]*)"/i, (m, classes) => {
      const cleaned = classes.replace(/\blazy\b/g, '').replace(/\s+/g, ' ').trim();
      return cleaned ? `class="${cleaned}"` : '';
    });

    return `<img${newAttrs}>`;
  });

  // 2) <source data-srcset="URL"> → <source srcset="URL">
  result = result.replace(/<source\b([^>]*?)>/gi, (match, attrs) => {
    const dataSrcsetMatch = attrs.match(/data-srcset="([^"]+)"/i);
    if (!dataSrcsetMatch) return match;

    lazySrcsetCount++;
    let newAttrs = attrs;

    // Remover data-srcset
    newAttrs = newAttrs.replace(/\s*data-srcset="[^"]*"/i, '');

    // Substituir ou adicionar srcset
    if (/\ssrcset="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\ssrcset="[^"]*"/i, ` srcset="${dataSrcsetMatch[1]}"`);
    } else {
      newAttrs = ` srcset="${dataSrcsetMatch[1]}"` + newAttrs;
    }

    // Remover classe "lazy"
    newAttrs = newAttrs.replace(/\bclass="([^"]*)"/i, (m, classes) => {
      const cleaned = classes.replace(/\blazy\b/g, '').replace(/\s+/g, ' ').trim();
      return cleaned ? `class="${cleaned}"` : '';
    });

    return `<source${newAttrs}>`;
  });

  // 3) data-background-image="URL" → style="background-image: url(URL)"
  //    (divs com backgrounds lazy-loaded via JS)
  result = result.replace(/data-background-image="([^"]+)"/gi, (match, url) => {
    if (!url || url.trim() === '') return '';
    lazyBgCount++;
    return `style="background-image: url('${url}')"`;
  });

  // 4) Remover data-background-image vazios
  result = result.replace(/\s*data-background-image=""\s*/g, ' ');

  // 5) Remover classe "lazy" de divs/sections restantes
  result = result.replace(/<(div|section)\b([^>]*?)>/gi, (match, tag, attrs) => {
    if (!/\blazy\b/.test(attrs)) return match;
    const newAttrs = attrs.replace(/\bclass="([^"]*)"/i, (m, classes) => {
      const cleaned = classes.replace(/\blazy\b/g, '').replace(/\s+/g, ' ').trim();
      return cleaned ? `class="${cleaned}"` : '';
    });
    return `<${tag}${newAttrs}>`;
  });

  return { html: result, lazyImgCount, lazySrcsetCount, lazyBgCount };
}

function sanitizeBody(html) {
  // Primeiro ativar lazy images
  const { html: activatedHtml, lazyImgCount, lazySrcsetCount, lazyBgCount } = activateLazyImages(html);

  if (lazyImgCount + lazySrcsetCount + lazyBgCount > 0) {
    console.log(`   🖼️  Lazy loading corrigido:`);
    if (lazyImgCount > 0) console.log(`      data-src → src:         ${lazyImgCount} imagens`);
    if (lazySrcsetCount > 0) console.log(`      data-srcset → srcset:   ${lazySrcsetCount} sources`);
    if (lazyBgCount > 0) console.log(`      data-background-image:  ${lazyBgCount} backgrounds`);
  }

  return activatedHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<img\b[^>]*(?:width|height)\s*=\s*["']?1["']?\s[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// ============================================
// Deteccao
// ============================================

function detectRemBase(html) {
  const htmlStyleMatch = html.match(/<html[^>]*style="[^"]*font-size:\s*([^;"]+)/i);
  if (htmlStyleMatch && htmlStyleMatch[1]) return htmlStyleMatch[1].trim();

  const calcMatch = html.match(/(\w+)\s*>=\s*(\d+)\s*\?\s*\1\s*\/\s*(\d+)\s*:\s*([\d.]+)/);
  if (calcMatch && calcMatch[3]) {
    return `${Math.round(1920 / parseInt(calcMatch[3]))}px (calc: 100vw / ${calcMatch[3]}, min: ${calcMatch[4]}px)`;
  }

  return null;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match && match[1] ? match[1].trim() : 'Untitled';
}

// ============================================
// Processamento principal
// ============================================

function processFile(inputPath, outputPath) {
  console.log(`\n📄 Lendo: ${inputPath}`);
  const fullHtml = fs.readFileSync(inputPath, 'utf-8');
  const originalSize = Buffer.byteLength(fullHtml, 'utf-8');

  // Titulo
  const title = extractTitle(fullHtml);
  console.log(`   Titulo: ${title}`);

  // Head
  const cleanedHead = cleanHead(fullHtml);

  // Body
  const productHtml = extractMainContent(fullHtml);
  if (!productHtml) {
    console.error('   ❌ Nao encontrou <main> nem fly-birds-page no HTML!');
    process.exit(1);
  }

  const cleanBody = sanitizeBody(productHtml);

  // Montar
  const result = `<head>\n${cleanedHead}\n</head>\n${cleanBody}`;

  // Estatisticas
  const resultSize = Buffer.byteLength(result, 'utf-8');
  const imgCount = (cleanBody.match(/<img\s/gi) || []).length;
  const picCount = (cleanBody.match(/<picture\s/gi) || []).length;
  const linkCount = (cleanedHead.match(/<link[^>]*stylesheet/gi) || []).length;
  const scriptCount = (cleanedHead.match(/<script/gi) || []).length;
  const remBase = detectRemBase(fullHtml);

  // Salvar
  fs.writeFileSync(outputPath, result, 'utf-8');

  console.log(`   ✅ Salvo: ${outputPath}`);
  console.log(`   📊 Estatisticas:`);
  console.log(`      Original:    ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`      Limpo:       ${(resultSize / 1024).toFixed(1)} KB (${Math.round((1 - resultSize / originalSize) * 100)}% reduzido)`);
  console.log(`      Imagens:     ${imgCount} <img>, ${picCount} <picture>`);
  console.log(`      CSS links:   ${linkCount}`);
  console.log(`      Scripts:     ${scriptCount} (estruturais)`);
  console.log(`      Rem base:    ${remBase || 'nao detectado'}`);

  return { title, remBase, imgCount, picCount };
}

// ============================================
// CLI
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🧹 Xiaomi HTML Cleaner para ShopMi                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  USO:                                                        ║
║    node scripts/clean-xiaomi-html.js <desktop.html>          ║
║    node scripts/clean-xiaomi-html.js <desktop.html> -o out   ║
║    node scripts/clean-xiaomi-html.js <desk.html> <mob.html>  ║
║                                                              ║
║  COMO OBTER O HTML:                                          ║
║    1. Abra a pagina do produto no Chrome                     ║
║    2. F12 > Console > cole:                                  ║
║       copy(document.documentElement.outerHTML)               ║
║    3. Salve num arquivo .html                                ║
║                                                              ║
║  DEPOIS:                                                     ║
║    1. Cole o conteudo do arquivo -clean.html                 ║
║       no campo descriptionHtml do Shopify                    ║
║    2. Configure metafields:                                  ║
║       use_custom_rem_base = true                             ║
║       rem_base_font_size = <valor mostrado>                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
  }

  // Parse argumentos
  let desktopInput = null;
  let mobileInput = null;
  let outputOverride = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' || args[i] === '--output') {
      outputOverride = args[i + 1];
      i++;
    } else if (!desktopInput) {
      desktopInput = args[i];
    } else if (!mobileInput) {
      mobileInput = args[i];
    }
  }

  if (!desktopInput) {
    console.error('❌ Forneca pelo menos o arquivo HTML desktop.');
    process.exit(1);
  }

  // Resolver caminhos
  const desktopPath = path.resolve(desktopInput);
  if (!fs.existsSync(desktopPath)) {
    console.error(`❌ Arquivo nao encontrado: ${desktopPath}`);
    process.exit(1);
  }

  // Nome de saida
  const ext = path.extname(desktopPath);
  const base = path.basename(desktopPath, ext);
  const dir = path.dirname(desktopPath);

  const desktopOutput = outputOverride
    ? path.resolve(outputOverride)
    : path.join(dir, `${base}-clean${ext}`);

  console.log('🧹 Xiaomi HTML Cleaner para ShopMi');
  console.log('═'.repeat(50));

  const result = processFile(desktopPath, desktopOutput);

  // Mobile (se fornecido)
  if (mobileInput) {
    const mobilePath = path.resolve(mobileInput);
    if (!fs.existsSync(mobilePath)) {
      console.error(`❌ Arquivo mobile nao encontrado: ${mobilePath}`);
      process.exit(1);
    }

    const mobileBase = path.basename(mobilePath, path.extname(mobilePath));
    const mobileDir = path.dirname(mobilePath);
    const mobileOutput = path.join(mobileDir, `${mobileBase}-clean${path.extname(mobilePath)}`);

    processFile(mobilePath, mobileOutput);
  }

  // Resumo final
  console.log('\n═'.repeat(50));
  console.log('📋 Proximos passos:');
  console.log(`   1. Abra ${desktopOutput}`);
  console.log('   2. Copie todo o conteudo');
  console.log('   3. Cole no campo descriptionHtml do produto no Shopify');
  console.log('   4. Configure metafields do produto:');
  console.log('      • use_custom_rem_base = true');
  if (result.remBase) {
    const pxMatch = result.remBase.match(/^(\d+)px/);
    if (pxMatch) {
      console.log(`      • rem_base_font_size = ${pxMatch[1]}px`);
    } else {
      console.log(`      • rem_base_font_size = ${result.remBase}`);
    }
  }
  console.log('');
}

main();
