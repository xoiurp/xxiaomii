import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

/**
 * URL de Validacao AppMax
 *
 * Quando um merchant instala o app na AppMax, ela envia um POST
 * com as credenciais do merchant para esta URL.
 * Devemos responder HTTP 200 com { external_id } para confirmar a instalacao.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, client_id, client_secret, external_key } = body

    console.log('AppMax health check received:', {
      app_id,
      external_key,
      client_id: client_id ? '***' + client_id.slice(-6) : undefined,
    })

    // Validar campos obrigatorios
    if (!app_id || !client_id || !client_secret) {
      return NextResponse.json(
        { error: 'Missing required fields: app_id, client_id, client_secret' },
        { status: 400 }
      )
    }

    // Gerar external_id unico para esta instalacao
    const externalId = randomUUID()

    // Salvar credenciais do merchant no banco
    await prisma.appmaxMerchant.upsert({
      where: { externalId },
      update: {
        appId: app_id,
        externalKey: external_key || '',
        clientId: client_id,
        clientSecret: client_secret,
        isActive: true,
      },
      create: {
        appId: app_id,
        externalKey: external_key || '',
        externalId: externalId,
        clientId: client_id,
        clientSecret: client_secret,
        isActive: true,
      },
    })

    console.log('AppMax merchant credentials saved. external_id:', externalId)

    return NextResponse.json({ external_id: externalId }, { status: 200 })
  } catch (error) {
    console.error('AppMax health check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET para verificacao simples de que o endpoint esta ativo
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'appmax-health' })
}
