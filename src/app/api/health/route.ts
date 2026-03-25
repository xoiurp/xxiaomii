import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';
import { getEnvironment, getBaseUrl } from '@/lib/utils';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Verificar informações básicas do ambiente
    const environment = getEnvironment();
    const baseUrl = getBaseUrl();
    
    // Verificar variáveis de ambiente críticas
    const envChecks = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      SHOPIFY_STORE_DOMAIN: !!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
      SHOPIFY_STOREFRONT_TOKEN: !!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT,
      SHOPIFY_ADMIN_TOKEN: !!process.env.SHOPIFY_ADMIN_API_TOKEN,
    };
    
    // Verificar conexão com banco de dados
    const databaseHealthy = await testDatabaseConnection();
    
    // Verificar Shopify API (teste simples)
    let shopifyHealthy = false;
    let shopifyError = null;
    
    try {
      if (envChecks.SHOPIFY_STORE_DOMAIN && envChecks.SHOPIFY_ADMIN_TOKEN) {
        const shopifyResponse = await fetch(
          `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: 'query { shop { name } }'
            }),
          }
        );
        
        if (shopifyResponse.ok) {
          const data = await shopifyResponse.json();
          shopifyHealthy = !data.errors;
        }
      }
    } catch (error) {
      shopifyError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Calcular tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Determinar status geral
    const allSystemsHealthy = databaseHealthy && shopifyHealthy && Object.values(envChecks).every(Boolean);
    
    const healthStatus = {
      status: allSystemsHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment,
      baseUrl,
      responseTime: `${responseTime}ms`,
      checks: {
        database: {
          status: databaseHealthy ? 'healthy' : 'unhealthy',
          type: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'SQLite'
        },
        shopify: {
          status: shopifyHealthy ? 'healthy' : 'unhealthy',
          error: shopifyError
        },
        environment: {
          status: Object.values(envChecks).every(Boolean) ? 'healthy' : 'missing_variables',
          variables: envChecks
        }
      },
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      uptime: process.uptime()
    };
    
    return NextResponse.json(healthStatus, {
      status: allSystemsHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
} 