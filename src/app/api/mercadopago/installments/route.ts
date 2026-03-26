import { NextRequest, NextResponse } from 'next/server'
import { getInstallments, toDecimal } from '@/lib/mercadopago'

interface InstallmentOption {
  installments: number
  total: number
  installment_value: number
  has_interest: boolean
  message: string
}

/**
 * POST /api/mercadopago/installments
 *
 * Retorna opcoes de parcelas do Mercado Pago baseadas no BIN do cartao.
 * O BIN (primeiros 6-8 digitos) determina as taxas especificas do cartao.
 */
export async function POST(request: NextRequest) {
  try {
    const { bin, amount } = await request.json()

    if (!bin || typeof bin !== 'string' || bin.length < 6) {
      return NextResponse.json(
        { error: 'A valid card BIN (first 6+ digits) is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount is required and must be positive (in cents)' },
        { status: 400 }
      )
    }

    const amountDecimal = toDecimal(amount)

    try {
      const mpResult = await getInstallments(bin, amountDecimal)

      // Normalizar resposta do Mercado Pago
      const payerCosts = mpResult?.[0]?.payer_costs || []

      const installments: InstallmentOption[] = payerCosts.map((cost: any) => ({
        installments: cost.installments,
        total: Math.round(cost.total_amount * 100), // converter para centavos
        installment_value: Math.round(cost.installment_amount * 100),
        has_interest: cost.installment_rate > 0,
        message: cost.recommended_message || `${cost.installments}x de R$ ${cost.installment_amount.toFixed(2)}`,
      }))

      return NextResponse.json({
        data: {
          installments,
          payment_method_id: mpResult?.[0]?.payment_method_id || null,
          issuer_id: mpResult?.[0]?.issuer?.id || null,
          issuer_name: mpResult?.[0]?.issuer?.name || null,
        },
      })
    } catch (mpError) {
      console.error('MercadoPago installments API error, using local fallback:', mpError)
      return NextResponse.json({
        data: {
          installments: buildLocalInstallments(amount),
          payment_method_id: null,
          issuer_id: null,
          issuer_name: null,
        },
      })
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
 * Calculo local de parcelas (fallback quando API do MP nao esta disponivel).
 * Simula taxas de 1.99% por parcela acima de 6x.
 */
function buildLocalInstallments(totalValueCents: number): InstallmentOption[] {
  const installments: InstallmentOption[] = []
  for (let i = 1; i <= 12; i++) {
    const valuePerInstallment = totalValueCents / i
    if (valuePerInstallment >= 5000 || i === 1) { // minimo R$50 por parcela
      const hasInterest = i > 6
      const totalWithInterest = hasInterest
        ? Math.round(totalValueCents * Math.pow(1.0199, i))
        : totalValueCents
      const installmentValue = Math.round(totalWithInterest / i)
      installments.push({
        installments: i,
        total: totalWithInterest,
        installment_value: installmentValue,
        has_interest: hasInterest,
        message: hasInterest
          ? `${i}x de R$ ${(installmentValue / 100).toFixed(2)} (com juros)`
          : `${i}x de R$ ${(installmentValue / 100).toFixed(2)} sem juros`,
      })
    }
  }
  return installments
}
