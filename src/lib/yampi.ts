// Utilities to build Yampi (Dooki) checkout payloads from Shopify cart data
export function getNumericId(gid?: string | null): number | null {
  if (!gid) return null;
  try {
    const parts = gid.split('/');
    return parseInt(parts[parts.length - 1]);
  } catch {
    return null;
  }
}

export function convertPriceToCents(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined) return null;
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}

// Types for a subset of Shopify Storefront cart response we need
export interface ShopifyCartResponse {
  cartCreate?: {
    cart?: ShopifyCart;
    userErrors?: Array<{ message: string }>;
  };
  cart?: ShopifyCart;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl?: string | null;
  note?: string | null;
  attributes?: Array<{ key: string; value: string } | null> | null;
  cost?: {
    totalAmount?: { amount: string; currencyCode: string } | null;
    subtotalAmount?: { amount: string; currencyCode: string } | null;
  } | null;
  totalQuantity: number;
  discountCodes?: Array<{ code: string; applicable: boolean } | null> | null;
  discountAllocations?: Array<{ discountedAmount?: { amount: string; currencyCode: string } | null } | null> | null;
  lines?: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  } | null;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string } | null> | null;
  cost?: {
    amountPerQuantity?: { amount: string; currencyCode: string } | null;
    compareAtAmountPerQuantity?: { amount: string; currencyCode: string } | null;
    totalAmount?: { amount: string; currencyCode: string } | null;
  } | null;
  discountAllocations?: Array<{ discountedAmount?: { amount: string; currencyCode: string } | null } | null> | null;
  merchandise?: {
    id: string;
    sku?: string | null;
    title?: string | null;
    requiresShipping?: boolean | null;
    taxable?: boolean | null;
    weight?: number | null;
    weightUnit?: 'KILOGRAMS' | 'GRAMS' | 'POUNDS' | 'OUNCES' | string | null;
    image?: {
      url?: string | null;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    selectedOptions?: Array<{ name: string; value: string } | null> | null;
    quantityRule?: { minimum: number; maximum: number; increment: number } | null;
    product?: {
      id: string;
      title?: string | null;
      vendor?: string | null;
      handle?: string | null;
      productType?: string | null;
      descriptionHtml?: string | null;
    } | null;
  } | null;
}

