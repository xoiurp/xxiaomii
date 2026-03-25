/**
 * Type definitions for ShopMi Edge Workers
 */

// ============================================
// Cloudflare Workers Environment Bindings
// ============================================

export interface Env {
  // Workers AI binding
  AI: Ai;

  // KV namespace for caching
  CACHE: KVNamespace;

  // D1 database for analytics
  DB: D1Database;

  // R2 bucket for image storage (optional)
  IMAGES?: R2Bucket;

  // Environment variables
  ORIGIN_URL: string;
  SHOPIFY_DOMAIN: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // Secrets (configured via wrangler secret put)
  CF_ACCOUNT_HASH?: string;
  CF_IMAGES_TOKEN?: string;
  AI_GATEWAY_TOKEN?: string;
  ADMIN_EXTRACT_TOKEN?: string;
}

// ============================================
// Bot Detection
// ============================================

export type BotType =
  | 'googlebot'
  | 'bingbot'
  | 'baiduspider'
  | 'yandexbot'
  | 'duckduckbot'
  | 'ai-scraper'
  | 'crawler'
  | 'user';

export interface BotInfo {
  isBot: boolean;
  type: BotType;
  verified: boolean;
  trustScore: number;
  userAgent: string;
  ip?: string;
}

export interface BotConfig {
  userAgents: string[];
  ipRanges?: string[];
  verificationMethod?: 'ip' | 'dns' | 'none';
}

// ============================================
// Image Transformation
// ============================================

export type ImageFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';

export type ImageFit =
  | 'scale-down'
  | 'contain'
  | 'cover'
  | 'crop'
  | 'pad';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ImageFit;
  gravity?: 'auto' | 'center' | 'left' | 'right' | 'top' | 'bottom';
  blur?: number;
  sharpen?: number;
}

export interface ImageTransformResult {
  url: string;
  format: string;
  size?: number;
  width?: number;
  height?: number;
  cached: boolean;
}

// ============================================
// AI Transformations
// ============================================

export interface PageData {
  url: string;
  title: string;
  description?: string;
  price?: string;
  currency?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
}

export interface SEOEnhancements {
  metaDescription?: string;
  metaTitle?: string;
  keywords?: string[];
  imageAlt?: Record<string, string>;
  schema?: SchemaOrgProduct;
  openGraph?: OpenGraphData;
}

export interface SchemaOrgProduct {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string | string[];
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  brand?: {
    '@type': string;
    name: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    reviewCount: number;
  };
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

// ============================================
// Analytics & Logging
// ============================================

export interface TransformationLog {
  id?: number;
  url: string;
  botType: string;
  transformationType: 'image' | 'ai' | 'cache';
  timestamp: number;
  responseTime?: number;
  cacheHit: boolean;
  originalSize?: number;
  transformedSize?: number;
  errorMessage?: string;
}

export interface AnalyticsSummary {
  botType: string;
  totalRequests: number;
  avgResponseTime: number;
  cacheHits: number;
  cacheHitRate: number;
  periodStart: number;
  periodEnd: number;
}

// ============================================
// Cache Strategy
// ============================================

export interface CacheOptions {
  ttl?: number;
  cacheKey?: string;
  bypassCache?: boolean;
  refreshCache?: boolean;
}

export interface CacheMetadata {
  key: string;
  url: string;
  size?: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastAccessed: number;
}

// ============================================
// Request Context
// ============================================

export interface RequestContext {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  url: URL;
  bot: BotInfo;
  startTime: number;
}

// ============================================
// Response Helpers
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId?: string;
    cached?: boolean;
  };
}

// ============================================
// Worker Configuration
// ============================================

export interface WorkerConfig {
  enableImageTransform: boolean;
  enableAITransform: boolean;
  enableAnalytics: boolean;
  enableCache: boolean;
  imageCacheTTL: number;
  aiCacheTTL: number;
  maxImageWidth: number;
  maxImageHeight: number;
  defaultImageQuality: number;
  botQualityReduction: number;
}

export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  enableImageTransform: true,
  enableAITransform: true,
  enableAnalytics: true,
  enableCache: true,
  imageCacheTTL: 86400 * 30, // 30 days
  aiCacheTTL: 86400 * 7, // 7 days
  maxImageWidth: 2400,
  maxImageHeight: 2400,
  defaultImageQuality: 85,
  botQualityReduction: 25, // Reduce quality by 25 points for bots
};

// ============================================
// Product Extraction
// ============================================

export interface ExtractionResult {
  success: boolean;
  title: string;
  html: string;           // Body content limpo
  css: string;            // Vazio na v3 (CSS fica nos links externos)
  combinedHtml: string;   // <head>...</head> + body (pronto para Shopify)
  remBase: string | null; // font-size base detectado
  imageCount: number;
  classCount: number;
  sourceUrl: string;
  mode?: 'desktop' | 'mobile';
  pictureCount?: number;
}

// ============================================
// Error Types
// ============================================

export class WorkerError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

export class ImageTransformError extends WorkerError {
  constructor(message: string, details?: any) {
    super(message, 'IMAGE_TRANSFORM_ERROR', 500, details);
    this.name = 'ImageTransformError';
  }
}

export class AITransformError extends WorkerError {
  constructor(message: string, details?: any) {
    super(message, 'AI_TRANSFORM_ERROR', 500, details);
    this.name = 'AITransformError';
  }
}

export class CacheError extends WorkerError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', 500, details);
    this.name = 'CacheError';
  }
}
