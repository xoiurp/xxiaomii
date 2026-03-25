/**
 * ShopMi Edge Workers - Main Entry Point
 * Cloudflare Workers para otimização de imagens e conteúdo com AI
 */

import { Env, RequestContext, DEFAULT_WORKER_CONFIG } from './types';
import { detectBot, shouldOptimizeForBot } from './bot-detection';
import { transformImage, isImageRequest } from './image-transform';
import { enhanceSEOContent, isProductPage } from './ai-transform';
import { handleExtractProduct } from './extract-product';

// ============================================
// Worker Export Default
// ============================================

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);

    try {
      // Detectar tipo de cliente (bot ou usuário)
      const bot = detectBot(request);

      // Criar contexto da requisição
      const reqCtx: RequestContext = {
        request,
        env,
        ctx,
        url,
        bot,
        startTime,
      };

      // ============================================
      // ROUTE 1: Health Check / Status
      // ============================================
      if (url.pathname === '/health' || url.pathname === '/_health') {
        return handleHealthCheck(env);
      }

      // ============================================
      // ROUTE 2: Analytics API (opcional)
      // ============================================
      if (url.pathname === '/api/analytics' || url.pathname === '/_analytics') {
        return handleAnalytics(env);
      }

      // ============================================
      // ROUTE 3: Image Transformation
      // ============================================
      if (isImageRequest(url)) {
        if (!DEFAULT_WORKER_CONFIG.enableImageTransform) {
          return proxyToOrigin(reqCtx);
        }

        return transformImage(request, env, bot.isBot);
      }

      // ============================================
      // ROUTE 4: Static Assets (Cache Agressivo)
      // ============================================
      if (isStaticAsset(url)) {
        return handleStaticAsset(request, ctx);
      }

      // ============================================
      // ROUTE 5: AI Enhancement para Bots em Páginas de Produto
      // ============================================

      // Debug logging para diagnosticar por que AI transform não está executando
      console.log('🔍 Debug AI Transform:', {
        url: url.pathname,
        botInfo: {
          isBot: bot.isBot,
          type: bot.type,
          verified: bot.verified,
          trustScore: bot.trustScore,
        },
        conditions: {
          enableAITransform: DEFAULT_WORKER_CONFIG.enableAITransform,
          shouldOptimizeForBot: shouldOptimizeForBot(bot, env.ENVIRONMENT),
          isProductPage: isProductPage(url),
        },
        environment: env.ENVIRONMENT,
        userAgent: request.headers.get('User-Agent'),
      });

      if (DEFAULT_WORKER_CONFIG.enableAITransform &&
          shouldOptimizeForBot(bot, env.ENVIRONMENT) &&
          isProductPage(url)) {

        console.log('✅ AI Transform ATIVADO para:', url.pathname);

        // Buscar página do origin
        const originResponse = await fetchFromOrigin(reqCtx);

        if (!originResponse.ok) {
          return originResponse;
        }

        // Aplicar transformações AI
        return enhanceSEOContent(originResponse, env, bot, url);
      }

      // ============================================
      // ROUTE 6: Product HTML+CSS Extraction (Admin)
      // ============================================
      if (url.pathname === '/api/admin/extract-product' && request.method === 'POST') {
        return handleExtractProduct(request, env);
      }

      // ============================================
      // ROUTE 7: API Routes (Proxy Direto, sem cache)
      // ============================================
      if (url.pathname.startsWith('/api/')) {
        return proxyToOrigin(reqCtx);
      }

      // ============================================
      // ROUTE 7: Next.js Data Routes (_next/data)
      // ============================================
      if (url.pathname.startsWith('/_next/data/')) {
        return proxyToOrigin(reqCtx);
      }

      // ============================================
      // DEFAULT: Proxy para Origin (Next.js)
      // ============================================
      return proxyToOrigin(reqCtx);

    } catch (error) {
      console.error('Worker error:', error);
      return handleError(error, env);
    } finally {
      // Log performance metrics (async)
      if (DEFAULT_WORKER_CONFIG.enableAnalytics && env.DB) {
        const responseTime = Date.now() - startTime;
        ctx.waitUntil(
          logRequest(env.DB, {
            url: url.pathname,
            botType: 'unknown',
            timestamp: startTime,
            responseTime,
          })
        );
      }
    }
  },
};

// ============================================
// Request Handlers
// ============================================

async function handleHealthCheck(env: Env): Promise<Response> {
  const status = {
    status: 'ok',
    timestamp: Date.now(),
    services: {
      ai: Boolean(env.AI),
      cache: Boolean(env.CACHE),
      db: Boolean(env.DB),
      images: Boolean(env.IMAGES),
    },
    environment: env.ENVIRONMENT || 'unknown',
  };

  return Response.json(status);
}

