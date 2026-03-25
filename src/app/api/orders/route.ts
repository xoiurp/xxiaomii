import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, shopifyCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar pedidos por email do usuário OU pelo shopifyCustomerId
    const conditions: any[] = [];
    if (user.email) {
      conditions.push({ email: user.email });
    }
    if (user.shopifyCustomerId) {
      conditions.push({ customerId: user.shopifyCustomerId });
    }

    if (conditions.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const shopifyOrders = await prisma.shopifyOrder.findMany({
      where: { OR: conditions },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar pedidos AppMax pelo email
    const appmaxOrders = await prisma.appmaxOrder.findMany({
      where: { customerEmail: user.email },
      orderBy: { createdAt: 'desc' },
    });

    // Normalizar pedidos Shopify
    const normalizedShopify = shopifyOrders.map((order) => {
      const lineItems = Array.isArray(order.lineItems) ? (order.lineItems as any[]) : [];
      const shippingLines = Array.isArray(order.shippingLines) ? (order.shippingLines as any[]) : [];
      const fulfillments = Array.isArray(order.fulfillments) ? (order.fulfillments as any[]) : [];

      // Extrair código de rastreio dos fulfillments
      let trackingCode: string | null = null;
      let trackingUrl: string | null = null;
      for (const f of fulfillments) {
        if (f.tracking_number || f.trackingNumber) {
          trackingCode = f.tracking_number || f.trackingNumber;
          trackingUrl = f.tracking_url || f.trackingUrl || null;
          break;
        }
        if (Array.isArray(f.tracking_numbers) && f.tracking_numbers.length > 0) {
          trackingCode = f.tracking_numbers[0];
          trackingUrl = Array.isArray(f.tracking_urls) ? f.tracking_urls[0] : null;
          break;
        }
      }

      return {
        id: order.shopifyId,
        source: 'shopify' as const,
        orderNumber: order.name,
        status: getStatus(order.financialStatus, order.fulfillmentStatus),
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        total: order.totalPrice,
        subtotal: order.subtotalPrice,
        shipping: order.totalShippingPrice,
        discount: order.totalDiscounts,
        currency: order.currency,
        items: lineItems.map((item: any) => {
          // Shopify envia imagem em vários formatos possíveis
          let image: string | null = null;
          if (typeof item.image === 'string') {
            image = item.image;
          } else if (item.image?.src) {
            image = item.image.src;
          } else if (item.image?.url) {
            image = item.image.url;
          }
          // Fallback: propriedade product_image ou variant_image
          if (!image && item.product_image?.src) {
            image = item.product_image.src;
          }
          if (!image && item.variant?.image?.src) {
            image = item.variant.image.src;
          }

          return {
            title: item.title || item.name || 'Produto',
            quantity: item.quantity || 1,
            price: parseFloat(item.price) || 0,
            image,
            sku: item.sku || item.variant?.sku || null,
            productId: item.product_id?.toString() || null,
            variantTitle: item.variant_title || item.variantTitle || null,
          };
        }),
        shippingMethod: shippingLines[0]?.title || null,
        trackingCode,
        trackingUrl,
        paymentMethod: order.gateway || null,
        createdAt: order.createdAt.toISOString(),
      };
    });

    // Normalizar pedidos AppMax
    const normalizedAppmax = appmaxOrders.map((order) => {
      const lineItems = Array.isArray(order.lineItems) ? (order.lineItems as any[]) : [];

      return {
        id: order.id,
        source: 'appmax' as const,
        orderNumber: `#${order.appmaxOrderId}`,
        status: getAppmaxStatus(order.status),
        financialStatus: order.status,
        fulfillmentStatus: null as string | null,
        total: order.totalPaid / 100,
        subtotal: order.productsValue / 100,
        shipping: order.shippingValue / 100,
        discount: order.discountValue / 100,
        currency: 'BRL',
        items: lineItems.map((item: any) => ({
          title: item.title || item.name || 'Produto',
          quantity: item.quantity || 1,
          price: (item.price || 0) / 100,
          image: item.image || null,
          variantTitle: item.variant_title || null,
        })),
        shippingMethod: null as string | null,
        trackingCode: order.trackingCode,
        trackingUrl: null as string | null,
        paymentMethod: translatePaymentMethod(order.paymentMethod),
        createdAt: order.createdAt.toISOString(),
      };
    });

    // Combinar e ordenar por data
    const allOrders = [...normalizedShopify, ...normalizedAppmax].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

function getStatus(financial: string, fulfillment: string | null): string {
  const f = financial.toUpperCase();
  const ff = fulfillment?.toUpperCase() || null;

  if (f === 'VOIDED' || f === 'REFUNDED') return 'Cancelado';
  if (f === 'PARTIALLY_REFUNDED') return 'Parcialmente Reembolsado';
  if (ff === 'FULFILLED') return 'Entregue';
  if (ff === 'PARTIAL' || ff === 'SHIPPED') return 'Enviado';
  if (f === 'PAID') return 'Processando';
  if (f === 'PENDING') return 'Pendente';
  if (f === 'AUTHORIZED') return 'Autorizado';
  return 'Pendente';
}

function getAppmaxStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'aprovado' || s === 'approved') return 'Processando';
  if (s === 'cancelado' || s === 'cancelled') return 'Cancelado';
  if (s === 'estornado' || s === 'refunded') return 'Reembolsado';
  if (s === 'pendente' || s === 'pending') return 'Pendente';
  return 'Pendente';
}

function translatePaymentMethod(method: string | null): string | null {
  if (!method) return null;
  const m = method.toLowerCase();
  if (m === 'creditcard' || m === 'credit_card') return 'Cartão de Crédito';
  if (m === 'pix') return 'PIX';
  if (m === 'boleto') return 'Boleto';
  return method;
}
