import { NextRequest, NextResponse } from 'next/server';
import { prepareYampiCartPayload, ShopifyCartResponse } from '@/lib/yampi';

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT as string;

const DOOKI_ENDPOINT = process.env.DOOKI_PUBLIC_ENDPOINT || 'https://api.dooki.com.br/v2/public/shopify/cart';

// Minimal selection set to build the Yampi payload
const CART_SELECTION = `
  id
  checkoutUrl
  note
  attributes { key value }
  cost {
    totalAmount { amount currencyCode }
    subtotalAmount { amount currencyCode }
  }
  totalQuantity
  discountCodes { code applicable }
  discountAllocations { discountedAmount { amount currencyCode } }
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        attributes { key value }
        cost {
          amountPerQuantity { amount currencyCode }
          compareAtAmountPerQuantity { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        discountAllocations { discountedAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            sku
            title
            requiresShipping
            taxable
            weight
            weightUnit
            image { url altText width height }
            selectedOptions { name value }
            quantityRule { minimum maximum increment }
            product {
              id
              title
              vendor
              handle
              productType
              descriptionHtml
            }
          }
        }
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    console.log('[Yampi Checkout] Iniciando processamento de checkout');

    if (!SHOPIFY_STORE_DOMAIN || !STOREFRONT_TOKEN) {
      console.error('[Yampi Checkout] Configuração Shopify ausente');
      return NextResponse.json({ error: 'Shopify Storefront configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    console.log('[Yampi Checkout] Body recebido:', JSON.stringify(body, null, 2));

    const items: Array<{ variantId: string; quantity: number; attributes?: Record<string, string> }>
      = body?.items || [];
    const note: string | undefined = body?.note;
    const attributes: Record<string, string> | undefined = body?.attributes;
    const yampiShopOverride: string | undefined = body?.yampiShop;

    if (!Array.isArray(items) || items.length === 0) {
      console.error('[Yampi Checkout] Nenhum item fornecido');
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    console.log('[Yampi Checkout] Items validados:', items.length, 'item(s)');

    // Build CartLineInput
    const lines = items.map((it) => ({
      quantity: it.quantity,
      merchandiseId: it.variantId,
      attributes: it.attributes
        ? Object.entries(it.attributes).map(([key, value]) => ({ key, value }))
        : undefined,
    }));

    const input: any = {
      lines,
    };
    if (note) input.note = note;
    if (attributes) {
      input.attributes = Object.entries(attributes).map(([key, value]) => ({ key, value }));
    }

    const cartCreateMutation = `
      mutation CartCreate($input: CartInput) {
        cartCreate(input: $input) {
          cart { ${CART_SELECTION} }
          userErrors { message }
        }
      }
    `;

    console.log('[Yampi Checkout] Criando cart na Shopify...');

    const shopifyRes = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: cartCreateMutation, variables: { input } }),
    });

    if (!shopifyRes.ok) {
      const errText = await shopifyRes.text();
      console.error('[Yampi Checkout] Erro ao criar cart na Shopify:', errText);
      return NextResponse.json({ error: 'Failed to create cart', details: errText }, { status: 502 });
    }

    console.log('[Yampi Checkout] Cart criado na Shopify com sucesso');

    const cartJson = (await shopifyRes.json()) as { data?: ShopifyCartResponse; errors?: any };
    if (cartJson.errors) {
      return NextResponse.json({ error: 'Shopify GraphQL error', details: cartJson.errors }, { status: 502 });
    }

    const cart = cartJson.data?.cartCreate?.cart;
    const userErrors = cartJson.data?.cartCreate?.userErrors || [];
    if (!cart || userErrors.length > 0) {
      return NextResponse.json({ error: 'Cart creation error', details: userErrors }, { status: 502 });
    }

    // Build Yampi payload
    console.log('[Yampi Checkout] Preparando payload Yampi...');
    const payload = prepareYampiCartPayload(cart);

    if (yampiShopOverride) {
      console.log('[Yampi Checkout] Usando domínio override:', yampiShopOverride);
      payload.shop = yampiShopOverride.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }

    console.log('[Yampi Checkout] Domínio Yampi configurado:', payload.shop);

    if (!payload.shop) {
      console.error('[Yampi Checkout] Domínio Yampi não configurado!');
      return NextResponse.json({ error: 'Yampi shop domain not configured (YAMPI_SHOP_DOMAIN or NEXT_PUBLIC_YAMPI_SHOP_DOMAIN)' }, { status: 500 });
    }

    // Log payload for debugging (remove in production)
    console.log('[Yampi Checkout] Sending payload to Dooki:', JSON.stringify(payload, null, 2));

    // Call Dooki public endpoint to create Yampi checkout
    const dookiRes = await fetch(DOOKI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const dookiJson = await dookiRes.json();

    // Log response for debugging
    console.log('[Yampi Checkout] Dooki response:', JSON.stringify(dookiJson, null, 2));

    if (!dookiRes.ok) {
      console.error('[Yampi Checkout] Dooki API error:', dookiJson);
      return NextResponse.json({ error: 'Dooki API error', details: dookiJson }, { status: 502 });
    }

    return NextResponse.json(dookiJson, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unhandled error during Yampi checkout', message: e?.message || String(e) }, { status: 500 });
  }
}
