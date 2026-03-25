import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  let syncLog: any = null;
  
  try {
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!shopDomain || !adminToken) {
      return NextResponse.json({
        error: 'Configuração Shopify incompleta'
      }, { status: 500 });
    }

    // Criar log de sincronização
    syncLog = await prisma.customerSyncLog.create({
      data: {
        syncType: 'manual',
        status: 'running',
        startedAt: new Date()
      }
    });

    console.log('Iniciando sincronização de clientes...');

    // Usar REST API em vez de GraphQL para acessar dados de clientes
    // A REST API tem menos limitações para dados PII
    // Usando versão 2025-04 da API
    const restApiUrl = `https://${shopDomain}/admin/api/2025-04/customers.json?limit=250`;
    
    const response = await fetch(restApiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify REST API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Dados recebidos da Shopify:', JSON.stringify(data, null, 2));

    if (!data.customers || !Array.isArray(data.customers)) {
      throw new Error('Formato de resposta inválido da API Shopify');
    }

    const customers = data.customers;
    console.log(`Total de clientes retornados pela API: ${customers.length}`);
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    for (const customer of customers) {
      try {
        console.log(`\n--- Processando cliente ${customer.id} ---`);
        console.log('Dados do cliente:', {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          ordersCount: customer.orders_count,
          totalSpent: customer.total_spent
        });

        // Verificar se o cliente já existe
        const existingCustomer = await prisma.shopifyCustomer.findUnique({
          where: { shopifyId: customer.id.toString() }
        });

        const customerData = {
          shopifyId: customer.id.toString(),
          email: customer.email || null,
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          phone: customer.phone || null,
          acceptsMarketing: customer.accepts_marketing || false,
          acceptsMarketingUpdatedAt: customer.accepts_marketing_updated_at 
            ? new Date(customer.accepts_marketing_updated_at) 
            : null,
          marketingOptInLevel: customer.marketing_opt_in_level || null,
          ordersCount: customer.orders_count || 0,
          totalSpent: parseFloat(customer.total_spent || '0'),
          averageOrderValue: customer.orders_count > 0 
            ? parseFloat(customer.total_spent || '0') / customer.orders_count 
            : 0,
          currency: customer.currency || 'BRL',
          tags: customer.tags || null,
          note: customer.note || null,
          state: customer.state || 'disabled',
          taxExempt: customer.tax_exempt || false,
          taxExemptions: customer.tax_exemptions ? JSON.stringify(customer.tax_exemptions) : null,
          emailMarketingConsent: customer.email_marketing_consent || null,
          smsMarketingConsent: customer.sms_marketing_consent || null,
          adminGraphqlApiId: customer.admin_graphql_api_id || null,
          defaultAddress: customer.default_address || null,
          addresses: customer.addresses || null,
          createdAt: new Date(customer.created_at),
          updatedAt: new Date(customer.updated_at),
          lastSyncAt: new Date()
        };

        if (existingCustomer) {
          // Merge inteligente: preservar dados PII dos webhooks
          console.log('📊 Cliente existente encontrado - aplicando merge inteligente');
          console.log('Dados atuais:', {
            firstName: existingCustomer.firstName,
            lastName: existingCustomer.lastName,
            email: existingCustomer.email,
            phone: existingCustomer.phone,
            hasAddress: !!existingCustomer.defaultAddress
          });
          console.log('Dados da API:', {
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
            phone: customerData.phone,
            hasAddress: !!customerData.defaultAddress
          });

          // Merge: preservar dados não-nulos existentes quando API retorna null
          const mergedData = {
            shopifyId: customerData.shopifyId,
            // Dados PII: preservar existentes se API retornar null
            email: customerData.email || existingCustomer.email,
            firstName: customerData.firstName || existingCustomer.firstName,
            lastName: customerData.lastName || existingCustomer.lastName,
            phone: customerData.phone || existingCustomer.phone,
            // Dados estatísticos: preferir da API (mais atualizados)
            ordersCount: customerData.ordersCount,
            totalSpent: customerData.totalSpent,
            averageOrderValue: customerData.averageOrderValue,
            // Endereços: preservar existentes se API retornar null
            defaultAddress: customerData.defaultAddress || existingCustomer.defaultAddress,
            addresses: customerData.addresses || existingCustomer.addresses,
            // Outros campos: preferir da API se disponíveis
            acceptsMarketing: customerData.acceptsMarketing ?? existingCustomer.acceptsMarketing,
            acceptsMarketingUpdatedAt: customerData.acceptsMarketingUpdatedAt || existingCustomer.acceptsMarketingUpdatedAt,
            marketingOptInLevel: customerData.marketingOptInLevel || existingCustomer.marketingOptInLevel,
            currency: customerData.currency || existingCustomer.currency,
            tags: customerData.tags || existingCustomer.tags,
            note: customerData.note || existingCustomer.note,
            state: customerData.state || existingCustomer.state,
            taxExempt: customerData.taxExempt ?? existingCustomer.taxExempt,
            taxExemptions: customerData.taxExemptions || existingCustomer.taxExemptions,
            emailMarketingConsent: customerData.emailMarketingConsent || existingCustomer.emailMarketingConsent,
            smsMarketingConsent: customerData.smsMarketingConsent || existingCustomer.smsMarketingConsent,
            adminGraphqlApiId: customerData.adminGraphqlApiId || existingCustomer.adminGraphqlApiId,
            // Manter datas originais
            createdAt: existingCustomer.createdAt,
            updatedAt: new Date(),
            lastSyncAt: new Date()
          };

          console.log('✨ Dados após merge:', {
            firstName: mergedData.firstName,
            lastName: mergedData.lastName,
            email: mergedData.email,
            phone: mergedData.phone,
            hasAddress: !!mergedData.defaultAddress
          });

          await prisma.shopifyCustomer.update({
            where: { shopifyId: customer.id.toString() },
            data: mergedData as any
          });
          recordsUpdated++;
        } else {
          // Criar novo cliente
          await prisma.shopifyCustomer.create({
            data: customerData
          });
          recordsAdded++;
        }
      } catch (customerError) {
        console.error(`Erro ao processar cliente ${customer.id}:`, customerError);
        recordsSkipped++;
      }
    }

    // Atualizar log de sincronização
    const completedAt = new Date();
    const duration = Math.round((completedAt.getTime() - syncLog.startedAt.getTime()) / 1000);

    await prisma.customerSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'completed',
        recordsTotal: customers.length,
        recordsAdded,
        recordsUpdated,
        recordsSkipped,
        completedAt,
        duration
      }
    });

    console.log(`Sincronização concluída: ${recordsAdded} adicionados, ${recordsUpdated} atualizados, ${recordsSkipped} ignorados`);

    return NextResponse.json({
      success: true,
      message: 'Sincronização de clientes concluída com sucesso',
      summary: {
        total: customers.length,
        added: recordsAdded,
        updated: recordsUpdated,
        skipped: recordsSkipped,
        duration: `${duration}s`
      },
      syncLogId: syncLog.id
    });

  } catch (error) {
    console.error('Erro na sincronização de clientes:', error);
    
    // Atualizar log com erro
    if (syncLog) {
      try {
        await prisma.customerSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date()
          }
        });
      } catch (logError) {
        console.error('Erro ao atualizar log:', logError);
      }
    }

    return NextResponse.json({
      error: 'Erro na sincronização de clientes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    // Não é necessário desconectar a instância compartilhada
  }
}

// API para verificar status da última sincronização
export async function GET() {
  try {
    const lastSync = await prisma.customerSyncLog.findFirst({
      orderBy: { startedAt: 'desc' }
    });

    const totalCustomers = await prisma.shopifyCustomer.count();
    const activeCustomers = await prisma.shopifyCustomer.count({
      where: { state: 'enabled' }
    });

    return NextResponse.json({
      success: true,
      lastSync,
      stats: {
        totalCustomers,
        activeCustomers,
        lastSyncAt: lastSync?.completedAt || null
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status da sincronização:', error);
    return NextResponse.json({
      error: 'Erro ao verificar status da sincronização',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    // Não é necessário desconectar a instância compartilhada
  }
} 