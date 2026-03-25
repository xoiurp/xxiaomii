/**
 * AI Transformation Module
 * Usa Workers AI para melhorar SEO e conteúdo para crawlers
 */

import {
  Env,
  BotInfo,
  PageData,
  SEOEnhancements,
  SchemaOrgProduct,
  AITransformError,
  DEFAULT_WORKER_CONFIG,
} from './types';
import { isSearchEngineBot, isTrustedBot } from './bot-detection';

// ============================================
// Main AI Transform Function
// ============================================

export async function enhanceSEOContent(
  originResponse: Response,
  env: Env,
  bot: BotInfo,
  url: URL
): Promise<Response> {
  // Apenas processar para bots de busca confiáveis
  if (!shouldEnhance(bot, env.ENVIRONMENT)) {
    console.log('❌ AI Enhancement SKIP - Bot não confiável:', bot);
    return originResponse;
  }

  console.log('🚀 AI Enhancement INICIANDO para bot:', bot.type);

  try {
    // Ler HTML original
    const html = await originResponse.text();
    console.log('📄 HTML lido, tamanho:', html.length, 'bytes');

    // Verificar se já está em cache
    const cacheKey = `ai:${url.pathname}:${bot.type}`;

    // CACHE TEMPORARIAMENTE DESABILITADO PARA TESTES
    // Motivo: Cache está retornando versão antiga sem transformações
    if (false && env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        console.log('💾 Retornando HTML do CACHE para:', cacheKey);
        console.log('⚠️  ATENÇÃO: Cache pode conter versão antiga sem transformações!');
        return new Response(cached, {
          headers: originResponse.headers,
        });
      }
      console.log('🔄 Cache MISS, processando nova transformação...');
    }
    console.log('⚡ Cache DESABILITADO - processando transformação a cada request');

    // Extrair dados da página
    console.log('📊 Extraindo dados da página...');
    const pageData = extractPageData(html, url);
    console.log('✅ Dados extraídos:', {
      title: pageData.title,
      images: pageData.images?.length || 0,
      hasDescription: !!pageData.description
    });

    // Gerar melhorias com AI
    console.log('🤖 Gerando enhancements...');
    const enhancements = await generateEnhancements(pageData, bot, env);
    console.log('✅ Enhancements gerados:', Object.keys(enhancements));

    // Injetar melhorias no HTML
    console.log('💉 Injetando enhancements no HTML...');
    const enhancedHtml = injectEnhancements(html, enhancements);
    console.log('✅ HTML transformado, tamanho:', enhancedHtml.length, 'bytes');

    // Cachear resultado (DESABILITADO PARA TESTES)
    if (false && env.CACHE) {
      await env.CACHE.put(cacheKey, enhancedHtml, {
        expirationTtl: DEFAULT_WORKER_CONFIG.aiCacheTTL,
      });
      console.log('💾 HTML salvo em cache:', cacheKey);
    }

    // Log analytics (async, não bloquear response)
    if (env.DB) {
      logTransformation(env.DB, {
        url: url.pathname,
        botType: bot.type,
        transformationType: 'ai',
        timestamp: Date.now(),
        cacheHit: false,
      });
    }

    return new Response(enhancedHtml, {
      headers: originResponse.headers,
    });
  } catch (error) {
    console.error('AI transform error:', error);
    // Em caso de erro, retornar HTML original
    return originResponse;
  }
}

// ============================================
// AI Enhancement Generation
// ============================================

async function generateEnhancements(
  pageData: PageData,
  bot: BotInfo,
  env: Env
): Promise<SEOEnhancements> {
  const enhancements: SEOEnhancements = {};

  try {
    // DESABILITADO: Gerar meta description otimizada com AI
    // Motivo: Requer Workers AI pago, e a funcionalidade principal (alt text) não precisa de AI
    // if (env.AI && pageData.description) {
    //   enhancements.metaDescription = await generateMetaDescription(
    //     pageData,
    //     bot,
    //     env.AI
    //   );
    // }

    console.log('📝 Gerando enhancements sem Workers AI...');

    // Gerar Schema.org JSON-LD (sem AI)
    enhancements.schema = generateSchemaOrg(pageData, bot);

    // Gerar Open Graph tags (sem AI)
    enhancements.openGraph = generateOpenGraph(pageData);

    // Gerar keywords relevantes (sem AI)
    enhancements.keywords = extractKeywords(pageData.description || pageData.title);

    // Gerar alt text para imagens (CORE FEATURE - generalização de marcas)
    if (pageData.images && pageData.images.length > 0) {
      console.log('🖼️ Gerando alt texts generalizados para', pageData.images.length, 'imagens');
      enhancements.imageAlt = generateImageAltTexts(pageData, bot);
      console.log('✅ Alt texts gerados:', enhancements.imageAlt);
    }

    return enhancements;
  } catch (error) {
    console.error('Enhancement generation error:', error);
    // Fallback para enhancements básicos sem AI
    return generateBasicEnhancements(pageData, bot);
  }
}

