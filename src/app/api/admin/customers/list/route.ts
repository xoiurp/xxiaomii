import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url || 'http://localhost:3000');
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { shopifyId: { contains: search } }
      ];
    }

    if (status !== 'all') {
      switch (status) {
        case 'active':
          where.state = 'enabled';
          break;
        case 'inactive':
          where.state = 'disabled';
          break;
        case 'vip':
          where.OR = [
            { ordersCount: { gt: 2 } },
            { totalSpent: { gt: 500 } }
          ];
          break;
        case 'marketing':
          where.acceptsMarketing = true;
          break;
      }
    }

    console.log('🔍 Buscando clientes com filtros:', { where, skip, limit, page });

    // Buscar clientes
    const [customers, totalCount] = await Promise.all([
      prisma.shopifyCustomer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shopifyCustomer.count({ where })
    ]);

    console.log(`✅ Encontrados ${customers.length} clientes de ${totalCount} total`);

    // Calcular estatísticas
    const stats = await prisma.shopifyCustomer.aggregate({
      _count: { id: true },
      _sum: { totalSpent: true, ordersCount: true },
      _avg: { totalSpent: true, averageOrderValue: true }
    });

    const activeCount = await prisma.shopifyCustomer.count({
      where: { state: 'enabled' }
    });

    const vipCount = await prisma.shopifyCustomer.count({
      where: {
        OR: [
          { ordersCount: { gt: 2 } },
          { totalSpent: { gt: 500 } }
        ]
      }
    });

    const marketingCount = await prisma.shopifyCustomer.count({
      where: { acceptsMarketing: true }
    });

    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      shopifyId: customer.shopifyId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      acceptsMarketing: customer.acceptsMarketing,
      acceptsMarketingUpdatedAt: customer.acceptsMarketingUpdatedAt,
      ordersCount: customer.ordersCount,
      totalSpent: customer.totalSpent,
      averageOrderValue: customer.averageOrderValue,
      state: customer.state,
      tags: customer.tags,
      note: customer.note,
      taxExempt: customer.taxExempt,
      taxExemptions: customer.taxExemptions,
      currency: customer.currency,
      marketingOptInLevel: customer.marketingOptInLevel,
      emailMarketingConsent: customer.emailMarketingConsent,
      smsMarketingConsent: customer.smsMarketingConsent,
      adminGraphqlApiId: customer.adminGraphqlApiId,
      defaultAddress: customer.defaultAddress,
      addresses: customer.addresses,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      lastSyncAt: customer.lastSyncAt ? customer.lastSyncAt.toISOString() : new Date(0).toISOString()
    }));

    console.log('📊 Exemplo de cliente formatado (primeiro):',
      formattedCustomers[0] ? {
        id: formattedCustomers[0].id,
        shopifyId: formattedCustomers[0].shopifyId,
        name: `${formattedCustomers[0].firstName} ${formattedCustomers[0].lastName}`,
        email: formattedCustomers[0].email,
        ordersCount: formattedCustomers[0].ordersCount,
        totalSpent: formattedCustomers[0].totalSpent,
        averageOrderValue: formattedCustomers[0].averageOrderValue
      } : 'Nenhum cliente encontrado'
    );

    return NextResponse.json({
      success: true,
      customers: formattedCustomers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      stats: {
        totalCustomers: stats._count.id,
        activeCustomers: activeCount,
        vipCustomers: vipCount,
        marketingOptIn: marketingCount,
        totalRevenue: stats._sum.totalSpent || 0,
        avgLifetimeValue: stats._avg.totalSpent || 0,
        totalOrders: stats._sum.ordersCount || 0,
        avgOrderValue: stats._avg.averageOrderValue || 0
      }
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({
      error: 'Erro ao buscar lista de clientes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    // Não é necessário desconectar a instância compartilhada
  }
}
