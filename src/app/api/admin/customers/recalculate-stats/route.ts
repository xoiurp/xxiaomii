import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0;

/**
 * Endpoint para recalcular estatísticas de clientes
 * (ordersCount, totalSpent, averageOrderValue)
 * baseadas nos pedidos reais no banco de dados
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Iniciando recálculo de estatísticas de clientes...');

    // Buscar todos os clientes
    const customers = await prisma.shopifyCustomer.findMany({
      select: {
        id: true,
        shopifyId: true,
        firstName: true,
        lastName: true,
        ordersCount: true,
        totalSpent: true,
        averageOrderValue: true
      }
    });

    console.log(`📊 Total de clientes a recalcular: ${customers.length}`);

    let updatedCount = 0;
    let unchangedCount = 0;

    // Processar cada cliente
    for (const customer of customers) {
      // Buscar todos os pedidos deste cliente
      const customerOrders = await prisma.shopifyOrder.findMany({
        where: { customerId: customer.shopifyId },
        select: { totalPrice: true }
      });

      const realOrdersCount = customerOrders.length;
      const realTotalSpent = customerOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const realAverageOrderValue = realOrdersCount > 0 ? realTotalSpent / realOrdersCount : 0;

      // Verificar se houve mudança
      const hasChanged =
        customer.ordersCount !== realOrdersCount ||
        Math.abs(customer.totalSpent - realTotalSpent) > 0.01 ||
        Math.abs((customer.averageOrderValue || 0) - realAverageOrderValue) > 0.01;

      if (hasChanged) {
        // Atualizar cliente
        await prisma.shopifyCustomer.update({
          where: { id: customer.id },
          data: {
            ordersCount: realOrdersCount,
            totalSpent: realTotalSpent,
            averageOrderValue: realAverageOrderValue,
            lastSyncAt: new Date()
          }
        });

        console.log(`✅ Cliente atualizado: ${customer.firstName} ${customer.lastName}`, {
          shopifyId: customer.shopifyId,
          before: {
            ordersCount: customer.ordersCount,
            totalSpent: customer.totalSpent,
            averageOrderValue: customer.averageOrderValue
          },
          after: {
            ordersCount: realOrdersCount,
            totalSpent: realTotalSpent,
            averageOrderValue: realAverageOrderValue
          }
        });

        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log('✅ Recálculo concluído:', {
      total: customers.length,
      updated: updatedCount,
      unchanged: unchangedCount
    });

    return NextResponse.json({
      success: true,
      message: 'Estatísticas de clientes recalculadas com sucesso',
      stats: {
        totalCustomers: customers.length,
        updated: updatedCount,
        unchanged: unchangedCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao recalcular estatísticas:', error);
    return NextResponse.json({
      error: 'Erro ao recalcular estatísticas',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
