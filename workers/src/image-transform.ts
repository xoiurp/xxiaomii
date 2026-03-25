/**
 * Image Transformation Module
 * Integração com Cloudflare Images API para otimização de imagens
 */

import {
  Env,
  ImageTransformOptions,
  ImageTransformResult,
  ImageTransformError,
  DEFAULT_WORKER_CONFIG,
} from './types';

// ============================================
// Main Image Transform Function
// ============================================

export async function transformImage(
  request: Request,
  env: Env,
  isBot: boolean
): Promise<Response> {
  const url = new URL(request.url);

  try {
    // Extrair URL original da imagem
    const imageUrl = extractImageUrl(url);
    if (!imageUrl) {
      console.error('No image URL found in request');
      return fetchOriginal(request);
    }

    // Validar URL da imagem
    if (!isValidImageUrl(imageUrl)) {
      console.error('Invalid image URL:', imageUrl);
      return fetchOriginal(request);
    }

    // Extrair opções de transformação
    const options = parseTransformOptions(url, isBot);

    // Gerar cache key único
    const cacheKey = generateCacheKey(imageUrl, options);

    // Verificar cache KV (se disponível)
    if (env.CACHE) {
      const cached = await getCachedImage(env.CACHE, cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Transformar imagem
    let transformedResponse: Response;

    if (env.CF_ACCOUNT_HASH && env.CF_IMAGES_TOKEN) {
      // Usar Cloudflare Images API
      transformedResponse = await transformViaCloudflareImages(
        imageUrl,
        options,
        env
      );
    } else {
      // Fallback: usar Cloudflare Image Resizing (incluído no Workers)
      transformedResponse = await transformViaImageResizing(
        imageUrl,
        options
      );
    }

    // Cachear resultado (se disponível)
    if (env.CACHE && transformedResponse.ok) {
      await cacheImage(
        env.CACHE,
        cacheKey,
        transformedResponse.clone(),
        DEFAULT_WORKER_CONFIG.imageCacheTTL
      );
    }

    return transformedResponse;
  } catch (error) {
    console.error('Image transform error:', error);

    // Fallback para imagem original em caso de erro
    return fetchOriginal(request);
  }
}

// ============================================
// Cloudflare Images API
// ============================================

async function transformViaCloudflareImages(
  imageUrl: string,
  options: ImageTransformOptions,
  env: Env
): Promise<Response> {
  if (!env.CF_ACCOUNT_HASH) {
    throw new ImageTransformError('CF_ACCOUNT_HASH not configured');
  }

  // Construir URL da Cloudflare Images
  const cfImageUrl = buildCloudflareImageUrl(imageUrl, options, env.CF_ACCOUNT_HASH);

  // Fazer request
  const response = await fetch(cfImageUrl, {
    headers: {
      'Authorization': `Bearer ${env.CF_IMAGES_TOKEN || ''}`,
    },
    cf: {
      cacheEverything: true,
      cacheTtl: DEFAULT_WORKER_CONFIG.imageCacheTTL,
    },
  });

  if (!response.ok) {
    console.error('Cloudflare Images API error:', response.status);
    throw new ImageTransformError(
      `Cloudflare Images API returned ${response.status}`
    );
  }

  return addImageHeaders(response, true);
}

function buildCloudflareImageUrl(
  originalUrl: string,
  options: ImageTransformOptions,
  accountHash: string
): string {
  // Cloudflare Images URL format:
  // https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT>

  // Encode original URL como identifier
  const imageId = encodeImageIdentifier(originalUrl);

  // Build transformation parameters
  const params: string[] = [];

  if (options.width) params.push(`w=${options.width}`);
  if (options.height) params.push(`h=${options.height}`);
  if (options.quality) params.push(`q=${options.quality}`);
  if (options.format && options.format !== 'auto') params.push(`f=${options.format}`);
  if (options.fit) params.push(`fit=${options.fit}`);
  if (options.gravity) params.push(`gravity=${options.gravity}`);
  if (options.blur) params.push(`blur=${options.blur}`);
  if (options.sharpen) params.push(`sharpen=${options.sharpen}`);

  const variant = params.length > 0 ? params.join(',') : 'public';

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

// ============================================
// Cloudflare Image Resizing (Fallback)
// ============================================

async function transformViaImageResizing(
  imageUrl: string,
  options: ImageTransformOptions
): Promise<Response> {
  // Usar Image Resizing do Cloudflare (incluído em todos os planos Workers)
  // Docs: https://developers.cloudflare.com/images/image-resizing/

  const imageRequest = new Request(imageUrl);

  const response = await fetch(imageRequest, {
    cf: {
      image: {
        width: options.width,
        height: options.height,
        quality: options.quality || DEFAULT_WORKER_CONFIG.defaultImageQuality,
        format: options.format === 'auto' || options.format === 'gif' ? undefined : options.format as 'webp' | 'avif' | 'jpeg' | 'png',
        fit: options.fit || 'scale-down',
        gravity: options.gravity,
        blur: options.blur,
        sharpen: options.sharpen,
      },
    },
  });

  if (!response.ok) {
    throw new ImageTransformError(
      `Image resizing failed: ${response.status}`
    );
  }

  return addImageHeaders(response, false);
}

// ============================================
// Cache Management
// ============================================

async function getCachedImage(
  kv: KVNamespace,
  cacheKey: string
): Promise<Response | null> {
  try {
    const cached = await kv.get(cacheKey, { type: 'arrayBuffer', cacheTtl: 3600 });

    if (!cached) {
      return null;
    }

    // Incrementar hit count (async)
    kv.get(cacheKey + ':meta', 'json').then((meta: any) => {
      if (meta) {
        meta.hitCount = (meta.hitCount || 0) + 1;
        meta.lastAccessed = Date.now();
        kv.put(cacheKey + ':meta', JSON.stringify(meta), {
          expirationTtl: DEFAULT_WORKER_CONFIG.imageCacheTTL,
        });
      }
    });

    return new Response(cached, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'HIT',
        'X-Cache-Source': 'KV',
      },
    });
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function cacheImage(
  kv: KVNamespace,
  cacheKey: string,
  response: Response,
  ttl: number
): Promise<void> {
  try {
    const imageData = await response.arrayBuffer();

    // Armazenar imagem
    await kv.put(cacheKey, imageData, {
      expirationTtl: ttl,
    });

    // Armazenar metadata
    const metadata = {
      size: imageData.byteLength,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
      hitCount: 0,
      lastAccessed: Date.now(),
    };

    await kv.put(cacheKey + ':meta', JSON.stringify(metadata), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error('Cache write error:', error);
    // Não falhar request se cache falhar
  }
}

// ============================================
// Helper Functions
// ============================================

function extractImageUrl(url: URL): string | null {
  // Caso 1: Proxy path /_img?url=...
  if (url.pathname === '/_img') {
    return url.searchParams.get('url');
  }

  // Caso 2: Proxy path /_img/<encoded-url>
  if (url.pathname.startsWith('/_img/')) {
    try {
      return decodeURIComponent(url.pathname.replace('/_img/', ''));
    } catch {
      return null;
    }
  }

  // Caso 3: URL completa (quando Worker intercepta CDN Shopify)
  if (url.hostname.includes('cdn.shopify.com') ||
      url.hostname.includes('myshopify.com')) {
    return url.href;
  }

  return null;
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Verificar protocolo
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Verificar extensão (opcional, muitas URLs não têm extensão)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    const hasValidExtension = validExtensions.some(ext =>
      parsed.pathname.toLowerCase().endsWith(ext)
    );

    // Aceitar URLs sem extensão (muitos CDNs)
    return true;
  } catch {
    return false;
  }
}

function parseTransformOptions(
  url: URL,
  isBot: boolean
): ImageTransformOptions {
  const params = url.searchParams;

  // Width e Height
  const width = parseInt(params.get('w') || params.get('width') || '0') || undefined;
  const height = parseInt(params.get('h') || params.get('height') || '0') || undefined;

  // Quality (reduzir para bots)
  let quality = parseInt(params.get('q') || params.get('quality') || '0');
  if (!quality || quality > 100) {
    quality = DEFAULT_WORKER_CONFIG.defaultImageQuality;
  }

  if (isBot) {
    quality = Math.max(quality - DEFAULT_WORKER_CONFIG.botQualityReduction, 40);
  }

  // Format
  let format = (params.get('f') || params.get('format') || 'auto') as ImageTransformOptions['format'];
  if (!['auto', 'webp', 'avif', 'jpeg', 'png', 'gif'].includes(format || '')) {
    format = 'auto';
  }

  // Fit
  let fit = (params.get('fit') || 'scale-down') as ImageTransformOptions['fit'];
  if (!['scale-down', 'contain', 'cover', 'crop', 'pad'].includes(fit || '')) {
    fit = 'scale-down';
  }

  // Gravity
  let gravity = params.get('gravity') as ImageTransformOptions['gravity'];
  if (gravity && !['auto', 'center', 'left', 'right', 'top', 'bottom'].includes(gravity)) {
    gravity = undefined;
  }

  // Effects
  const blur = parseInt(params.get('blur') || '0') || undefined;
  const sharpen = parseInt(params.get('sharpen') || '0') || undefined;

  // Limitar dimensões máximas
  const maxWidth = DEFAULT_WORKER_CONFIG.maxImageWidth;
  const maxHeight = DEFAULT_WORKER_CONFIG.maxImageHeight;

  return {
    width: width && width <= maxWidth ? width : undefined,
    height: height && height <= maxHeight ? height : undefined,
    quality,
    format,
    fit,
    gravity,
    blur,
    sharpen,
  };
}

function generateCacheKey(url: string, options: ImageTransformOptions): string {
  // Normalizar para evitar duplicatas de cache
  const normalized = {
    url: url.toLowerCase(),
    w: options.width || 'auto',
    h: options.height || 'auto',
    q: Math.round((options.quality || 85) / 5) * 5, // Round to nearest 5
    f: options.format || 'auto',
    fit: options.fit || 'scale-down',
  };

  return `img:v1:${JSON.stringify(normalized)}`;
}

function encodeImageIdentifier(url: string): string {
  // Encode URL para usar como identifier
  // Remove caracteres não permitidos
  return btoa(url)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function addImageHeaders(response: Response, fromCloudflareImages: boolean): Response {
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  newResponse.headers.set('X-Transform-Source', fromCloudflareImages ? 'cf-images' : 'cf-resizing');
  newResponse.headers.set('X-Cache', 'MISS');

  // Adicionar CORS se necessário
  newResponse.headers.set('Access-Control-Allow-Origin', '*');

  return newResponse;
}

async function fetchOriginal(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const originalUrl = extractImageUrl(url);

  if (originalUrl) {
    return fetch(originalUrl, {
      headers: request.headers,
    });
  }

  return new Response('Image not found', { status: 404 });
}

// ============================================
// Export utilities
// ============================================

export function isImageRequest(url: URL): boolean {
  return url.pathname.startsWith('/_img') ||
         url.hostname.includes('cdn.shopify.com') ||
         url.hostname.includes('myshopify.com');
}

export async function getImageInfo(imageUrl: string): Promise<any> {
  // Obter informações sobre a imagem (tamanho, formato, etc)
  const response = await fetch(imageUrl, { method: 'HEAD' });

  return {
    contentType: response.headers.get('Content-Type'),
    contentLength: parseInt(response.headers.get('Content-Length') || '0'),
    lastModified: response.headers.get('Last-Modified'),
  };
}
