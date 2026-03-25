/**
 * Custom Image Loader para Next.js
 * Integração com Cloudflare Workers para otimização de imagens
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Cloudflare Workers Image Loader
 *
 * Este loader roteia todas as imagens através do Cloudflare Worker
 * para aplicar otimizações automáticas (resize, format conversion, quality)
 */
export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Verificar se estamos em desenvolvimento local
  const isDevelopment = process.env.NODE_ENV === 'development';
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || '';

  // Em desenvolvimento, se não tiver worker configurado, retornar src original
  if (isDevelopment && !workerUrl) {
    // Fallback para Next.js Image Optimization
    return src;
  }

  // Se for URL absoluta externa (Shopify, CDNs, etc)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return buildWorkerImageUrl(src, width, quality, workerUrl);
  }

  // Se for URL relativa (imagens locais)
  if (src.startsWith('/')) {
    // Em produção, usar worker
    if (!isDevelopment && workerUrl) {
      // Construir URL completa da imagem local
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const fullUrl = `${baseUrl}${src}`;
      return buildWorkerImageUrl(fullUrl, width, quality, workerUrl);
    }

    // Em desenvolvimento, adicionar parâmetros de otimização
    return `${src}?w=${width}&q=${quality || 85}`;
  }

  // Fallback padrão
  return src;
}

/**
 * Constrói URL para o Worker de imagens
 */
function buildWorkerImageUrl(
  imageUrl: string,
  width: number,
  quality?: number,
  workerUrl?: string
): string {
  // Se não tiver worker URL, retornar original
  if (!workerUrl) {
    return imageUrl;
  }

  // Construir URL do worker com parâmetros
  const params = new URLSearchParams({
    url: imageUrl,
    w: width.toString(),
    q: (quality || 85).toString(),
    f: 'auto', // auto format (WebP/AVIF)
    fit: 'scale-down',
  });

  return `${workerUrl}/_img?${params.toString()}`;
}

/**
 * Loader alternativo para usar diretamente Cloudflare Images API
 * (requer configuração de conta Cloudflare Images)
 */
export function cloudflareImagesLoader({ src, width, quality }: ImageLoaderProps): string {
  const accountHash = process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH;

  if (!accountHash) {
    console.warn('CF_ACCOUNT_HASH not configured, falling back to default loader');
    return cloudflareImageLoader({ src, width, quality });
  }

  // Encode a URL da imagem original
  const imageId = encodeImageId(src);

  // Cloudflare Images variant format
  const variant = `w=${width},q=${quality || 85},f=auto`;

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Encode URL para usar como ID no Cloudflare Images
 */
function encodeImageId(url: string): string {
  try {
    return btoa(url)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    // Fallback se btoa falhar
    return encodeURIComponent(url);
  }
}

/**
 * Loader para Shopify CDN específico
 * Usa transformações nativas do Shopify quando possível
 */
export function shopifyImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Verificar se é URL do Shopify CDN
  if (!src.includes('cdn.shopify.com') && !src.includes('myshopify.com')) {
    return cloudflareImageLoader({ src, width, quality });
  }

  try {
    const url = new URL(src);

    // Adicionar/atualizar parâmetros de transformação do Shopify
    url.searchParams.set('width', width.toString());

    if (quality) {
      // Shopify não tem parâmetro de quality direto, mas podemos usar format
      url.searchParams.set('format', 'pjpg'); // Progressive JPEG
    }

    return url.toString();
  } catch {
    // Se parsing falhar, retornar original
    return src;
  }
}
