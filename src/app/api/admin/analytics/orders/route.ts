import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando analytics de pedidos via Prisma...');

    const searchParams = request.nextUrl.searchParams;

    // Aceitar parâmetros de data personalizados
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else {
      const today = new Date();
      startDate = startOfDay(subDays(today, 30));
      endDate = endOfDay(today);
    }

    console.log(`📅 Período: ${startDate.toISOString()} até ${endDate.toISOString()}`);

    // Buscar pedidos do Prisma no período especificado
    const orders = await prisma.shopifyOrder.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 250
    });

    console.log(`✅ ${orders.length} pedidos encontrados no período`);

    // Buscar clientes relacionados
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

    // Criar mapa de clientes
    const customerMap = new Map(
      customers.map(customer => [customer.shopifyId, customer])
    );

    // Formatar pedidos
    const formattedOrders = orders.map(order => {
      const customer = order.customerId ? customerMap.get(order.customerId) : null;
      const billingAddress = order.billingAddress as any;
      const shippingAddress = order.shippingAddress as any;

      // Determinar nome do cliente
      let firstName = customer?.firstName || billingAddress?.first_name || shippingAddress?.first_name || null;
      let lastName = customer?.lastName || billingAddress?.last_name || shippingAddress?.last_name || null;
      let email = customer?.email || order.email || null;

      return {
        id: order.shopifyId,
        name: order.name,
        createdAt: order.createdAt.toISOString(),
        totalPriceSet: {
          shopMoney: {
            amount: order.totalPrice.toString(),
            currencyCode: order.currency
          }
        },
        displayFinancialStatus: order.financialStatus.toUpperCase(),
        displayFulfillmentStatus: order.fulfillmentStatus?.toUpperCase() || null,
        customer: {
          firstName: firstName,
          lastName: lastName,
          email: email
        },
        lineItems: {
          edges: Array.isArray(order.lineItems)
            ? (order.lineItems as any[]).slice(0, 3).map((item: any) => ({
                node: {
                  title: item.title || item.name,
                  quantity: item.quantity
                }
              }))
            : []
        }
      };
    });

    // Calcular estatísticas
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Contar por status financeiro
    const statusCount: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.financialStatus.toUpperCase();
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    // Contar por status de fulfillment
    const fulfillmentCount: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.fulfillmentStatus?.toUpperCase() || 'UNFULFILLED';
      fulfillmentCount[status] = (fulfillmentCount[status] || 0) + 1;
    });

    // Pedidos por dia (últimos 7 dias para o gráfico)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return startOfDay(date);
    });

    const ordersByDay = last7Days.map(day => {
      const dayEnd = endOfDay(day);
      const count = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= day && orderDate <= dayEnd;
      }).length;

      return {
        date: day.toISOString().split('T')[0],
        count: count
      };
    });

    // Top produtos (dos line items)
    const productCounts = new Map<string, { title: string; quantity: number }>();
    orders.forEach(order => {
      if (Array.isArray(order.lineItems)) {
        (order.lineItems as any[]).forEach((item: any) => {
          const title = item.title || item.name || 'Produto sem nome';
          const existing = productCounts.get(title);
          if (existing) {
            existing.quantity += item.quantity || 0;
          } else {
            productCounts.set(title, { title, quantity: item.quantity || 0 });
          }
        });
      }
    });

    const topProducts = Array.from(productCounts.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log('📊 Estatísticas calculadas:', {
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      averageOrderValue: Math.round(averageOrderValue)
    });

    return NextResponse.json({
      success: true,
      dataSource: 'local_db',
      notice: '✅ Dados obtidos do Prisma - SEM restrições de PII!',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      orders: formattedOrders,
      stats: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        averageOrderValue: Math.round(averageOrderValue)
      },
      statusCount,
      fulfillmentCount,
      ordersByDay,
      topProducts
    });

  } catch (error) {
    console.error('❌ Erro ao buscar analytics de pedidos:', error);
    return NextResponse.json({
      error: 'Erro ao buscar analytics de pedidos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
