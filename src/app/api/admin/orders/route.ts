import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET() {
  try {
    console.log('🔍 Buscando pedidos via Prisma (dados capturados por webhooks)...');

    // Buscar todos os pedidos do banco de dados
    const orders = await prisma.shopifyOrder.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Total de pedidos encontrados no Prisma: ${orders.length}`);

    // Buscar todos os clientes relacionados em uma única query
    const customerIds = orders
      .map(order => order.customerId)
      .filter((id): id is string => id !== null);

    const uniqueCustomerIds = [...new Set(customerIds)];

    const customers = await prisma.shopifyCustomer.findMany({
      where: {
        shopifyId: {
          in: uniqueCustomerIds
        }
      }
    });

    // Criar mapa de clientes para acesso rápido
    const customerMap = new Map(
      customers.map(customer => [customer.shopifyId, customer])
    );

    console.log(`✅ Total de clientes únicos encontrados: ${customers.length}`);

    // Calcular estatísticas
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Contar por status
    const statusCount = orders.reduce((acc: Record<string, number>, order) => {
      const status = getStatusInPortuguese(order.financialStatus, order.fulfillmentStatus);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Função para buscar valor em JSON customAttributes
    const findAttributeValue = (customAttributes: any, keys: string[]) => {
      if (!customAttributes || typeof customAttributes !== 'object') return null;

      // Se customAttributes for array
      if (Array.isArray(customAttributes)) {
        for (const key of keys) {
          const attr = customAttributes.find((attr: any) =>
            attr.key?.toLowerCase() === key.toLowerCase() ||
            attr.key?.toLowerCase().includes(key.toLowerCase())
          );
          if (attr?.value) {
            return attr.value;
          }
        }
      }

      return null;
    };

    // Formatar pedidos para a página
    const formattedOrders = orders.map((order) => {
      // Buscar cliente relacionado
      const customer = order.customerId ? customerMap.get(order.customerId) : null;

      // Buscar CPF e bairro nos endereços ou lineItems
      const billingAddress = order.billingAddress as any;
      const shippingAddress = order.shippingAddress as any;

      // Tentar extrair CPF de diferentes locais
      let cpf = null;
      if (billingAddress?.cpf) cpf = billingAddress.cpf;
      else if (shippingAddress?.cpf) cpf = shippingAddress.cpf;

      // Tentar extrair bairro/district
      let district = null;
      if (billingAddress?.district) district = billingAddress.district;
      else if (shippingAddress?.district) district = shippingAddress.district;
      else if (billingAddress?.provinceCode) district = billingAddress.provinceCode;

      // Determinar nome do cliente (prioridade: customer > billingAddress > shippingAddress)
      let firstName = customer?.firstName || null;
      let lastName = customer?.lastName || null;
      let customerEmail = customer?.email || order.email || null;
      let customerPhone = customer?.phone || null;

      // Fallback para billingAddress se não tiver no customer
      if (!firstName && billingAddress?.firstName) {
        firstName = billingAddress.firstName;
        lastName = billingAddress.lastName || lastName;
      }

      // Fallback para shippingAddress
      if (!firstName && shippingAddress?.firstName) {
        firstName = shippingAddress.firstName;
        lastName = shippingAddress.lastName || lastName;
      }

      // Phone fallback
      if (!customerPhone) {
        customerPhone = billingAddress?.phone || shippingAddress?.phone || order.phone || null;
      }

      const dataSource = customer?.firstName ? 'customer' :
                        billingAddress?.firstName ? 'billingAddress' :
                        shippingAddress?.firstName ? 'shippingAddress' : 'none';

      console.log(`Pedido ${order.name}: Nome: ${firstName} ${lastName} (Fonte: ${dataSource})`);

      return {
        id: order.shopifyId,
        name: order.name,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        email: customerEmail,
        phone: customerPhone,
        currentSubtotalLineItemsQuantity: Array.isArray(order.lineItems)
          ? (order.lineItems as any[]).reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0,
        totalPriceSet: {
          presentmentMoney: {
            amount: order.totalPrice.toString(),
            currencyCode: order.currency
          }
        },
        subtotalPriceSet: {
          presentmentMoney: {
            amount: order.subtotalPrice.toString(),
            currencyCode: order.currency
          }
        },
        totalShippingPriceSet: {
          presentmentMoney: {
            amount: order.totalShippingPrice.toString(),
            currencyCode: order.currency
          }
        },
        totalTaxSet: {
          presentmentMoney: {
            amount: order.totalTax.toString(),
            currencyCode: order.currency
          }
        },
        totalDiscountsSet: {
          presentmentMoney: {
            amount: order.totalDiscounts.toString(),
            currencyCode: order.currency
          }
        },
        displayFinancialStatus: order.financialStatus.toUpperCase(),
        displayFulfillmentStatus: order.fulfillmentStatus?.toUpperCase() || null,
        district: {
          value: district || '',
          source: district ? 'address' : 'none'
        },
        customer: {
          id: order.customerId,
          firstName: firstName,
          lastName: lastName,
          email: customerEmail,
          phone: customerPhone,
          cpf: {
            value: cpf,
            source: cpf ? 'address' : null
          },
          defaultAddress: customer?.defaultAddress || billingAddress || shippingAddress || null,
          dataSource: dataSource
        },
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        lineItems: order.lineItems ? {
          edges: Array.isArray(order.lineItems)
            ? (order.lineItems as any[]).map((item: any) => ({
                node: {
                  id: item.id,
                  title: item.title || item.name,
                  quantity: item.quantity,
                  originalUnitPriceSet: {
                    presentmentMoney: {
                      amount: item.price?.toString() || '0',
                      currencyCode: order.currency
                    }
                  },
                  discountedUnitPriceSet: {
                    presentmentMoney: {
                      amount: item.price?.toString() || '0',
                      currencyCode: order.currency
                    }
                  }
                }
              }))
            : []
        } : { edges: [] },
        shippingLines: order.shippingLines ? {
          edges: Array.isArray(order.shippingLines)
            ? (order.shippingLines as any[]).map((line: any) => ({
                node: {
                  id: line.id,
                  title: line.title
                }
              }))
            : []
        } : { edges: [] },
        customAttributes: []
      };
    });

    console.log(`\n📊 Pedidos formatados: ${formattedOrders.length}`);

    // Contar quantos pedidos têm nome do cliente
    const withNames = formattedOrders.filter(o => o.customer.firstName && o.customer.lastName).length;
    const fromCustomer = formattedOrders.filter(o => o.customer.dataSource === 'customer').length;
    const fromBilling = formattedOrders.filter(o => o.customer.dataSource === 'billingAddress').length;
    const fromShipping = formattedOrders.filter(o => o.customer.dataSource === 'shippingAddress').length;

    console.log(`✅ Pedidos com nomes: ${withNames}/${formattedOrders.length}`);
    console.log(`📊 Fonte customer (webhook): ${fromCustomer}`);
    console.log(`📊 Fonte billingAddress: ${fromBilling}`);
    console.log(`📊 Fonte shippingAddress: ${fromShipping}`);

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      summary: {
        totalOrders,
        totalSales: Math.round(totalSales),
        currency: 'BRL',
        withCustomerNames: withNames,
        dataSources: {
          customer: fromCustomer,
          billingAddress: fromBilling,
          shippingAddress: fromShipping,
          none: formattedOrders.length - withNames
        }
      },
      statusCount,
      message: 'Pedidos carregados com sucesso do banco de dados (via webhooks)!',
      notice: '✅ Dados obtidos do Prisma - SEM restrições de PII da Shopify!'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos do Prisma:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Função auxiliar para traduzir status
function getStatusInPortuguese(financialStatus: string, fulfillmentStatus: string | null): string {
  const financial = financialStatus.toUpperCase();
  const fulfillment = fulfillmentStatus?.toUpperCase() || null;

  if (fulfillment === 'FULFILLED') return 'Entregue';
  if (fulfillment === 'PARTIAL') return 'Enviado';
  if (fulfillment === 'SHIPPED') return 'Enviado';
  if (financial === 'PAID') return 'Processando';
  if (financial === 'PENDING') return 'Pendente';
  if (financial === 'AUTHORIZED') return 'Autorizado';
  if (financial === 'PARTIALLY_PAID') return 'Parcialmente Pago';
  if (financial === 'PARTIALLY_REFUNDED') return 'Parcialmente Reembolsado';
  if (financial === 'REFUNDED') return 'Reembolsado';
  if (financial === 'VOIDED') return 'Cancelado';
  return 'Pendente';
}
