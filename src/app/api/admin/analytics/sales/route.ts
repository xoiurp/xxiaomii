import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando analytics de vendas via Prisma...');

    const searchParams = request.nextUrl.searchParams;

    // Aceitar parâmetros de data personalizados ou usar dias como fallback
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '7');

    // Calcular datas baseadas nos parâmetros
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else {
      const today = new Date();
      startDate = startOfDay(subDays(today, days - 1));
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

    // Calcular métricas
    const today = new Date();
    const today_start = startOfDay(today);
    const yesterday_start = startOfDay(subDays(today, 1));
    const yesterday_end = endOfDay(subDays(today, 1));

    // Pedidos de hoje
    const todayOrders = orders.filter(order =>
      new Date(order.createdAt) >= today_start
    );

    // Pedidos de ontem
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= yesterday_start && orderDate <= yesterday_end;
    });

    // Calcular totais
    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Calcular percentual de mudança
    const salesPercentageChange = yesterdaySales > 0
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
      : todaySales > 0 ? 100 : 0;

    const ordersPercentageChange = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : todayOrders.length > 0 ? 100 : 0;

    // Dados para gráfico baseado no período selecionado
    const chartData = [];
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const actualDays = Math.min(totalDays, 30); // Limitar a 30 dias para performance

    for (let i = actualDays - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayTotal = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0);

      chartData.push({
        name: format(date, 'EEE'),
        date: format(date, 'yyyy-MM-dd'),
        vendas: Math.round(dayTotal),
        pedidos: dayOrders.length
      });
    }

    // Produtos mais vendidos
    const productSales = new Map<string, { title: string; quantity: number }>();
    orders.forEach(order => {
      if (Array.isArray(order.lineItems)) {
        (order.lineItems as any[]).forEach((item: any) => {
          const title = item.title || item.name || 'Produto sem nome';
          const current = productSales.get(title) || { title, quantity: 0 };
          current.quantity += item.quantity || 0;
          productSales.set(title, current);
        });
      }
    });

    const totalProductQuantity = Array.from(productSales.values())
      .reduce((sum, p) => sum + p.quantity, 0);

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4)
      .map((product, index) => ({
        name: product.title,
        value: totalProductQuantity > 0
          ? Math.round((product.quantity / totalProductQuantity) * 100)
          : 0,
        color: ['#FF6700', '#FF8533', '#FFA366', '#FFC199'][index] || '#FFE5CC'
      }));

    // Pedidos recentes (últimos 5)
    const recentOrders = orders
      .slice(0, 5)
      .map(order => {
        const customer = order.customerId ? customerMap.get(order.customerId) : null;
        const billingAddress = order.billingAddress as any;
        const shippingAddress = order.shippingAddress as any;

        // Determinar nome do cliente
        let firstName = customer?.firstName || billingAddress?.first_name || shippingAddress?.first_name || null;
        let lastName = customer?.lastName || billingAddress?.last_name || shippingAddress?.last_name || null;
        let email = customer?.email || order.email || null;

        const customerName = firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || email || 'Cliente Shopify';

        // Pegar primeiro produto
        const firstProduct = Array.isArray(order.lineItems) && order.lineItems.length > 0
          ? (order.lineItems as any[])[0].title || (order.lineItems as any[])[0].name || 'Produto'
          : 'Produto';

        return {
          id: order.name,
          customer: customerName,
          product: firstProduct,
          value: `R$ ${order.totalPrice.toFixed(2)}`,
          status: getStatusInPortuguese(order.financialStatus, order.fulfillmentStatus),
          createdAt: order.createdAt.toISOString()
        };
      });

    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    console.log('📊 Estatísticas calculadas:', {
      todaySales: Math.round(todaySales),
      totalOrders: orders.length,
      totalSales: Math.round(totalSales)
    });

    return NextResponse.json({
      success: true,
      dataSource: 'local_db',
      notice: '✅ Dados obtidos do Prisma - SEM restrições de PII!',
      metrics: {
        salesToday: {
          amount: Math.round(todaySales),
          currency: 'BRL',
          percentageChange: Math.round(salesPercentageChange * 10) / 10
        },
        ordersToday: {
          count: todayOrders.length,
          percentageChange: Math.round(ordersPercentageChange * 10) / 10
        },
        totalOrders: orders.length,
        totalSales: Math.round(totalSales)
      },
      chartData,
      topProducts,
      recentOrders,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar analytics de vendas:', error);
    return NextResponse.json({
      error: 'Erro ao buscar dados de vendas',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Função auxiliar para traduzir status
function getStatusInPortuguese(financialStatus: string, fulfillmentStatus: string | null): string {
  const financial = financialStatus.toLowerCase();
  const fulfillment = fulfillmentStatus?.toLowerCase() || null;

  if (fulfillment === 'fulfilled') return 'Entregue';
  if (fulfillment === 'partial') return 'Enviado';
  if (fulfillment === 'shipped') return 'Enviado';
  if (financial === 'paid') return 'Processando';
  if (financial === 'pending') return 'Pendente';
  if (financial === 'authorized') return 'Autorizado';
  if (financial === 'partially_paid') return 'Parcialmente Pago';
  if (financial === 'partially_refunded') return 'Parcialmente Reembolsado';
  if (financial === 'refunded') return 'Reembolsado';
  if (financial === 'voided') return 'Cancelado';
  return 'Pendente';
}