export function prepareYampiCartPayload(cart: ShopifyCart) {
  // Prefer token from checkoutUrl; fallback to parsing id if it contains ?key=
  let cartToken: string | null = null;
  if (cart.checkoutUrl && cart.checkoutUrl.includes('?key=')) {
    cartToken = cart.checkoutUrl.split('?key=')[1] || null;
  } else if (cart.id && cart.id.includes('?key=')) {
    cartToken = cart.id.split('?key=')[1] || null;
  }

  const cartAttributes: Record<string, string> = {};
  cart.attributes?.forEach((attr) => {
    if (!attr) return;
    cartAttributes[attr.key] = attr.value;
  });

  const cartLevelTotalDiscount = (cart.discountAllocations || []).reduce((sum, alloc) => {
    const amount = alloc?.discountedAmount?.amount;
    return sum + (amount ? parseFloat(amount) : 0);
  }, 0);

  const items = (cart.lines?.edges || [])
    .map((edge) => {
      const node = edge.node;
      const m = node.merchandise;
      const p = m?.product || undefined;
      if (!m) return null;

      const variantId = getNumericId(m.id);
      const productId = getNumericId(p?.id || undefined);
      const lineKey = node.id ? node.id.split('?cart=')[0].split('/').pop() || null : null;

      const properties: Record<string, string> = {};
      node.attributes?.forEach((attr) => {
        if (!attr) return;
        properties[attr.key] = attr.value;
      });

      const lineLevelTotalDiscount = (node.discountAllocations || []).reduce((sum, alloc) => {
        const amount = alloc?.discountedAmount?.amount;
        return sum + (amount ? parseFloat(amount) : 0);
      }, 0);

      let grams = 0;
      if (m.weight && m.weightUnit) {
        const unit = String(m.weightUnit).toUpperCase();
        if (unit === 'KILOGRAMS' || unit === 'KG') grams = m.weight * 1000;
        else if (unit === 'GRAMS' || unit === 'G') grams = m.weight;
        else if (unit === 'POUNDS' || unit === 'LB') grams = m.weight * 453.592;
        else if (unit === 'OUNCES' || unit === 'OZ') grams = m.weight * 28.3495;
        grams = Math.round(grams);
      }

      const amountPer = node.cost?.amountPerQuantity?.amount || null;
      const compareAtPer = node.cost?.compareAtAmountPerQuantity?.amount || null;
      const totalAmount = node.cost?.totalAmount?.amount || null;

      return {
        id: variantId,
        properties,
        quantity: node.quantity,
        variant_id: variantId,
        key: lineKey,
        title: m.title || p?.title || 'N/A',
        price: convertPriceToCents(amountPer),
        original_price: convertPriceToCents(compareAtPer),
        presentment_price: convertPriceToCents(amountPer),
        discounted_price: convertPriceToCents(amountPer),
        line_price: convertPriceToCents(totalAmount),
        original_line_price: compareAtPer ? convertPriceToCents(parseFloat(compareAtPer) * node.quantity) : null,
        total_discount: convertPriceToCents(lineLevelTotalDiscount),
        discounts: [],
        sku: m.sku || '',
        grams,
        vendor: p?.vendor || '',
        taxable: m.taxable === true,
        product_id: productId,
        product_has_only_default_variant: true,
        gift_card: (p?.productType || '').toLowerCase().includes('gift'),
        final_price: convertPriceToCents(amountPer),
        final_line_price: convertPriceToCents(totalAmount),
        url: p?.handle && variantId ? `/products/${p.handle}?variant=${variantId}` : '',
        featured_image: m.image
          ? {
              aspect_ratio:
                m.image.width && m.image.height ? m.image.width / m.image.height : null,
              alt: m.image.altText || p?.title || '',
              height: m.image.height || null,
              url: m.image.url || '',
              width: m.image.width || null,
            }
          : null,
        image: m.image?.url || '',
        handle: p?.handle || '',
        requires_shipping: m.requiresShipping === true,
        product_type: p?.productType || '',
        product_title: p?.title || '',
        product_description: p?.descriptionHtml || '',
        variant_title: m.title || null,
        variant_options: (m.selectedOptions || []).map((o) => (o ? o.value : '')),
        options_with_values: (m.selectedOptions || []).map((o) => (o ? { name: o.name, value: o.value } : { name: '', value: '' })),
        line_level_discount_allocations: [],
        line_level_total_discount: convertPriceToCents(lineLevelTotalDiscount),
        quantity_rule: m.quantityRule
          ? {
              min: m.quantityRule.minimum,
              max: m.quantityRule.maximum,
              increment: m.quantityRule.increment,
            }
          : null,
        has_components: false,
      };
    })
    .filter(Boolean);

  const requiresShipping = items.some((i: any) => i.requires_shipping);

  const finalPayload = {
    shop: process.env.YAMPI_SHOP_DOMAIN || process.env.NEXT_PUBLIC_YAMPI_SHOP_DOMAIN || 'mibrasil3',
    cart_payload: {
      token: cartToken,
      note: cart.note || '',
      attributes: cartAttributes,
      original_total_price: items.reduce((sum: number, item: any) => sum + (item.original_line_price || 0), 0),
      total_price: convertPriceToCents(cart.cost?.totalAmount?.amount || null),
      total_discount: convertPriceToCents(cartLevelTotalDiscount),
      total_weight: items.reduce((sum: number, item: any) => sum + (item.grams || 0) * item.quantity, 0),
      item_count: cart.totalQuantity,
      items,
      requires_shipping: requiresShipping,
      currency: (cart.cost?.totalAmount?.currencyCode as string) || 'BRL',
      items_subtotal_price: convertPriceToCents(cart.cost?.subtotalAmount?.amount || null),
      cart_level_discount_applications: [],
    },
  };

  return finalPayload;
}
