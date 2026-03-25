import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const revalidate = 0;

/**
 * Webhook para capturar dados de pedidos no momento da criação
 * Shopify envia dados completos via webhook, incluindo billingAddress e shippingAddress
 *
 * IMPORTANTE: Este webhook captura os dados de endereço e cliente ANTES das restrições de PII
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticidade do webhook (HMAC)
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    if (!hmacHeader || !shopDomain) {
      console.error('Webhook inválido: headers ausentes');
      return NextResponse.json({
        error: 'Headers de autenticação ausentes'
      }, { status: 401 });
    }

    // 2. Ler o body do webhook
    const rawBody = await request.text();
    const webhookData = JSON.parse(rawBody);

    // 3. Verificar HMAC para autenticidade
    const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_ADMIN_API_TOKEN || '';
    const hash = crypto
      .createHmac('sha256', shopifySecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (hash !== hmacHeader) {
      console.error('HMAC inválido - webhook rejeitado');
      return NextResponse.json({
        error: 'HMAC verification failed'
      }, { status: 401 });
    }

    console.log('✅ Webhook autenticado com sucesso');
    console.log('📦 Dados do pedido recebidos:', {
      id: webhookData.id,
      name: webhookData.name,
      email: webhookData.email,
      totalPrice: webhookData.total_price
    });

    // 4. NOVA LÓGICA: Vincular shopifyCustomerId ao usuário local (User table)
    if (webhookData.customer && webhookData.customer.id) {
      const customerId = webhookData.customer.id.toString();
      const customerEmail = webhookData.customer.email || webhookData.email;

      // Tentar vincular ao usuário local via email
      if (customerEmail) {
        try {
          const localUser = await prisma.user.findUnique({
            where: { email: customerEmail }
          });

          if (localUser && !localUser.shopifyCustomerId) {
            // Usuário existe localmente mas ainda não tem shopifyCustomerId vinculado
            await prisma.user.update({
              where: { id: localUser.id },
              data: { shopifyCustomerId: customerId }
            });

            console.log('🔗 shopifyCustomerId vinculado ao usuário local:', {
              userId: localUser.id,
              email: localUser.email,
              shopifyCustomerId: customerId
            });
          }
        } catch (linkError) {
          console.error('⚠️ Erro ao vincular shopifyCustomerId ao usuário:', linkError);
          // Continuar mesmo se falhar - não é crítico
        }
      }

      // 5. Atualizar dados do cliente na tabela ShopifyCustomer (cache)

      // Buscar dados do cliente no webhook (inclui PII)
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

      // Extrair endereço padrão do billing_address
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

      // Extrair todos os endereços se existirem
      let addresses = null;
      if (webhookData.customer?.addresses && Array.isArray(webhookData.customer.addresses)) {
        addresses = webhookData.customer.addresses;
      }

      // Merge inteligente: preservar dados existentes não-nulos
      try {
        console.log('🔍 Iniciando merge inteligente de cliente:', customerId);
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

          console.log('💰 Estatísticas calculadas dos pedidos:', {
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

          console.log('✅ Cliente criado a partir do pedido:', {
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

    // 5. Preparar dados do pedido para salvar
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

    // 6. Salvar pedido no banco (simulado - precisa adicionar model ShopifyOrder ao schema)
    // NOTA: Como ainda não temos o model ShopifyOrder no Prisma, vou apenas logar os dados
    console.log('📝 Dados do pedido para salvar:', {
      shopifyId: orderData.shopifyId,
      name: orderData.name,
      orderNumber: orderData.orderNumber,
      customerName: webhookData.billing_address
        ? `${webhookData.billing_address.first_name} ${webhookData.billing_address.last_name}`
        : 'N/A',
      totalPrice: orderData.totalPrice,
      financialStatus: orderData.financialStatus,
      hasShippingAddress: !!orderData.shippingAddress,
      hasBillingAddress: !!orderData.billingAddress
    });

    // 6. Salvar pedido no banco
    const savedOrder = await prisma.shopifyOrder.upsert({
      where: { shopifyId: orderData.shopifyId },
      update: {
        ...orderData,
        billingAddress: orderData.billingAddress as any,
        shippingAddress: orderData.shippingAddress as any,
        lineItems: orderData.lineItems as any,
        shippingLines: orderData.shippingLines as any,
        lastSyncAt: new Date(),
      },
      create: {
        ...orderData,
        billingAddress: orderData.billingAddress as any,
        shippingAddress: orderData.shippingAddress as any,
        lineItems: orderData.lineItems as any,
        shippingLines: orderData.shippingLines as any,
        lastSyncAt: new Date(),
      },
    });

    console.log('✅ Pedido salvo no banco de dados:', {
      id: savedOrder.id,
      shopifyId: savedOrder.shopifyId,
      name: savedOrder.name,
      totalPrice: savedOrder.totalPrice
    });

    return NextResponse.json({
      success: true,
      message: 'Pedido processado com sucesso via webhook',
      order: {
        id: savedOrder.id,
        shopifyId: savedOrder.shopifyId,
        name: savedOrder.name,
        orderNumber: savedOrder.orderNumber,
        totalPrice: savedOrder.totalPrice,
        financialStatus: savedOrder.financialStatus,
        fulfillmentStatus: savedOrder.fulfillmentStatus,
        customerUpdated: !!webhookData.customer?.id
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar webhook orders/create:', error);

    return NextResponse.json({
      error: 'Erro interno ao processar webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