async function generateMetaDescription(
  pageData: PageData,
  bot: BotInfo,
  ai: Ai
): Promise<string> {
  try {
    const prompt = buildMetaDescriptionPrompt(pageData, bot);

    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt,
      max_tokens: 160,
      temperature: 0.7,
    });

    if (response && response.response) {
      // Limpar e validar resposta
      let description = response.response.trim();

      // Remover aspas se presente
      description = description.replace(/^["']|["']$/g, '');

      // Limitar a 155 caracteres
      if (description.length > 155) {
        description = description.substring(0, 152) + '...';
      }

      return description;
    }
  } catch (error) {
    console.error('AI meta description error:', error);
  }

  // Fallback: usar descrição original ou gerar básica
  return generateBasicMetaDescription(pageData);
}

function buildMetaDescriptionPrompt(pageData: PageData, bot: BotInfo): string {
  const botName = bot.type === 'googlebot' ? 'Google' :
                  bot.type === 'bingbot' ? 'Bing' : 'motores de busca';

  return `Você é um especialista em SEO. Crie uma meta description persuasiva e otimizada para ${botName}.

Produto: ${pageData.title}
Descrição: ${pageData.description || 'Produto de qualidade'}
Preço: ${pageData.price ? `R$ ${pageData.price}` : 'Consulte o preço'}
Marca: ${pageData.brand || 'Xiaomi'}

Regras:
- Máximo 155 caracteres
- Incluir call-to-action
- Destacar benefícios principais
- Incluir preço se disponível
- Tom persuasivo mas não spam

Retorne APENAS a meta description, sem aspas ou formatação extra.`;
}

// ============================================
// Schema.org Generation
// ============================================

function generateSchemaOrg(pageData: PageData, bot: BotInfo): SchemaOrgProduct {
  const schema: SchemaOrgProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pageData.title,
    description: pageData.description,
    image: pageData.images,
  };

  // Adicionar ofertas se preço disponível
  if (pageData.price) {
    schema.offers = {
      '@type': 'Offer',
      price: pageData.price,
      priceCurrency: pageData.currency || 'BRL',
      availability: pageData.availability === 'in_stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: pageData.url,
    };
  }

  // Adicionar marca
  if (pageData.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: pageData.brand,
    };
  }

  // Adicionar avaliações (se disponível)
  if (pageData.rating && pageData.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: pageData.rating,
      reviewCount: pageData.reviewCount,
    };
  }

  // Campos extras para Google
  if (bot.type === 'googlebot') {
    // Google valoriza informações detalhadas
    if (pageData.category) {
      (schema as any).category = pageData.category;
    }
  }

  return schema;
}

// ============================================
// Open Graph Generation
// ============================================

function generateOpenGraph(pageData: PageData) {
  return {
    title: pageData.title,
    description: pageData.description,
    image: pageData.images?.[0],
    url: pageData.url,
    type: 'product',
    siteName: 'ShopMi - Xiaomi Oficial',
  };
}

// ============================================
// HTML Injection
// ============================================

function injectEnhancements(html: string, enhancements: SEOEnhancements): string {
  let enhanced = html;

  // 1. Injetar/atualizar meta description
  if (enhancements.metaDescription) {
    enhanced = injectMetaTag(enhanced, 'description', enhancements.metaDescription);
  }

  // 2. Injetar Schema.org JSON-LD
  if (enhancements.schema) {
    const schemaScript = `
<script type="application/ld+json">
${JSON.stringify(enhancements.schema, null, 0)}
</script>`;
    enhanced = injectBeforeClosingHead(enhanced, schemaScript);
  }

  // 3. Injetar Open Graph tags
  if (enhancements.openGraph) {
    enhanced = injectOpenGraphTags(enhanced, enhancements.openGraph);
  }

  // 4. Injetar meta keywords (ainda útil para alguns crawlers)
  if (enhancements.keywords && enhancements.keywords.length > 0) {
    enhanced = injectMetaTag(enhanced, 'keywords', enhancements.keywords.join(', '));
  }

  // 5. Melhorar alt text de imagens
  if (enhancements.imageAlt) {
    enhanced = enhanceImageAltTexts(enhanced, enhancements.imageAlt);
  }

  return enhanced;
}