async function handleAnalytics(env: Env): Promise<Response> {
  if (!env.DB) {
    return Response.json({ error: 'Analytics not available' }, { status: 503 });
  }

  try {
    // Obter estatísticas dos últimos 7 dias
    const stats = await env.DB.prepare(`
      SELECT
        bot_type,
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
      FROM transformations
      WHERE timestamp > ?
      GROUP BY bot_type
      ORDER BY total_requests DESC
    `).bind(Date.now() - (7 * 86400 * 1000)).all();

    return Response.json({
      success: true,
      data: stats.results,
      period: '7 days',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function handleStaticAsset(
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  // Tentar buscar do cache primeiro
  const cache = caches.default;
  let response = await cache.match(request);

  if (response) {
    return response;
  }

  // Buscar do origin
  response = await fetch(request);

  if (response.ok) {
    // Clonar response e adicionar headers de cache
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Cache', 'MISS');

    // Armazenar em cache (async)
    ctx.waitUntil(cache.put(request, response.clone()));
  }

  return response;
}

async function fetchFromOrigin(ctx: RequestContext): Promise<Response> {
  const { request, env, url } = ctx;

  const originUrl = `${env.ORIGIN_URL}${url.pathname}${url.search}`;

  return fetch(originUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });
}

async function proxyToOrigin(ctx: RequestContext): Promise<Response> {
  return fetchFromOrigin(ctx);
}

// ============================================
// Utilities
// ============================================

function isStaticAsset(url: URL): boolean {
  const staticPaths = [
    '/_next/static/',
    '/_next/image/',
    '/static/',
    '/images/',
    '/fonts/',
  ];

  const staticExtensions = [
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.ico',
    '.svg',
    '.webmanifest',
  ];

  return (
    staticPaths.some((path) => url.pathname.startsWith(path)) ||
    staticExtensions.some((ext) => url.pathname.endsWith(ext))
  );
}

async function handleError(error: unknown, env: Env): Promise<Response> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  console.error('Worker error:', errorMessage);

  // Em produção, retornar erro genérico
  if (env.ENVIRONMENT === 'production') {
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Em desenvolvimento, retornar detalhes do erro
  return Response.json({
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: Date.now(),
  }, {
    status: 500,
  });
}

async function logRequest(db: D1Database, data: any): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO transformations (url, bot_type, timestamp, response_time, cache_hit)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.url,
      data.botType,
      data.timestamp,
      data.responseTime,
      0
    ).run();
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

// ============================================
// Scheduled Events (Cron Jobs)
// ============================================

export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  // Executar tarefas agendadas (ex: limpeza de cache, relatórios)
  console.log('Scheduled event:', event.cron);

  // Limpar cache expirado
  if (env.CACHE) {
    ctx.waitUntil(cleanupExpiredCache(env.CACHE));
  }

  // Gerar relatório diário
  if (env.DB && event.cron === '0 0 * * *') {
    ctx.waitUntil(generateDailyReport(env.DB));
  }
}

async function cleanupExpiredCache(kv: KVNamespace): Promise<void> {
  try {
    // Listar chaves de metadata expiradas
    const list = await kv.list({ prefix: 'img:' });

    for (const key of list.keys) {
      const meta = await kv.get(key.name + ':meta', 'json');

      if (meta && (meta as any).expiresAt < Date.now()) {
        await kv.delete(key.name);
        await kv.delete(key.name + ':meta');
      }
    }

    console.log(`Cleaned up ${list.keys.length} cache entries`);
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

async function generateDailyReport(db: D1Database): Promise<void> {
  try {
    const yesterday = Date.now() - (24 * 3600 * 1000);

    const report = await db.prepare(`
      SELECT
        bot_type,
        COUNT(*) as requests,
        AVG(response_time) as avg_time,
        SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
      FROM transformations
      WHERE timestamp > ?
      GROUP BY bot_type
    `).bind(yesterday).all();

    console.log('Daily report:', report.results);

    // TODO: Enviar relatório via email ou webhook
  } catch (error) {
    console.error('Report generation error:', error);
  }
}

// ============================================
// WebSocket Support (Future)
// ============================================

// export async function webSocketMessage(
//   ws: WebSocket,
//   message: string,
//   env: Env
// ): Promise<void> {
//   // Implementar suporte a WebSocket se necessário
// }

// export async function webSocketClose(
//   ws: WebSocket,
//   code: number,
//   reason: string,
//   env: Env
// ): Promise<void> {
//   // Implementar limpeza de WebSocket
// }
