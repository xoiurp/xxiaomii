import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    console.log('Shop Domain:', shopDomain);
    console.log('Admin Token exists:', !!adminToken);
    console.log('Admin Token length:', adminToken?.length || 0);

    if (!shopDomain) {
      return NextResponse.json({
        error: 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN não configurado',
        shopDomain: shopDomain,
        adminToken: !!adminToken
      }, { status: 500 });
    }

    if (!adminToken) {
      return NextResponse.json({
        error: 'SHOPIFY_ADMIN_API_TOKEN não configurado',
        shopDomain: shopDomain,
        adminToken: !!adminToken
      }, { status: 500 });
    }

    // Fazer uma requisição simples usando fetch
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            shop {
              name
              email
              currencyCode
            }
          }
        `
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API Error:', response.status, errorText);
      return NextResponse.json({
        error: 'Erro na requisição Shopify',
        status: response.status,
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify GraphQL Errors:', data.errors);
      return NextResponse.json({
        error: 'Erro GraphQL Shopify',
        details: data.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com Shopify funcionando!',
      shop: data.data?.shop,
      config: {
        shopDomain,
        tokenConfigured: !!adminToken
      }
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 