function injectMetaTag(html: string, name: string, content: string): string {
  const escapedContent = escapeHtml(content);
  const metaTag = `<meta name="${name}" content="${escapedContent}">`;

  // Verificar se já existe
  const existingPattern = new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i');

  if (existingPattern.test(html)) {
    return html.replace(existingPattern, metaTag);
  } else {
    return injectBeforeClosingHead(html, metaTag);
  }
}

function injectOpenGraphTags(html: string, og: any): string {
  let result = html;

  const ogTags = [
    og.title && `<meta property="og:title" content="${escapeHtml(og.title)}">`,
    og.description && `<meta property="og:description" content="${escapeHtml(og.description)}">`,
    og.image && `<meta property="og:image" content="${escapeHtml(og.image)}">`,
    og.url && `<meta property="og:url" content="${escapeHtml(og.url)}">`,
    og.type && `<meta property="og:type" content="${og.type}">`,
    og.siteName && `<meta property="og:site_name" content="${escapeHtml(og.siteName)}">`,
  ].filter(Boolean).join('\n');

  return injectBeforeClosingHead(result, ogTags);
}

function injectBeforeClosingHead(html: string, content: string): string {
  const headClosingTag = '</head>';
  const headIndex = html.indexOf(headClosingTag);

  if (headIndex !== -1) {
    return html.slice(0, headIndex) + content + '\n' + html.slice(headIndex);
  }

  // Fallback: injetar no início do body
  return html.replace('<body>', `<body>\n${content}\n`);
}

function enhanceImageAltTexts(html: string, altTexts: Record<string, string>): string {
  let result = html;
  console.log('🔄 Substituindo alt texts. Total de imagens:', Object.keys(altTexts).length);

  for (const [imageUrl, altText] of Object.entries(altTexts)) {
    // Pattern mais flexível que captura a tag img completa
    const imgPattern = new RegExp(
      `<img([^>]*?)alt=["']([^"']*)["']([^>]*?)>`,
      'gi'
    );

    let replacements = 0;
    result = result.replace(imgPattern, (match, before, oldAlt, after) => {
      // Verificar se a imagem contém a URL que queremos modificar
      if (match.includes(imageUrl) || match.includes(encodeURIComponent(imageUrl))) {
        replacements++;
        console.log(`  ✓ Substituindo alt="${oldAlt}" → alt="${altText}"`);
        return `<img${before}alt="${escapeHtml(altText)}"${after}>`;
      }
      return match;
    });

    if (replacements === 0) {
      console.log(`  ⚠️ Nenhuma substituição feita para URL: ${imageUrl.substring(0, 80)}...`);
    }
  }

  return result;
}

// ============================================
// Data Extraction
// ============================================

function extractPageData(html: string, url: URL): PageData {
  return {
    url: url.href,
    title: extractTitle(html),
    description: extractDescription(html),
    price: extractPrice(html),
    currency: 'BRL',
    images: extractImages(html),
    brand: extractBrand(html),
    category: extractCategory(html),
  };
}

function extractTitle(html: string): string {
  // Primeiro tentar pegar do h1 (título do produto na página)
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match?.[1]) {
    // Remover tags HTML internas se houver
    const h1Text = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (h1Text && h1Text.length > 3) {
      console.log('📌 Título extraído do H1:', h1Text);
      return h1Text;
    }
  }

  // Fallback: pegar do <title>
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || 'Produto';
  console.log('📌 Título extraído do <title>:', title);
  return title;
}

function extractDescription(html: string): string | undefined {
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return metaDescMatch?.[1]?.trim();
}

function extractPrice(html: string): string | undefined {
  // Tentar extrair de meta tags ou Schema.org
  const pricePatterns = [
    /<meta\s+property=["']product:price:amount["']\s+content=["']([^"']+)["']/i,
    /"price":\s*"?(\d+\.?\d*)"?/i,
    /R\$\s*(\d+[.,]\d{2})/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].replace(',', '.');
    }
  }

  return undefined;
}

