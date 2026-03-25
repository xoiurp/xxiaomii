import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const revalidate = 0;

/**
 * Webhook Nativo da Shopify - orders/update
 *
 * Recebe notificações quando um pedido é atualizado
 * Captura mudanças de status, fulfillment, rastreio, etc
 *
 * CONFIGURAÇÃO:
 * 1. Vá em Settings → Notifications → Webhooks
 * 2. Create webhook
 * 3. Event: Order updated
 * 4. Format: JSON
 * 5. URL: https://seudominio.com/api/webhooks/orders/update
 */
export async function POST(request: Request) {
  try {
    console.log('📥 Webhook recebido - orders/update');

    // 1. Ler o body bruto para validação HMAC
    const rawBody = await request.text();

    // 2. Verificar autenticidade via HMAC (segurança)
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    if (hmacHeader) {
      const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_ADMIN_API_TOKEN || '';
      const hash = crypto
        .createHmac('sha256', shopifySecret)
        .update(rawBody, 'utf8')
        .digest('base64');

      if (hash !== hmacHeader) {
        console.error('❌ HMAC inválido - webhook rejeitado');
        return NextResponse.json({
          error: 'HMAC verification failed'
        }, { status: 401 });
      }
      console.log('✅ HMAC validado com sucesso');
    } else {
      console.warn('⚠️ Header HMAC não encontrado - continuando sem validação');
    }

    // 3. Parse do JSON
    const webhookData = JSON.parse(rawBody);

    console.log('📦 Atualização do pedido recebida:', {
      id: webhookData.id,
      name: webhookData.name,
      financialStatus: webhookData.financial_status,
      fulfillmentStatus: webhookData.fulfillment_status
    });

    // 4. Validar ID do pedido
    if (!webhookData.id) {
      console.error('❌ ID do pedido não encontrado no webhook');
      return NextResponse.json({
        error: 'ID do pedido é obrigatório',
        receivedData: Object.keys(webhookData)
      }, { status: 400 });
    }

    // 5. Preparar dados do pedido
    const orderData = {
      shopifyId: webhookData.id.toString(),
      orderNumber: webhookData.order_number,
      name: webhookData.name,
      email: webhookData.email || null,
      phone: webhookData.phone || null,
      customerId: webhookData.customer?.id?.toString() || null,
      financialStatus: webhookData.financial_status || 'pending',
      fulfillmentStatus: webhookData.fulfillment_status || null,
      currency: webhookData.currency || 'BRL',
      currentSubtotalPrice: webhookData.current_subtotal_price ? parseFloat(webhookData.current_subtotal_price) : 0,
      currentTotalPrice: webhookData.current_total_price ? parseFloat(webhookData.current_total_price) : 0,
      totalPrice: webhookData.total_price ? parseFloat(webhookData.total_price) : 0,
      subtotalPrice: webhookData.subtotal_price ? parseFloat(webhookData.subtotal_price) : 0,
      totalDiscounts: webhookData.total_discounts ? parseFloat(webhookData.total_discounts) : 0,
      totalTax: webhookData.total_tax ? parseFloat(webhookData.total_tax) : 0,
      totalShippingPrice: webhookData.total_shipping_price_set?.shop_money?.amount
        ? parseFloat(webhookData.total_shipping_price_set.shop_money.amount)
        : 0,
      billingAddress: webhookData.billing_address || null,
      shippingAddress: webhookData.shipping_address || null,
      lineItems: webhookData.line_items || [],
      shippingLines: webhookData.shipping_lines || [],
      fulfillments: webhookData.fulfillments || [],
      tags: webhookData.tags || null,
      note: webhookData.note || null,
      gateway: webhookData.gateway || null,
      test: webhookData.test || false,
      browserIp: webhookData.browser_ip || null,
      cancelReason: webhookData.cancel_reason || null,
      cancelledAt: webhookData.cancelled_at ? new Date(webhookData.cancelled_at) : null,
      closedAt: webhookData.closed_at ? new Date(webhookData.closed_at) : null,
      processedAt: webhookData.processed_at ? new Date(webhookData.processed_at) : null,
      createdAt: webhookData.created_at ? new Date(webhookData.created_at) : new Date(),
      updatedAt: webhookData.updated_at ? new Date(webhookData.updated_at) : new Date(),
    };

    // 6. Atualizar dados do cliente se existir
    if (webhookData.customer && webhookData.customer.id) {
      const customerId = webhookData.customer.id.toString();

      const customerData = {
        shopifyId: customerId,
        email: webhookData.customer.email || webhookData.email || null,
        firstName: webhookData.customer.first_name || webhookData.billing_address?.first_name || null,
        lastName: webhookData.customer.last_name || webhookData.billing_address?.last_name || null,
        phone: webhookData.customer.phone || webhookData.billing_address?.phone || webhookData.phone || null,
        ordersCount: webhookData.customer.orders_count || 0,
        totalSpent: webhookData.customer.total_spent ? parseFloat(webhookData.customer.total_spent) : 0,
        tags: webhookData.customer.tags || null,
        note: webhookData.customer.note || null,
        taxExempt: webhookData.customer.tax_exempt || false,
        state: webhookData.customer.state || 'disabled',
        currency: webhookData.currency || 'BRL',
        createdAt: webhookData.customer.created_at ? new Date(webhookData.customer.created_at) : new Date(),
        updatedAt: webhookData.customer.updated_at ? new Date(webhookData.customer.updated_at) : new Date(),
        marketingOptInLevel: webhookData.customer.email_marketing_consent?.state || null,
        acceptsMarketing: webhookData.customer.accepts_marketing || false,
        acceptsMarketingUpdatedAt: webhookData.customer.accepts_marketing_updated_at
          ? new Date(webhookData.customer.accepts_marketing_updated_at)
          : null,
        emailMarketingConsent: webhookData.customer.email_marketing_consent || null,
        smsMarketingConsent: webhookData.customer.sms_marketing_consent || null,
        adminGraphqlApiId: webhookData.customer.admin_graphql_api_id || null,
      };

      let defaultAddress = null;
      if (webhookData.billing_address) {
        const addr = webhookData.billing_address;
        defaultAddress = {
          address1: addr.address1 || null,
          address2: addr.address2 || null,
          city: addr.city || null,
          province: addr.province || null,
          provinceCode: addr.province_code || null,
          country: addr.country || null,
          countryCode: addr.country_code || null,
          zip: addr.zip || null,
          phone: addr.phone || null,
          company: addr.company || null,
          firstName: addr.first_name || null,
          lastName: addr.last_name || null,
        };
      }

      let addresses = null;
      if (webhookData.customer?.addresses && Array.isArray(webhookData.customer.addresses)) {
        addresses = webhookData.customer.addresses;
      }

      // Merge inteligente: preservar dados existentes não-nulos
      try {
        console.log('🔍 Iniciando merge inteligente de cliente (update):', customerId);
        console.log('📥 Dados recebidos do webhook:', {
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone,
          ordersCount: customerData.ordersCount,
          totalSpent: customerData.totalSpent
        });

        // Buscar cliente existente
        const existingCustomer = await prisma.shopifyCustomer.findUnique({
          where: { shopifyId: customerId }
        });

        if (existingCustomer) {
          console.log('📊 Dados existentes no banco:', {
            email: existingCustomer.email,
            firstName: existingCustomer.firstName,
            lastName: existingCustomer.lastName,
            phone: existingCustomer.phone,
            ordersCount: existingCustomer.ordersCount,
            totalSpent: existingCustomer.totalSpent
          });

          // Calcular estatísticas reais baseadas nos pedidos no banco
          const customerOrders = await prisma.shopifyOrder.findMany({
            where: { customerId: customerId },
            select: { totalPrice: true }
          });

          const realOrdersCount = customerOrders.length;
          const realTotalSpent = customerOrders.reduce((sum, order) => sum + order.totalPrice, 0);
          const realAverageOrderValue = realOrdersCount > 0 ? realTotalSpent / realOrdersCount : 0;

          console.log('💰 Estatísticas calculadas dos pedidos (update):', {
            realOrdersCount,
            realTotalSpent,
            realAverageOrderValue
          });

          // Merge: usar dados do webhook apenas se não forem nulos
          // Preservar dados existentes quando novos dados são nulos
          const mergedData = {
            shopifyId: customerId,
            email: customerData.email || existingCustomer.email,
            firstName: customerData.firstName || existingCustomer.firstName,
            lastName: customerData.lastName || existingCustomer.lastName,
            phone: customerData.phone || existingCustomer.phone,
            // Dados estatísticos: usar valores calculados dos pedidos reais
            ordersCount: realOrdersCount,
            totalSpent: realTotalSpent,
            averageOrderValue: realAverageOrderValue,
            // Outros campos: preferir novos dados se existirem
            tags: customerData.tags || existingCustomer.tags,
            note: customerData.note || existingCustomer.note,
            taxExempt: customerData.taxExempt ?? existingCustomer.taxExempt,
            state: customerData.state || existingCustomer.state,
            currency: customerData.currency || existingCustomer.currency,
            marketingOptInLevel: customerData.marketingOptInLevel || existingCustomer.marketingOptInLevel,
            acceptsMarketing: customerData.acceptsMarketing ?? existingCustomer.acceptsMarketing,
            acceptsMarketingUpdatedAt: customerData.acceptsMarketingUpdatedAt || existingCustomer.acceptsMarketingUpdatedAt,
            emailMarketingConsent: customerData.emailMarketingConsent || existingCustomer.emailMarketingConsent,
            smsMarketingConsent: customerData.smsMarketingConsent || existingCustomer.smsMarketingConsent,
            adminGraphqlApiId: customerData.adminGraphqlApiId || existingCustomer.adminGraphqlApiId,
            defaultAddress: defaultAddress || existingCustomer.defaultAddress,
            addresses: addresses || existingCustomer.addresses,
            // Manter datas originais de criação
            createdAt: existingCustomer.createdAt,
            updatedAt: new Date(),
            lastSyncAt: new Date(),
          };

          console.log('✨ Dados após merge:', {
            email: mergedData.email,
            firstName: mergedData.firstName,
            lastName: mergedData.lastName,
            phone: mergedData.phone,
            ordersCount: mergedData.ordersCount,
            totalSpent: mergedData.totalSpent
          });

          await prisma.shopifyCustomer.update({
            where: { shopifyId: customerId },
            data: mergedData as any
          });

          console.log('✅ Cliente atualizado com merge inteligente:', {
            shopifyId: customerId,
            name: `${mergedData.firstName} ${mergedData.lastName}`,
            email: mergedData.email
          });
        } else {
          // Cliente novo: criar com todos os dados disponíveis
          console.log('🆕 Cliente não existe - criando novo registro');

          await prisma.shopifyCustomer.create({
            data: {
              ...customerData,
              averageOrderValue: customerData.ordersCount > 0
                ? customerData.totalSpent / customerData.ordersCount
                : 0,
              defaultAddress: defaultAddress as any,
              addresses: addresses as any,
              lastSyncAt: new Date(),
            }
          });

          console.log('✅ Cliente criado a partir do pedido (update webhook):', {
            shopifyId: customerId,
            name: `${customerData.firstName} ${customerData.lastName}`,
            email: customerData.email
          });
        }
      } catch (customerError) {
        console.error('⚠️ Erro ao atualizar cliente:', customerError);
        // Continuar mesmo se falhar a atualização do cliente
      }
    }

    // 7. Verificar se o pedido já existe
    const existingOrder = await prisma.shopifyOrder.findUnique({
      where: { shopifyId: orderData.shopifyId }
    });

    let savedOrder;
    if (existingOrder) {
      // Atualizar pedido existente
      savedOrder = await prisma.shopifyOrder.update({
        where: { shopifyId: orderData.shopifyId },
        data: {
          ...orderData,
          billingAddress: orderData.billingAddress as any,
          shippingAddress: orderData.shippingAddress as any,
          lineItems: orderData.lineItems as any,
          shippingLines: orderData.shippingLines as any,
          fulfillments: orderData.fulfillments as any,
          lastSyncAt: new Date(),
        },
      });

      console.log('✅ Pedido atualizado no banco de dados:', {
        id: savedOrder.id,
        shopifyId: savedOrder.shopifyId,
        name: savedOrder.name,
        financialStatus: savedOrder.financialStatus,
        fulfillmentStatus: savedOrder.fulfillmentStatus,
        totalPrice: savedOrder.totalPrice
      });

    } else {
      // Criar novo pedido (caso não exista)
      savedOrder = await prisma.shopifyOrder.create({
        data: {
          ...orderData,
          billingAddress: orderData.billingAddress as any,
          shippingAddress: orderData.shippingAddress as any,
          lineItems: orderData.lineItems as any,
          shippingLines: orderData.shippingLines as any,
          fulfillments: orderData.fulfillments as any,
          lastSyncAt: new Date(),
        },
      });

      console.log('✅ Pedido criado no banco de dados (via webhook update):', {
        id: savedOrder.id,
        shopifyId: savedOrder.shopifyId,
        name: savedOrder.name,
        totalPrice: savedOrder.totalPrice
      });
    }

    return NextResponse.json({
      success: true,
      message: existingOrder ? 'Pedido atualizado com sucesso via webhook' : 'Pedido criado com sucesso via webhook',
      source: 'Shopify Native Webhook',
      order: {
        id: savedOrder.id,
        shopifyId: savedOrder.shopifyId,
        name: savedOrder.name,
        orderNumber: savedOrder.orderNumber,
        financialStatus: savedOrder.financialStatus,
        fulfillmentStatus: savedOrder.fulfillmentStatus,
        totalPrice: savedOrder.totalPrice,
        hasFulfillments: !!(savedOrder.fulfillments && Array.isArray(savedOrder.fulfillments) && savedOrder.fulfillments.length > 0)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar webhook orders/update:', error);

    return NextResponse.json({
      error: 'Erro interno ao processar webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
