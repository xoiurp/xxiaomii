import { NextResponse } from 'next/server';

export const revalidate = 0;

/**
 * TESTE: Storefront API para buscar pedidos
 *
 * A Storefront API tem políticas diferentes de PII e pode permitir
 * acesso a dados de clientes que a Admin API bloqueia em planos básicos.
 */
export async function GET() {
  try {
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT;

    if (!shopDomain || !storefrontToken) {
      return NextResponse.json({
        error: 'Configuração Shopify Storefront incompleta',
        hasShopDomain: !!shopDomain,
        hasStorefrontToken: !!storefrontToken
      }, { status: 500 });
    }

    console.log('Testando Storefront API (Headless)...');
    console.log('Shop Domain:', shopDomain);
    console.log('Token (primeiros 10 chars):', storefrontToken.substring(0, 10) + '...');

    // Query GraphQL da Storefront API
    // NOTA: A Storefront API usa um schema diferente da Admin API
    // e geralmente requer um customerAccessToken para dados de pedidos
    const query = `
      query {
        shop {
          name
          description
          primaryDomain {
            url
          }
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': storefrontToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        error: `Storefront API Error: ${response.status}`,
        details: responseText
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);

    if (data.errors) {
      console.error('Storefront GraphQL Errors:', data.errors);
      return NextResponse.json({
        error: 'Erro na consulta GraphQL Storefront',
        details: data.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Storefront API funcionando!',
      shopInfo: data.data?.shop,
      note: 'A Storefront API está funcionando. Para acessar pedidos, precisamos de um customerAccessToken obtido via autenticação OAuth do cliente.'
    });

  } catch (error) {
    console.error('Erro ao testar Storefront API:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
