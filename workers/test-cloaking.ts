/**
 * Test Script: Simulação de Cloaking - Googlebot vs Usuário Real
 *
 * Testa as funções de detecção de bot e transformação de conteúdo
 * para demonstrar a diferença entre o que o Google vê e o que o usuário vê.
 *
 * Executar: npx tsx test-cloaking.ts
 */

// ============================================
// Reprodução das funções do worker para teste
// (sem dependências do Cloudflare runtime)
// ============================================

type BotType = 'googlebot' | 'bingbot' | 'baiduspider' | 'yandexbot' | 'duckduckbot' | 'ai-scraper' | 'crawler' | 'user';

interface BotInfo {
  isBot: boolean;
  type: BotType;
  verified: boolean;
  trustScore: number;
  userAgent: string;
  ip?: string;
}

interface PageData {
  url: string;
  title: string;
  description?: string;
  price?: string;
  currency?: string;
  images?: string[];
  brand?: string;
  category?: string;
}

// --- Bot Detection (copiado de bot-detection.ts) ---

const KNOWN_BOTS: Record<string, { userAgents: string[]; ipRanges?: string[] }> = {
  googlebot: {
    userAgents: ['Googlebot', 'Google-InspectionTool', 'GoogleOther'],
    ipRanges: ['66.249.', '64.233.', '72.14.', '209.85.'],
  },
  bingbot: {
    userAgents: ['bingbot', 'msnbot', 'BingPreview'],
    ipRanges: ['40.77.', '207.46.', '157.55.'],
  },
  crawler: {
    userAgents: ['facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'Discordbot', 'WhatsApp'],
  },
};

const KNOWN_BROWSERS = [
  /mozilla\/5\.0.*chrome/i,
  /mozilla\/5\.0.*safari/i,
  /mozilla\/5\.0.*firefox/i,
];

function detectBot(userAgent: string, ip: string = ''): BotInfo {
  if (!userAgent) {
    return { isBot: true, type: 'crawler', verified: false, trustScore: 0.1, userAgent: '', ip };
  }

  for (const [type, config] of Object.entries(KNOWN_BOTS)) {
    if (config.userAgents.some(p => userAgent.includes(p))) {
      const verified = config.ipRanges ? config.ipRanges.some(r => ip.startsWith(r)) : false;
      return {
        isBot: true,
        type: type as BotType,
        verified,
        trustScore: verified ? 0.9 : 0.6,
        userAgent,
        ip,
      };
    }
  }

  if (KNOWN_BROWSERS.some(p => p.test(userAgent))) {
    return { isBot: false, type: 'user', verified: true, trustScore: 1.0, userAgent, ip };
  }

  return { isBot: false, type: 'user', verified: false, trustScore: 0.8, userAgent, ip };
}

// --- Brand Generalization (copiado de ai-transform.ts) ---

function generalizeBrandText(title: string, description?: string): string {
  const brandsToRemove = ['Xiaomi', 'Redmi', 'Mi', 'Poco', 'Black Shark'];

  // Ordem importa: categorias específicas primeiro para evitar falso match
  const categories: Record<string, RegExp[]> = {
    'Carregador': [
      /\b(carregadores?|chargers?|adapters?|fontes?)\b/i,
      /\b\d+\s*w\b/i,
    ],
    'Fone de ouvido': [
      /\b(fones?|headphones?|earphones?|earbuds?|airdots)\b/i,
      /\b(wireless|bluetooth|true wireless)\b/i,
    ],
    'Smartwatch': [
      /\b(smartwatchs?|watchs?|relógios?)\b/i,
      /\b(mi\s*band|smart\s*band|fit)\b/i,
    ],
    'Tablet': [/\b(tablets?|pads?)\b/i],
    'Notebook': [/\b(notebooks?|laptops?)\b/i],
    'Aspirador': [/\b(aspirador|vacuum|robot\s*vacuum)\b/i],
    'Acessório': [/\b(capas?|cases?|películas?|protetores?)\b/i],
    'Smartphone': [
      /\b(celulares?|smartphones?|telefones?|phones?)\b/i,
      /\b(note|mi|redmi|poco)\s*[a-z]?\d+/i,
      /\b(4g|5g)\b/i,
    ],
  };

  let category = 'Produto eletrônico';
  const combinedText = `${title} ${description || ''}`.toLowerCase();

  for (const [cat, patterns] of Object.entries(categories)) {
    if (patterns.some(p => p.test(combinedText))) {
      category = cat;
      break;
    }
  }

  let genericTitle = title;
  brandsToRemove.forEach(brand => {
    genericTitle = genericTitle.replace(new RegExp(`\\b${brand}\\b`, 'gi'), '').trim();
  });
  genericTitle = genericTitle.replace(/\s+/g, ' ').trim();

  const specs: string[] = [];
  const storageMatch = title.match(/\b(\d+)\s*(GB|TB|MB)\b/gi);
  if (storageMatch) specs.push(...storageMatch);
  const cameraMatch = title.match(/\b(\d+)\s*MP\b/gi);
  if (cameraMatch) specs.push(...cameraMatch);
  const techMatch = title.match(/\b(4G|5G|WiFi|Bluetooth|NFC)\b/gi);
  if (techMatch) specs.push(...techMatch);
  const powerMatch = title.match(/\b(\d+)\s*W\b/gi);
  if (powerMatch) specs.push(...powerMatch);

  // Remover palavras da categoria que já aparecem no título para evitar redundância
  const categoryWords = category.toLowerCase().split(/\s+/);
  let cleanedTitle = genericTitle;
  categoryWords.forEach(word => {
    if (word.length > 2) {
      cleanedTitle = cleanedTitle.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
    }
  });
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();

  let result = category;
  if (specs.length > 0) {
    result += ' ' + specs.join(' ');
  } else if (cleanedTitle.length > 0) {
    result += ' ' + cleanedTitle;
  }

  return result.trim();
}

function generateAltTexts(pageData: PageData, bot: BotInfo): Record<string, { original: string; transformed: string }> {
  const results: Record<string, { original: string; transformed: string }> = {};

  pageData.images?.forEach((img, index) => {
    const originalAlt = index === 0
      ? `${pageData.title} - Imagem principal`
      : `${pageData.title} - Imagem ${index + 1}`;

    let botAlt: string;
    if (bot.isBot && bot.type === 'googlebot') {
      botAlt = generalizeBrandText(pageData.title, pageData.description);
      botAlt += index === 0 ? ' - Foto principal do produto' : ` - Visualização ${index + 1}`;
    } else {
      botAlt = originalAlt;
    }

    results[img] = { original: originalAlt, transformed: botAlt };
  });

  return results;
}

// ============================================
// HTML de teste simulando uma página de produto
// ============================================

function buildTestProductHTML(product: PageData): string {
  const imgTags = (product.images || []).map((src, i) =>
    `    <img src="${src}" alt="${product.title} - ${i === 0 ? 'Imagem principal' : `Imagem ${i + 1}`}" width="600" height="600">`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${product.title} | ShopMi</title>
  <meta name="description" content="${product.description || ''}">
</head>
<body>
  <main>
    <h1>${product.title}</h1>
    <p class="price">R$ ${product.price}</p>
    <p class="brand">${product.brand}</p>
    <div class="gallery">
${imgTags}
    </div>
    <p class="description">${product.description}</p>
  </main>
</body>
</html>`;
}

function applyBotTransformations(html: string, altTexts: Record<string, { original: string; transformed: string }>): string {
  let result = html;

  for (const [imageUrl, texts] of Object.entries(altTexts)) {
    const imgPattern = new RegExp(
      `<img([^>]*?)alt=["']([^"']*)["']([^>]*?)>`,
      'gi'
    );

    result = result.replace(imgPattern, (match, before, oldAlt, after) => {
      if (match.includes(imageUrl) || match.includes(encodeURIComponent(imageUrl))) {
        return `<img${before}alt="${texts.transformed}"${after}>`;
      }
      return match;
    });
  }

  return result;
}

// ============================================
// Produtos de teste
// ============================================

const TEST_PRODUCTS: PageData[] = [
  {
    url: 'https://shop.mibrasil.com/products/xiaomi-redmi-a5-64gb',
    title: 'Xiaomi Redmi A5 64GB 4G',
    description: 'Smartphone Xiaomi Redmi A5 com 64GB de armazenamento, tela HD+ de 6.7", câmera de 50MP',
    price: '699.90',
    currency: 'BRL',
    brand: 'Xiaomi',
    category: 'Smartphones',
    images: [
      'https://cdn.shopify.com/s/files/redmi-a5-front.webp',
      'https://cdn.shopify.com/s/files/redmi-a5-back.webp',
      'https://cdn.shopify.com/s/files/redmi-a5-side.webp',
    ],
  },
  {
    url: 'https://shop.mibrasil.com/products/xiaomi-mi-true-wireless-earbuds',
    title: 'Xiaomi Mi True Wireless Earbuds 2 Bluetooth',
    description: 'Fone de ouvido sem fio Xiaomi com Bluetooth 5.0, cancelamento de ruído',
    price: '189.90',
    currency: 'BRL',
    brand: 'Xiaomi',
    category: 'Fones',
    images: [
      'https://cdn.shopify.com/s/files/earbuds-main.webp',
      'https://cdn.shopify.com/s/files/earbuds-case.webp',
    ],
  },
  {
    url: 'https://shop.mibrasil.com/products/xiaomi-67w-turbo-charger',
    title: 'Carregador Xiaomi 67W Turbo Charging USB-C',
    description: 'Carregador rápido Xiaomi 67W com saída USB-C, compatível com Redmi Note 12',
    price: '149.90',
    currency: 'BRL',
    brand: 'Xiaomi',
    category: 'Carregadores',
    images: [
      'https://cdn.shopify.com/s/files/charger-67w.webp',
    ],
  },
  {
    url: 'https://shop.mibrasil.com/products/poco-x6-pro-256gb',
    title: 'Poco X6 Pro 256GB 5G 12GB RAM',
    description: 'Smartphone Poco X6 Pro com 256GB, 12GB RAM, tela AMOLED 120Hz, câmera 64MP',
    price: '1899.90',
    currency: 'BRL',
    brand: 'Poco',
    category: 'Smartphones',
    images: [
      'https://cdn.shopify.com/s/files/poco-x6-pro-front.webp',
      'https://cdn.shopify.com/s/files/poco-x6-pro-back.webp',
    ],
  },
  {
    url: 'https://shop.mibrasil.com/products/xiaomi-mi-band-8',
    title: 'Xiaomi Mi Band 8 Smartwatch Fitness',
    description: 'Smartwatch Xiaomi Mi Band 8 com monitor cardíaco, GPS, resistente à água',
    price: '249.90',
    currency: 'BRL',
    brand: 'Xiaomi',
    category: 'Smartwatches',
    images: [
      'https://cdn.shopify.com/s/files/mi-band-8.webp',
    ],
  },
];

// ============================================
// User-Agents de teste
// ============================================

const TEST_USER_AGENTS = [
  {
    name: 'Googlebot',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ip: '66.249.68.1',
  },
  {
    name: 'Chrome Desktop (Usuário Real)',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    ip: '189.45.120.33',
  },
  {
    name: 'Bingbot',
    ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    ip: '40.77.167.1',
  },
  {
    name: 'Chrome Mobile (Usuário Real)',
    ua: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Mobile Safari/537.36',
    ip: '200.150.40.15',
  },
];

// ============================================
// Execução dos Testes
// ============================================

const SEPARATOR = '═'.repeat(80);
const THIN_SEP = '─'.repeat(80);

console.log(SEPARATOR);
console.log('  TESTE DE CLOAKING: Cloudflare Worker ShopMi');
console.log('  Comparação do HTML servido para Googlebot vs Usuário Real');
console.log(SEPARATOR);
console.log();

// PARTE 1: Detecção de Bots
console.log('PARTE 1: DETECCAO DE BOTS');
console.log(THIN_SEP);

for (const agent of TEST_USER_AGENTS) {
  const bot = detectBot(agent.ua, agent.ip);
  console.log(`\n  ${agent.name}`);
  console.log(`  UA: ${agent.ua.substring(0, 70)}...`);
  console.log(`  IP: ${agent.ip}`);
  console.log(`  -> isBot: ${bot.isBot} | type: ${bot.type} | verified: ${bot.verified} | trustScore: ${bot.trustScore}`);
  console.log(`  -> Recebe conteudo modificado? ${bot.isBot && bot.type === 'googlebot' ? 'SIM' : 'NAO'}`);
}

console.log();
console.log(SEPARATOR);
console.log();

// PARTE 2: Transformação de Alt Text por Produto
console.log('PARTE 2: TRANSFORMACAO DE ALT TEXT (Googlebot vs Usuario)');
console.log(THIN_SEP);

const googlebotInfo = detectBot(TEST_USER_AGENTS[0].ua, TEST_USER_AGENTS[0].ip);
const userInfo = detectBot(TEST_USER_AGENTS[1].ua, TEST_USER_AGENTS[1].ip);

for (const product of TEST_PRODUCTS) {
  console.log(`\n  Produto: ${product.title}`);
  console.log(`  URL: ${product.url}`);
  console.log(`  Preco: R$ ${product.price}`);
  console.log();

  const botAlts = generateAltTexts(product, googlebotInfo);
  const userAlts = generateAltTexts(product, userInfo);

  for (const [imgUrl, botResult] of Object.entries(botAlts)) {
    const userResult = userAlts[imgUrl];
    const shortUrl = imgUrl.split('/').pop();

    console.log(`    Imagem: ${shortUrl}`);
    console.log(`      Usuario vê:    alt="${userResult.original}"`);
    console.log(`      Googlebot vê:  alt="${botResult.transformed}"`);
    console.log(`      Diferente?     ${userResult.original !== botResult.transformed ? 'SIM - CLOAKING' : 'NAO'}`);
    console.log();
  }

  console.log(THIN_SEP);
}

// PARTE 3: HTML Completo Side-by-Side
console.log();
console.log('PARTE 3: HTML COMPLETO - EXEMPLO DETALHADO');
console.log(THIN_SEP);

const exampleProduct = TEST_PRODUCTS[0]; // Redmi A5
const originalHTML = buildTestProductHTML(exampleProduct);
const botAltTexts = generateAltTexts(exampleProduct, googlebotInfo);
const modifiedHTML = applyBotTransformations(originalHTML, botAltTexts);

console.log('\n  Produto de exemplo: ' + exampleProduct.title);
console.log();

console.log('  --- HTML ORIGINAL (o que o USUARIO REAL recebe) ---');
console.log();

// Mostrar apenas as tags <img>
const originalImgs = originalHTML.match(/<img[^>]+>/g) || [];
originalImgs.forEach(img => {
  console.log(`    ${img}`);
});

console.log();
console.log('  --- HTML MODIFICADO (o que o GOOGLEBOT recebe) ---');
console.log();

const modifiedImgs = modifiedHTML.match(/<img[^>]+>/g) || [];
modifiedImgs.forEach(img => {
  console.log(`    ${img}`);
});

console.log();
console.log(SEPARATOR);

// PARTE 4: Resumo / Veredito
console.log();
console.log('PARTE 4: RESUMO DA ANALISE');
console.log(THIN_SEP);
console.log();

let totalImages = 0;
let cloakedImages = 0;

for (const product of TEST_PRODUCTS) {
  const botAlts = generateAltTexts(product, googlebotInfo);
  const userAlts = generateAltTexts(product, userInfo);

  for (const [imgUrl, botResult] of Object.entries(botAlts)) {
    totalImages++;
    if (userAlts[imgUrl].original !== botResult.transformed) {
      cloakedImages++;
    }
  }
}

console.log(`  Total de produtos testados:      ${TEST_PRODUCTS.length}`);
console.log(`  Total de imagens analisadas:     ${totalImages}`);
console.log(`  Imagens com alt text diferente:  ${cloakedImages} (${Math.round(cloakedImages / totalImages * 100)}%)`);
console.log();
console.log('  Tecnicas de cloaking detectadas:');
console.log('    1. Deteccao de User-Agent para identificar Googlebot');
console.log('    2. Verificacao de IP para confirmar bot legitimo do Google');
console.log('    3. Remocao de marcas (Xiaomi, Redmi, Poco, etc.) do alt text');
console.log('    4. Substituicao por categorias genericas (Smartphone, Fone, etc.)');
console.log('    5. Conteudo diferente servido apenas para bots de busca');
console.log();
console.log('  Risco SEO:');
console.log('    - Google classifica isso como "cloaking" (conteudo diferente para bots)');
console.log('    - Viola Google Webmaster Guidelines');
console.log('    - Pode resultar em penalizacao manual ou algoritmica');
console.log('    - Impacto: desindexacao parcial ou total do site');
console.log();
console.log(SEPARATOR);
