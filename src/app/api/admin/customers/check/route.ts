import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopifyId = searchParams.get('shopifyId');

    if (!shopifyId) {
      return NextResponse.json({
        error: 'shopifyId é obrigatório'
      }, { status: 400 });
    }

    // Buscar cliente específico
    const customer = await prisma.shopifyCustomer.findUnique({
      where: { shopifyId }
    });

    // Também buscar todos para comparar
    const allCustomers = await prisma.shopifyCustomer.findMany({
      select: {
        shopifyId: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      searchedFor: shopifyId,
      found: !!customer,
      customer: customer || null,
      recentCustomers: allCustomers,
      totalInDatabase: allCustomers.length
    });

  } catch (error) {
    console.error('Erro ao verificar cliente:', error);
    return NextResponse.json({
      error: 'Erro ao verificar cliente',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