function extractImages(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const images: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null && images.length < 5) {
    const src = match[1];
    if (src && (src.startsWith('http') || src.startsWith('//'))) {
      images.push(src.startsWith('//') ? 'https:' + src : src);
    }
  }

  return images;
}

function extractBrand(html: string): string | undefined {
  const brandMatch = html.match(/<meta\s+property=["']product:brand["']\s+content=["']([^"']+)["']/i);
  return brandMatch?.[1] || 'Xiaomi';
}

function extractCategory(html: string): string | undefined {
  const categoryMatch = html.match(/<meta\s+property=["']product:category["']\s+content=["']([^"']+)["']/i);
  return categoryMatch?.[1];
}

// ============================================
// Fallback Functions (sem AI)
// ============================================

function generateBasicEnhancements(pageData: PageData, bot?: BotInfo): SEOEnhancements {
  const fallbackBot = bot || { type: 'googlebot' } as BotInfo;

  return {
    metaDescription: generateBasicMetaDescription(pageData),
    schema: generateSchemaOrg(pageData, fallbackBot),
    openGraph: generateOpenGraph(pageData),
    keywords: extractKeywords(pageData.description || pageData.title),
    imageAlt: pageData.images?.length ? generateImageAltTexts(pageData, fallbackBot) : undefined,
  };
}

function generateBasicMetaDescription(pageData: PageData): string {
  let description = pageData.description || pageData.title;

  if (pageData.price) {
    description += ` - R$ ${pageData.price}`;
  }

  description += ' | Compre agora na ShopMi';

  return description.slice(0, 155);
}

function generateImageAltTexts(pageData: PageData, bot?: BotInfo): Record<string, string> {
  const altTexts: Record<string, string> = {};

  pageData.images?.forEach((img, index) => {
    let altText = '';

    // Se for bot, generalizar removendo marcas
    if (bot && bot.isBot && bot.type === 'googlebot') {
      altText = generalizeBrandText(pageData.title, pageData.description);

      if (index === 0) {
        altText += ' - Foto principal do produto';
      } else {
        altText += ` - Visualização ${index + 1}`;
      }
    } else {
      // Para usuários normais, manter original
      altText = index === 0
        ? `${pageData.title} - Imagem principal`
        : `${pageData.title} - Imagem ${index + 1}`;
    }

    altTexts[img] = altText;
  });

  return altTexts;
}

/**
 * Generaliza texto removendo marcas específicas mas mantendo características
 * Exemplo: "Xiaomi Redmi A5 64GB 4G" -> "Smartphone 64GB 4G"
 */
function generalizeBrandText(title: string, description?: string): string {
  // Marcas a remover (case-insensitive)
  const brandsToRemove = [
    'Xiaomi',
    'Redmi',
    'Mi',
    'Poco',
    'Black Shark',
    // Adicione outras marcas que quiser remover
  ];

  // Categorias de produtos para substituição
  // IMPORTANTE: ordem importa! Categorias mais específicas devem vir primeiro
  // para evitar que "Carregador 67W" case com "Smartphone" por causa da descrição
  const categories: Record<string, RegExp[]> = {
    'Carregador': [
      /\b(carregadores?|chargers?|adapters?|fontes?)\b/i,
      /\b\d+\s*w\b/i, // Padrão de potência (67W, 120W) - específico de carregadores
    ],
    'Fone de ouvido': [
      /\b(fones?|headphones?|earphones?|earbuds?|airdots)\b/i,
      /\b(wireless|bluetooth|true wireless)\b/i,
    ],
    'Smartwatch': [
      /\b(smartwatchs?|watchs?|relógios?)\b/i,
      /\b(mi\s*band|smart\s*band|fit)\b/i, // "mi band" como unidade, não só "band"
    ],
    'Tablet': [
      /\b(tablets?|pads?)\b/i,
    ],
    'Notebook': [
      /\b(notebooks?|laptops?)\b/i,
    ],
    'Acessório': [
      /\b(capas?|cases?|películas?|protetores?)\b/i,
    ],
    'Smartphone': [
      /\b(celulares?|smartphones?|telefones?|phones?)\b/i,
      /\b(note|mi|redmi|poco)\s*[a-z]?\d+/i, // A5, Note 10, etc
      /\b(4g|5g)\b/i,
      /\b(android|ios)\b/i,
    ],
  };

  // Detectar categoria do produto
  let category = 'Produto eletrônico';
  const combinedText = `${title} ${description || ''}`.toLowerCase();

  console.log('🔍 Detectando categoria. Texto combinado:', combinedText.substring(0, 100));

  for (const [cat, patterns] of Object.entries(categories)) {
    const matched = patterns.some(pattern => {
      const isMatch = pattern.test(combinedText);
      if (isMatch) {
        console.log(`  ✓ Categoria "${cat}" matched por pattern:`, pattern);
      }
      return isMatch;
    });

    if (matched) {
      category = cat;
      console.log(`✅ Categoria detectada: ${category}`);
      break;
    }
  }

  if (category === 'Produto eletrônico') {
    console.log('⚠️ Nenhuma categoria específica detectada, usando fallback');
  }

  // Remover marcas do título
  let genericTitle = title;
  brandsToRemove.forEach(brand => {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'gi');
    genericTitle = genericTitle.replace(brandRegex, '').trim();
  });

  // Limpar espaços duplos
  genericTitle = genericTitle.replace(/\s+/g, ' ').trim();

  // Extrair especificações técnicas (números, GB, MP, etc)
  const specs: string[] = [];

  // Capacidade de armazenamento
  const storageMatch = title.match(/\b(\d+)\s*(GB|TB|MB)\b/gi);
  if (storageMatch) specs.push(...storageMatch);

  // RAM
  const ramMatch = title.match(/\b(\d+)\s*GB\s*(RAM|de RAM)\b/gi);
  if (ramMatch) specs.push(...ramMatch);

  // Câmera
  const cameraMatch = title.match(/\b(\d+)\s*MP\b/gi);
  if (cameraMatch) specs.push(...cameraMatch);

  // Tecnologia (4G, 5G, WiFi, etc)
  const techMatch = title.match(/\b(4G|5G|WiFi|Bluetooth|NFC)\b/gi);
  if (techMatch) specs.push(...techMatch);

  // Potência (para carregadores)
  const powerMatch = title.match(/\b(\d+)\s*W\b/gi);
  if (powerMatch) specs.push(...powerMatch);

  // Remover palavras da categoria que já aparecem no título genérico para evitar redundância
  // Ex: categoria "Smartwatch" + genericTitle "Band 8 Smartwatch Fitness" → "Band 8 Fitness"
  const categoryWords = category.toLowerCase().split(/\s+/);
  let cleanedTitle = genericTitle;
  categoryWords.forEach(word => {
    if (word.length > 2) {
      cleanedTitle = cleanedTitle.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
    }
  });
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();

  // Construir texto genérico com especificações
  let result = category;

  if (specs.length > 0) {
    result += ' ' + specs.join(' ');
  } else if (cleanedTitle && cleanedTitle.length > 0) {
    // Se não encontrou specs mas sobrou texto, usar o que sobrou (sem redundância)
    result += ' ' + cleanedTitle;
  }

  return result.trim();
}

/**
 * Versão menos agressiva - apenas remove marcas mas mantém mais detalhes
 */
function generalizeBrandTextModerate(title: string): string {
  const brandsToRemove = ['Xiaomi', 'Redmi', 'Mi', 'Poco'];

  let result = title;
  brandsToRemove.forEach(brand => {
    const regex = new RegExp(`\\b${brand}\\b`, 'gi');
    result = result.replace(regex, '').trim();
  });

  return result.replace(/\s+/g, ' ').trim();
}

function extractKeywords(text: string): string[] {
  // Extração simples de palavras relevantes
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  // Remover duplicatas e limitar
  return [...new Set(words)].slice(0, 10);
}

// ============================================
// Utilities
// ============================================

function shouldEnhance(bot: BotInfo, environment?: string): boolean {
  const isDev = environment === 'development';
  return (
    bot.isBot &&
    isTrustedBot(bot, isDev) &&
    isSearchEngineBot(bot)
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function logTransformation(db: D1Database, data: any): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO transformations (url, bot_type, transformation_type, timestamp, cache_hit)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        data.url,
        data.botType,
        data.transformationType,
        data.timestamp,
        data.cacheHit ? 1 : 0
      )
      .run();
  } catch (error) {
    console.error('Failed to log transformation:', error);
  }
}

// ============================================
// Export utilities
// ============================================

export function isProductPage(url: URL): boolean {
  return url.pathname.startsWith('/products/') ||
         url.pathname.includes('/product/');
}

export function shouldUseAI(env: Env): boolean {
  return Boolean(env.AI);
}
