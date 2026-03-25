import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const revalidate = 0;

/**
 * Webhook Nativo da Shopify - customers/create
 *
 * Recebe notificações quando um cliente é criado
 * Shopify envia dados completos via webhook incluindo PII
 *
 * CONFIGURAÇÃO:
 * 1. Vá em Settings → Notifications → Webhooks
 * 2. Create webhook
 * 3. Event: Customer creation
 * 4. Format: JSON
 * 5. URL: https://seudominio.com/api/webhooks/customers/create
 */
export async function POST(request: Request) {
  try {
    console.log('📥 Webhook recebido - customers/create');

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

    console.log('📦 Dados do webhook recebidos:', {
      id: webhookData.id,
      email: webhookData.email,
      firstName: webhookData.first_name,
      lastName: webhookData.last_name
    });

    // DEBUG: Log completo do payload
    console.log('🔍 DEBUG - Payload completo do webhook:');
    console.log(JSON.stringify({
      id: webhookData.id,
      email: webhookData.email,
      first_name: webhookData.first_name,
      last_name: webhookData.last_name,
      phone: webhookData.phone,
      accepts_marketing: webhookData.accepts_marketing,
      accepts_marketing_updated_at: webhookData.accepts_marketing_updated_at,
      verified_email: webhookData.verified_email,
      default_address: webhookData.default_address,
      state: webhookData.state,
      tags: webhookData.tags,
      note: webhookData.note,
    }, null, 2));

    // 4. Validar ID do cliente
    if (!webhookData.id) {
      console.error('❌ ID do cliente não encontrado no webhook');
      return NextResponse.json({
        error: 'ID do cliente é obrigatório',
        receivedData: Object.keys(webhookData)
      }, { status: 400 });
    }

    // 5. Extrair dados do cliente (webhook usa snake_case)
    const ordersCount = webhookData.orders_count || 0;
    const totalSpent = webhookData.total_spent ? parseFloat(webhookData.total_spent) : 0;
    const averageOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;

    const customerData = {
      shopifyId: webhookData.id.toString(),
      email: webhookData.email || null,
      firstName: webhookData.first_name || null,
      lastName: webhookData.last_name || null,
      phone: webhookData.phone || null,
      ordersCount: ordersCount,
      totalSpent: totalSpent,
      averageOrderValue: averageOrderValue,
      tags: webhookData.tags || null,
      note: webhookData.note || null,
      taxExempt: webhookData.tax_exempt || false,
      taxExemptions: webhookData.tax_exemptions || null,
      state: webhookData.state || 'disabled',
      currency: webhookData.currency || 'BRL',
      createdAt: webhookData.created_at ? new Date(webhookData.created_at) : new Date(),
      updatedAt: webhookData.updated_at ? new Date(webhookData.updated_at) : new Date(),
      marketingOptInLevel: webhookData.email_marketing_consent?.state || null,
      acceptsMarketing: webhookData.accepts_marketing || false,
      acceptsMarketingUpdatedAt: webhookData.accepts_marketing_updated_at
        ? new Date(webhookData.accepts_marketing_updated_at)
        : null,
      emailMarketingConsent: webhookData.email_marketing_consent || null,
      smsMarketingConsent: webhookData.sms_marketing_consent || null,
      adminGraphqlApiId: webhookData.admin_graphql_api_id || null,
    };

    // 6. Extrair endereço padrão se existir
    let defaultAddress = null;
    if (webhookData.default_address) {
      const addr = webhookData.default_address;
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

    // 7. Extrair todos os endereços se existirem
    let addresses = null;
    if (webhookData.addresses && Array.isArray(webhookData.addresses)) {
      addresses = webhookData.addresses;
    }

    // 8. Salvar/atualizar no Prisma
    const savedCustomer = await prisma.shopifyCustomer.upsert({
      where: { shopifyId: customerData.shopifyId },
      update: {
        ...customerData,
        defaultAddress: defaultAddress as any,
        addresses: addresses as any,
        lastSyncAt: new Date(),
      },
      create: {
        ...customerData,
        defaultAddress: defaultAddress as any,
        addresses: addresses as any,
        lastSyncAt: new Date(),
      },
    });

    console.log('✅ Cliente salvo no banco de dados:', {
      id: savedCustomer.id,
      shopifyId: savedCustomer.shopifyId,
      name: `${savedCustomer.firstName} ${savedCustomer.lastName}`,
      email: savedCustomer.email
    });

    // DEBUG: Log dos campos salvos
    console.log('🔍 DEBUG - Campos salvos no banco:', {
      firstName: savedCustomer.firstName,
      lastName: savedCustomer.lastName,
      email: savedCustomer.email,
      phone: savedCustomer.phone,
      acceptsMarketing: savedCustomer.acceptsMarketing,
      acceptsMarketingUpdatedAt: savedCustomer.acceptsMarketingUpdatedAt,
      state: savedCustomer.state,
      tags: savedCustomer.tags,
      note: savedCustomer.note,
      ordersCount: savedCustomer.ordersCount,
      totalSpent: savedCustomer.totalSpent,
      averageOrderValue: savedCustomer.averageOrderValue,
      hasDefaultAddress: !!savedCustomer.defaultAddress,
      hasAddresses: !!savedCustomer.addresses
    });

    // 9. Registrar log de sincronização
    await prisma.customerSyncLog.create({
      data: {
        syncType: 'WEBHOOK_CREATE',
        recordsTotal: 1,
        recordsAdded: 1,
        recordsUpdated: 0,
        recordsSkipped: 0,
        status: 'completed',
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso via webhook nativo',
      source: 'Shopify Native Webhook',
      customer: {
        id: savedCustomer.id,
        shopifyId: savedCustomer.shopifyId,
        name: `${savedCustomer.firstName || ''} ${savedCustomer.lastName || ''}`.trim(),
        email: savedCustomer.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar webhook customers/create:', error);

    // Registrar erro no log
    try {
      await prisma.customerSyncLog.create({
        data: {
          syncType: 'WEBHOOK_CREATE',
          recordsTotal: 0,
          recordsAdded: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
        },
      });
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }

    return NextResponse.json({
      error: 'Erro interno ao processar webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
