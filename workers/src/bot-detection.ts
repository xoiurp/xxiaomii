/**
 * Bot Detection Module
 * Identifica e classifica bots/crawlers baseado em User-Agent e IP
 */

import { BotInfo, BotType, BotConfig } from './types';

// ============================================
// Known Bots Configuration
// ============================================

const KNOWN_BOTS: Record<string, BotConfig> = {
  googlebot: {
    userAgents: [
      'Googlebot',
      'Google-InspectionTool',
      'GoogleOther',
      'Mediapartners-Google',
      'AdsBot-Google',
      'APIs-Google',
    ],
    ipRanges: [
      // Google IP ranges (simplified - verificar via reverse DNS em produção)
      '66.249.',
      '64.233.',
      '72.14.',
      '209.85.',
      '216.239.',
    ],
    verificationMethod: 'ip',
  },
  bingbot: {
    userAgents: [
      'bingbot',
      'msnbot',
      'BingPreview',
      'adidxbot',
    ],
    ipRanges: [
      // Microsoft IP ranges
      '40.77.',
      '207.46.',
      '157.55.',
      '65.52.',
    ],
    verificationMethod: 'ip',
  },
  baiduspider: {
    userAgents: ['Baiduspider', 'Baiduspider-render'],
    ipRanges: ['220.181.', '123.125.', '159.226.'],
    verificationMethod: 'ip',
  },
  yandexbot: {
    userAgents: ['YandexBot', 'YandexImages', 'YandexAccessibilityBot'],
    ipRanges: ['5.255.', '77.88.', '95.108.', '178.154.'],
    verificationMethod: 'ip',
  },
  duckduckbot: {
    userAgents: ['DuckDuckBot'],
    verificationMethod: 'none',
  },
  'ai-scraper': {
    userAgents: [
      'GPTBot',
      'ChatGPT-User',
      'ClaudeBot',
      'anthropic-ai',
      'Claude-Web',
      'cohere-ai',
      'PerplexityBot',
      'YouBot',
    ],
    verificationMethod: 'none',
  },
  crawler: {
    userAgents: [
      'Slurp', // Yahoo
      'Applebot',
      'facebookexternalhit',
      'Twitterbot',
      'LinkedInBot',
      'Discordbot',
      'TelegramBot',
      'Slackbot',
      'WhatsApp',
      'Pinterestbot',
      'redditbot',
      'Amazonbot',
    ],
    verificationMethod: 'none',
  },
};

// Padrões suspeitos de bots não identificados
const SUSPICIOUS_PATTERNS = [
  /bot|crawler|spider|scraper/i,
  /curl|wget|python-requests|java\/|go-http/i,
  /headless|phantom|selenium|playwright|puppeteer/i,
  /archive\.org_bot|ia_archiver/i,
  /crawl|fetch|index|scan/i,
];

// User-Agents legítimos que NÃO devem ser considerados bots
const KNOWN_BROWSERS = [
  /mozilla\/5\.0.*chrome/i,
  /mozilla\/5\.0.*safari/i,
  /mozilla\/5\.0.*firefox/i,
  /mozilla\/5\.0.*edge/i,
  /opera/i,
];

// ============================================
// Main Detection Function
// ============================================

export function detectBot(request: Request): BotInfo {
  const ua = request.headers.get('User-Agent') || '';
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Caso especial: sem User-Agent é sempre suspeito
  if (!ua) {
    return {
      isBot: true,
      type: 'crawler',
      verified: false,
      trustScore: 0.1,
      userAgent: '',
      ip,
    };
  }

  // 1. Verificar bots conhecidos
  for (const [type, config] of Object.entries(KNOWN_BOTS)) {
    if (matchesBotPattern(ua, config.userAgents)) {
      const verified = verifyBot(ip, config);
      const trustScore = calculateTrustScore(request, type as BotType, verified);

      return {
        isBot: true,
        type: type as BotType,
        verified,
        trustScore,
        userAgent: ua,
        ip,
      };
    }
  }

  // 2. Verificar se é navegador legítimo
  if (KNOWN_BROWSERS.some((pattern) => pattern.test(ua))) {
    return {
      isBot: false,
      type: 'user',
      verified: true,
      trustScore: 1.0,
      userAgent: ua,
      ip,
    };
  }

  // 3. Heurística para bots suspeitos
  const isSuspicious = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(ua));

  if (isSuspicious) {
    return {
      isBot: true,
      type: 'crawler',
      verified: false,
      trustScore: 0.3,
      userAgent: ua,
      ip,
    };
  }

  // 4. Default: provavelmente usuário real
  return {
    isBot: false,
    type: 'user',
    verified: false,
    trustScore: 0.8,
    userAgent: ua,
    ip,
  };
}

