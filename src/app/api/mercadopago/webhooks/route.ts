import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getPayment } from '@/lib/mercadopago'

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || ''

/**
 * POST /api/mercadopago/webhooks
 *
 * Recebe notificações do Mercado Pago sobre mudanças de status de pagamento.
 * Valida a assinatura HMAC-SHA256 e busca os dados completos do pagamento.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('MP Webhook received:', JSON.stringify(body))

    // Validar assinatura se secret configurado
    if (WEBHOOK_SECRET) {
      const xSignature = request.headers.get('x-signature') || ''
      const xRequestId = request.headers.get('x-request-id') || ''

      if (!validateSignature(xSignature, xRequestId, body.data?.id, WEBHOOK_SECRET)) {
        console.error('MP Webhook: invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // MP envia diferentes tipos de notificação
    const { type, action, data } = body

    // Processar apenas notificações de pagamento
    if (type === 'payment' || action?.startsWith('payment.')) {
      const paymentId = data?.id
      if (!paymentId) {
        console.error('MP Webhook: missing payment id')
        return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
      }

      // Buscar dados completos do pagamento na API do MP
      const payment = await getPayment(String(paymentId))

      console.log('MP Webhook payment details:', {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
        payment_method_id: payment.payment_method_id,
      })

      // Mapear status do MP para status interno
      const statusMap: Record<string, string> = {
        approved: 'aprovado',
        pending: 'pendente',
        in_process: 'pendente',
        rejected: 'recusado',
        cancelled: 'cancelado',
        refunded: 'estornado',
        charged_back: 'chargeback',
      }

      const internalStatus = statusMap[payment.status] || payment.status

      // TODO: Atualizar pedido no banco quando model MercadoPagoOrder existir
      // await prisma.mercadoPagoOrder.updateMany({
      //   where: { mpPaymentId: String(payment.id) },
      //   data: {
      //     status: internalStatus,
      //     paidAt: payment.status === 'approved' ? new Date() : undefined,
      //   },
      // })

      console.log(`MP Webhook: payment ${paymentId} → ${internalStatus}`)
    }

    // Sempre retornar 200 para evitar retries do MP
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('MP Webhook error:', error)
    // Retornar 200 mesmo em erro para evitar retries infinitos
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}

/**
 * Valida a assinatura HMAC-SHA256 do webhook do Mercado Pago.
 *
 * O header x-signature tem formato: "id:{data.id};request-id:{x-request-id};ts:{timestamp};v1:{hash}"
 * O hash é HMAC-SHA256(secret, template)
 */
function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string | undefined,
  secret: string
): boolean {
  if (!xSignature || !secret) return false

  try {
    // Extrair partes do x-signature
    const parts: Record<string, string> = {}
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) parts[key.trim()] = value.trim()
    })

    const ts = parts['ts']
    const hash = parts['v1']
    if (!ts || !hash) return false

    // Construir o template para verificação
    // Formato: "id:{data.id};request-id:{x-request-id};ts:{timestamp};"
    let template = ''
    if (dataId) template += `id:${dataId};`
    if (xRequestId) template += `request-id:${xRequestId};`
    template += `ts:${ts};`

    // Calcular HMAC
    const expectedHash = createHmac('sha256', secret)
      .update(template)
      .digest('hex')

    return expectedHash === hash
  } catch (error) {
    console.error('Signature validation error:', error)
    return false
  }
}
