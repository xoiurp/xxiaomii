import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Removido 'edge' runtime porque Prisma não funciona no Edge Runtime
// export const runtime = 'edge';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
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

    const today = new Date();
    const todayStart = startOfDay(today);
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));
    const weekAgo = startOfDay(subDays(today, 7));
    const monthAgo = startOfDay(subDays(today, 30));

    // Buscar todos os clientes sincronizados
    const customers = await prisma.shopifyCustomer.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Se não há dados sincronizados, sugerir sincronização
    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        dataSource: 'local_db',
        notice: "Nenhum cliente sincronizado encontrado. Execute a sincronização primeiro.",
        needsSync: true,
        metrics: {
          totalCustomers: 0,
          newToday: 0,
          newThisWeek: 0,
          activeCustomers: 0,
          vipCustomers: 0,
          marketingOptIn: 0,
          percentageChange: 0
        },
        insights: {
          avgLifetimeValue: 0,
          activeRate: 0,
          vipRate: 0,
          marketingOptInRate: 0,
          avgOrderValue: 0,
          totalRevenue: 0
        },
        topLocations: [],
        recentCustomers: [],
        summary: {
          growth: 'neutral',
          healthScore: 0
        }
      });
    }

    // Calcular métricas baseadas nos dados sincronizados
    const totalCustomers = customers.length;
    
    // Clientes criados hoje
    const todayCustomers = customers.filter(customer => 
      new Date(customer.createdAt) >= todayStart
    );

    // Clientes criados ontem
    const yesterdayCustomers = customers.filter(customer => {
      const customerDate = new Date(customer.createdAt);
      return customerDate >= yesterdayStart && customerDate <= yesterdayEnd;
    });

    // Clientes criados na última semana
    const weekCustomers = customers.filter(customer => 
      new Date(customer.createdAt) >= weekAgo
    );

    // Clientes criados no último mês
    const monthCustomers = customers.filter(customer => 
      new Date(customer.createdAt) >= monthAgo
    );

    // Clientes ativos (enabled)
    const activeCustomers = customers.filter(customer => 
      customer.state === 'enabled'
    );

    // Clientes VIP (mais de 2 pedidos ou gasto > R$ 500)
    const vipCustomers = customers.filter(customer => 
      customer.ordersCount > 2 || customer.totalSpent > 500
    );

    // Clientes que aceitam marketing
    const marketingOptIn = customers.filter(customer => 
      customer.acceptsMarketing
    );

    // Calcular percentual de mudança
    const customersPercentageChange = yesterdayCustomers.length > 0 
      ? ((todayCustomers.length - yesterdayCustomers.length) / yesterdayCustomers.length) * 100 
      : todayCustomers.length > 0 ? 100 : 0;

    // Calcular métricas financeiras
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const avgOrderValue = customers.reduce((sum, customer) => sum + customer.averageOrderValue, 0) / totalCustomers;

    // Distribuição geográfica (baseada no endereço padrão)
    const locationDistribution = new Map();
    customers.forEach(customer => {
      if (customer.defaultAddress) {
        const address = customer.defaultAddress as any;
        const location = address.province || address.country || 'Não informado';
        const current = locationDistribution.get(location) || 0;
        locationDistribution.set(location, current + 1);
      }
    });

    const topLocations = Array.from(locationDistribution.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / totalCustomers) * 100)
      }));

    // Clientes recentes (últimos 10)
    const recentCustomers = customers
      .slice(0, 10)
      .map((customer, index) => ({
        id: customer.id,
        name: customer.firstName && customer.lastName 
          ? `${customer.firstName} ${customer.lastName}`
          : customer.firstName || customer.lastName || `Cliente #${String(index + 1).padStart(3, '0')}`,
        email: customer.email || 'Email não informado',
        ordersCount: customer.ordersCount,
        totalSpent: `R$ ${customer.totalSpent.toFixed(2)}`,
        createdAt: customer.createdAt.toISOString(),
        isVip: customer.ordersCount > 2 || customer.totalSpent > 500,
        acceptsMarketing: customer.acceptsMarketing,
        state: customer.state,
        lastSyncAt: customer.lastSyncAt.toISOString()
      }));

    // Verificar quando foi a última sincronização
    const lastSyncLog = await prisma.customerSyncLog.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      dataSource: 'local_db',
      notice: `Dados de ${totalCustomers} clientes sincronizados do Shopify`,
      lastSync: lastSyncLog?.completedAt || null,
      metrics: {
        totalCustomers,
        newToday: todayCustomers.length,
        newThisWeek: weekCustomers.length,
        activeCustomers: activeCustomers.length,
        vipCustomers: vipCustomers.length,
        marketingOptIn: marketingOptIn.length,
        percentageChange: Math.round(customersPercentageChange * 10) / 10
      },
      insights: {
        avgLifetimeValue: Math.round(avgLifetimeValue),
        activeRate: Math.round((activeCustomers.length / totalCustomers) * 100),
        vipRate: Math.round((vipCustomers.length / totalCustomers) * 100),
        marketingOptInRate: Math.round((marketingOptIn.length / totalCustomers) * 100),
        avgOrderValue: Math.round(avgOrderValue),
        totalRevenue: Math.round(totalRevenue)
      },
      topLocations,
      recentCustomers,
      summary: {
        growth: todayCustomers.length > yesterdayCustomers.length ? 'positive' : 
                todayCustomers.length < yesterdayCustomers.length ? 'negative' : 'neutral',
        healthScore: Math.round(((activeCustomers.length + vipCustomers.length) / (totalCustomers * 2)) * 100)
      },
      syncInfo: {
        lastSync: lastSyncLog?.completedAt || null,
        totalSynced: totalCustomers,
        syncStatus: lastSyncLog?.status || 'never_synced',
        dataFreshness: lastSyncLog?.completedAt 
          ? `${Math.round((Date.now() - new Date(lastSyncLog.completedAt).getTime()) / (1000 * 60 * 60))}h atrás`
          : 'Nunca sincronizado'
      }
    });

  } catch (error) {
    console.error('Erro ao buscar analytics de clientes:', error);
    return NextResponse.json({
      error: 'Erro ao buscar dados de clientes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    // Não é necessário desconectar a instância compartilhada
  }
}