// ============================================
// Helper Functions
// ============================================

function matchesBotPattern(userAgent: string, patterns: string[]): boolean {
  return patterns.some((pattern) => userAgent.includes(pattern));
}

function verifyBot(ip: string, config: BotConfig): boolean {
  if (config.verificationMethod === 'none') {
    return false;
  }

  if (config.verificationMethod === 'ip' && config.ipRanges) {
    return verifyBotByIP(ip, config.ipRanges);
  }

  // TODO: Implementar verificação via reverse DNS para maior segurança
  // Em produção, fazer reverse DNS lookup e verificar domínio oficial
  // Ex: Googlebot deve resolver para *.googlebot.com

  return false;
}

function verifyBotByIP(ip: string, ranges: string[]): boolean {
  if (!ip) return false;

  // Verificação simples por prefixo
  // Em produção, usar biblioteca CIDR para verificação correta
  return ranges.some((range) => ip.startsWith(range));
}

function calculateTrustScore(
  request: Request,
  botType: BotType,
  verified: boolean
): number {
  let score = 0.5;

  // Bots verificados têm score alto
  if (verified) {
    score = 0.9;
  } else if (botType === 'googlebot' || botType === 'bingbot') {
    // Googlebot/Bingbot não verificados (possível fake)
    score = 0.6;
  } else if (botType === 'ai-scraper') {
    // AI scrapers geralmente não são verificáveis
    score = 0.7;
  }

  // Verificar headers legítimos
  const headers = {
    hasReferer: request.headers.has('Referer'),
    hasAccept: request.headers.has('Accept'),
    hasAcceptLanguage: request.headers.has('Accept-Language'),
    hasAcceptEncoding: request.headers.has('Accept-Encoding'),
  };

  // Aumentar score por cada header legítimo
  if (headers.hasReferer) score += 0.05;
  if (headers.hasAccept) score += 0.05;
  if (headers.hasAcceptLanguage) score += 0.05;
  if (headers.hasAcceptEncoding) score += 0.05;

  // Verificar Cloudflare headers (se disponível)
  const cfBot = request.headers.get('CF-Bot-Management-Score');
  if (cfBot) {
    // Cloudflare Bot Management score (0-99, lower = more likely bot)
    const cfScore = parseInt(cfBot, 10);
    if (!isNaN(cfScore)) {
      score = score * 0.7 + (cfScore / 100) * 0.3;
    }
  }

  return Math.min(Math.max(score, 0), 1.0);
}

// ============================================
// Advanced Bot Detection (Future Enhancement)
// ============================================

/**
 * Verifica bot via reverse DNS (mais confiável)
 * Requer Workers com suporte a DNS lookup
 */
export async function verifyBotByDNS(
  ip: string,
  expectedDomain: string
): Promise<boolean> {
  // TODO: Implementar quando Workers suportar DNS lookup
  // 1. Fazer reverse DNS lookup do IP
  // 2. Verificar se resolve para domínio oficial (ex: *.googlebot.com)
  // 3. Fazer forward DNS lookup do hostname
  // 4. Verificar se retorna o mesmo IP original
  return false;
}

/**
 * Detecta comportamento de bot baseado em padrões de requisição
 */
export function detectBotBehavior(
  requestHistory: Request[],
  timeWindow: number = 60000
): boolean {
  // TODO: Implementar detecção comportamental
  // - Taxa de requisições muito alta
  // - Padrão de navegação não-humano
  // - Ausência de JavaScript execution
  // - Headers inconsistentes
  return false;
}

// ============================================
// Export utility functions
// ============================================

export function isTrustedBot(bot: BotInfo, isDev: boolean = false): boolean {
  // Em desenvolvimento, aceitar trustScore >= 0.6 para facilitar testes
  const minTrustScore = isDev ? 0.6 : 0.7;
  return bot.isBot && bot.trustScore >= minTrustScore;
}

export function isSearchEngineBot(bot: BotInfo): boolean {
  return ['googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'duckduckbot'].includes(
    bot.type
  );
}

export function isAIBot(bot: BotInfo): boolean {
  return bot.type === 'ai-scraper';
}

export function shouldOptimizeForBot(bot: BotInfo, environment?: string): boolean {
  // Em desenvolvimento, usar critérios menos rigorosos para facilitar testes locais
  const isDev = environment === 'development';

  // Otimizar apenas para bots confiáveis de busca
  return isTrustedBot(bot, isDev) && isSearchEngineBot(bot);
}
