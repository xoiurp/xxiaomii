import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Webhook receiver AppMax
 *
 * Recebe eventos de mudanca de status de pedidos e outras notificacoes.
 * Eventos possiveis: pendente, aprovado, autorizado, cancelado, estornado,
 * recusado_por_risco, integrado, chargeback_*, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log('AppMax webhook received:', JSON.stringify(payload, null, 2))

    // Extrair dados do evento
    const orderId = payload.order_id || payload.data?.order?.id
    const status = payload.status || payload.data?.order?.status
    const event = payload.event || 'status_update'

    // Salvar log do webhook
    await prisma.appmaxWebhookLog.create({
      data: {
        event,
        orderId: orderId ? Number(orderId) : null,
        status,
        payload,
      },
    })

    // Se temos um order_id e status, atualizar o pedido local
    if (orderId && status) {
      const existingOrder = await prisma.appmaxOrder.findUnique({
        where: { appmaxOrderId: Number(orderId) },
      })

      if (existingOrder) {
        const updateData: any = { status }

        // Marcar data de pagamento se aprovado
        if (status === 'aprovado' && !existingOrder.paidAt) {
          updateData.paidAt = new Date()
        }

        // Marcar data de estorno
        if (status === 'estornado' && !existingOrder.refundedAt) {
          updateData.refundedAt = new Date()
        }

        await prisma.appmaxOrder.update({
          where: { appmaxOrderId: Number(orderId) },
          data: updateData,
        })

        console.log(`AppMax order #${orderId} updated to status: ${status}`)
      } else {
        console.log(`AppMax order #${orderId} not found locally, webhook logged only`)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('AppMax webhook error:', error)
    // Retornar 200 mesmo em erro para evitar reenvios infinitos
    return NextResponse.json({ received: true, error: 'Processing error' }, { status: 200 })
  }
}

// GET para verificacao de que o endpoint esta ativo
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'appmax-webhooks' })
}
