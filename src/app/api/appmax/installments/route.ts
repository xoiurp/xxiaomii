import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMerchantToken, getInstallments } from '@/lib/appmax'

/**
 * POST /api/appmax/installments
 * Retorna opcoes de parcelas com taxas reais configuradas na AppMax.
 */
export async function POST(request: NextRequest) {
  try {
    const { total_value } = await request.json()

    if (!total_value || total_value <= 0) {
      return NextResponse.json(
        { error: 'total_value is required and must be positive' },
        { status: 400 }
      )
    }

    // Buscar credenciais do merchant ativo
    const merchant = await prisma.appmaxMerchant.findFirst({
      where: { isActive: true },
      orderBy: { installedAt: 'desc' },
    })

    if (!merchant) {
      // Fallback: calculo local se AppMax nao esta configurada ainda
      return NextResponse.json({ data: buildLocalInstallments(total_value) })
    }

    try {
      const token = await getMerchantToken(merchant.clientId, merchant.clientSecret)
      const result = await getInstallments(token, total_value, 12)
      return NextResponse.json(result)
    } catch (appmaxError) {
      console.error('AppMax installments error, using local fallback:', appmaxError)
      return NextResponse.json({ data: buildLocalInstallments(total_value) })
    }
  } catch (error) {
    console.error('Installments error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate installments' },
      { status: 500 }
    )
  }
}

/**
 * Calculo local de parcelas (fallback quando AppMax nao esta disponivel).
 * Simula taxas de 1.99% por parcela acima de 6x.
 */
function buildLocalInstallments(totalValueCents: number) {
  const installments = []
  for (let i = 1; i <= 12; i++) {
    const valuePerInstallment = totalValueCents / i
    if (valuePerInstallment >= 5000 || i === 1) { // minimo R$50 por parcela
      const hasInterest = i > 6
      const totalWithInterest = hasInterest
        ? Math.round(totalValueCents * Math.pow(1.0199, i))
        : totalValueCents
      installments.push({
        installments: i,
        total: totalWithInterest,
        installment_value: Math.round(totalWithInterest / i),
        has_interest: hasInterest,
      })
    }
  }
  return { installments }
}
