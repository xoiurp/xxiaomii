import { NextRequest, NextResponse } from 'next/server'
import { createPayment, MercadoPagoError, toDecimal } from '@/lib/mercadopago'

interface CheckoutRequest {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
    document_number: string
  }
  address: {
    postcode: string
    street: string
    number: string
    complement?: string
    district: string
    city: string
    state: string
  }
  products: Array<{
    sku: string
    name: string
    quantity: number
    unit_value: number // centavos
    type?: 'physical' | 'digital'
  }>
  shipping_value: number // centavos
  discount_value: number // centavos
  payment_method: 'credit_card' | 'pix' | 'boleto'
  // Campos MP no root (enviados pelo frontend)
  card_token?: string
  payment_method_id?: string
  issuer_id?: number
  installments?: number
}

interface NormalizedResponse {
  success: true
  order: {
    id: string
    mp_payment_id: string
    status: string
    total: number
  }
  payment: {
    method: 'credit_card' | 'pix' | 'boleto'
    qr_code?: string
    emv_code?: string
    expires_at?: string
    url?: string
    barcode?: string
    due_date?: string
  }
}

/**
 * POST /api/mercadopago/checkout
 *
 * Fluxo completo de checkout via Mercado Pago:
 * 1. Validar campos obrigatorios
 * 2. Montar payload de pagamento (credit_card / pix / boleto)
 * 3. Chamar createPayment da lib
 * 4. Salvar pedido no banco local
 * 5. Retornar resposta normalizada
 */
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()

    // Validar campos obrigatorios
    const validationError = validateRequest(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // ========================================
    // ETAPA 1: Calcular totais
    // ========================================
    const productsValueCents = body.products.reduce(
      (sum, p) => sum + p.unit_value * p.quantity,
      0
    )
    const totalCents = productsValueCents + body.shipping_value - body.discount_value

    // ========================================
    // ETAPA 2: Montar payload para Mercado Pago
    // Seguindo estrutura exata da documentação oficial
    // ========================================
    const phone = body.customer.phone.replace(/\D/g, '')
    const cpf = body.customer.document_number.replace(/\D/g, '')
    const cep = body.address.postcode.replace(/\D/g, '')
    const streetNumber = parseInt(body.address.number) || 0

    const paymentPayload: Record<string, any> = {
      transaction_amount: toDecimal(totalCents),
      description: body.products.map((p) => `${p.quantity}x ${generalizeProductName(p.name)}`).join(', '),
      statement_descriptor: 'MIMIBRASIL',
      external_reference: 'MIMI-' + Date.now(),
      notification_url: 'https://xiaomidobrasil.com.br/api/mercadopago/webhooks',
      binary_mode: false,
      installments: body.installments || 1,
      payer: {
        entity_type: 'individual',
        type: 'customer',
        email: body.customer.email,
        first_name: body.customer.first_name,
        last_name: body.customer.last_name,
        identification: {
          type: cpf.length <= 11 ? 'CPF' : 'CNPJ',
          number: cpf,
        },
      },
      additional_info: {
        items: body.products.map((p) => ({
          id: p.sku,
          title: generalizeProductName(p.name),
          description: generalizeProductName(p.name),
          category_id: 'electronics',
          quantity: p.quantity,
          unit_price: toDecimal(p.unit_value),
          type: 'electronics',
        })),
        payer: {
          first_name: body.customer.first_name,
          last_name: body.customer.last_name,
          phone: {
            area_code: phone.slice(0, 2),
            number: phone.slice(2),
          },
          address: {
            zip_code: cep,
            street_name: body.address.street,
            street_number: streetNumber,
          },
        },
        shipments: {
          receiver_address: {
            zip_code: cep,
            state_name: body.address.state,
            city_name: body.address.city,
            street_name: body.address.street,
            street_number: streetNumber,
          },
        },
      },
    }

    // Configurar metodo de pagamento
    if (body.payment_method === 'credit_card') {
      if (!body.card_token) {
        return NextResponse.json(
          { error: 'Card token is required' },
          { status: 400 }
        )
      }

      paymentPayload.token = body.card_token
      paymentPayload.payment_method_id = body.payment_method_id
      paymentPayload.issuer_id = body.issuer_id
      paymentPayload.installments = body.installments || 1
      paymentPayload.capture = true
      paymentPayload.three_d_secure_mode = 'optional'
    } else if (body.payment_method === 'pix') {
      paymentPayload.payment_method_id = 'pix'
      paymentPayload.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    } else if (body.payment_method === 'boleto') {
      paymentPayload.payment_method_id = 'bolbradesco'
    }

    // ========================================
    // ETAPA 3: Processar pagamento no Mercado Pago
    // ========================================
    const mpResponse = await createPayment(paymentPayload)

    // Log completo da resposta para debug
    console.log('MercadoPago payment response:', JSON.stringify({
      id: mpResponse.id,
      status: mpResponse.status,
      status_detail: mpResponse.status_detail,
      payment_method_id: mpResponse.payment_method_id,
      payment_type_id: mpResponse.payment_type_id,
      transaction_amount: mpResponse.transaction_amount,
      shipping_amount: mpResponse.shipping_amount,
      installments: mpResponse.installments,
      date_of_expiration: mpResponse.date_of_expiration,
      point_of_interaction: mpResponse.point_of_interaction ? {
        type: mpResponse.point_of_interaction.type,
        has_qr_code: !!mpResponse.point_of_interaction.transaction_data?.qr_code,
        has_qr_base64: !!mpResponse.point_of_interaction.transaction_data?.qr_code_base64,
        has_ticket_url: !!mpResponse.point_of_interaction.transaction_data?.ticket_url,
      } : null,
      transaction_details: mpResponse.transaction_details,
      card: mpResponse.card ? { last_four: mpResponse.card.last_four_digits } : null,
    }))

    // ========================================
    // ETAPA 4: Normalizar resposta por metodo
    // ========================================
    let paymentData: NormalizedResponse['payment'] = {
      method: body.payment_method,
    }

    if (body.payment_method === 'pix') {
      const txData = mpResponse.point_of_interaction?.transaction_data
      paymentData = {
        method: 'pix',
        qr_code: txData?.qr_code_base64
          ? `data:image/png;base64,${txData.qr_code_base64}`
          : undefined,
        emv_code: txData?.qr_code || undefined,
        expires_at: mpResponse.date_of_expiration || undefined,
        url: txData?.ticket_url || undefined,
      }
    } else if (body.payment_method === 'boleto') {
      paymentData = {
        method: 'boleto',
        url: mpResponse.transaction_details?.external_resource_url || undefined,
        barcode: mpResponse.barcode?.content || undefined,
        due_date: mpResponse.date_of_expiration || undefined,
      }
    } else if (body.payment_method === 'credit_card') {
      paymentData = {
        method: 'credit_card',
      }
    }

    // ========================================
    // ETAPA 5: Salvar pedido no banco local
    // ========================================
    const mpPaymentStatus = mpResponse.status === 'approved'
      ? 'autorizado'
      : mpResponse.status === 'pending' || mpResponse.status === 'in_process'
        ? 'pendente'
        : mpResponse.status === 'rejected'
          ? 'recusado'
          : mpResponse.status

    // TODO: Salvar pedido no banco quando model MercadoPagoOrder for criado no Prisma
    // Por enquanto, retornar direto o resultado do MP
    console.log('MP Payment processed:', mpResponse.id, mpPaymentStatus)

    // ========================================
    // ETAPA 6: Retornar resultado normalizado
    // ========================================
    const response: NormalizedResponse = {
      success: true,
      order: {
        id: String(mpResponse.id),
        mp_payment_id: String(mpResponse.id),
        status: mpPaymentStatus,
        total: totalCents,
      },
      payment: paymentData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('MercadoPago checkout error:', error)

    if (error instanceof MercadoPagoError) {
      return NextResponse.json(
        {
          error: 'Payment processing failed',
          details: typeof error.details === 'object' ? error.details : error.message,
        },
        { status: error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Generaliza nome do produto removendo marcas protegidas.
 * Mantém especificações técnicas e detecta categoria.
 * Ex: "Xiaomi Redmi A5 64GB 4G" → "Smartphone 64GB 4G"
 * Ex: "Amazfit Bip 5" → "Smartwatch Bip 5"
 */
function generalizeProductName(name: string): string {
  const brandsToRemove = [
    'Xiaomi', 'Redmi', 'Mi', 'Poco', 'Black Shark',
    'Amazfit', 'Huami', 'Samsung', 'Apple', 'iPhone',
  ]

  // Detectar categoria
  const categories: Record<string, RegExp[]> = {
    'Carregador': [/\b(carregador|charger|adapter|fonte)\b/i, /\b\d+\s*w\b/i],
    'Fone de Ouvido': [/\b(fone|headphone|earphone|earbud|airdots|buds)\b/i, /\b(wireless|bluetooth)\b/i],
    'Smartwatch': [/\b(smartwatch|watch|relógio|band|fit|bip|gtr|gts|t-rex)\b/i],
    'Tablet': [/\b(tablet|pad)\b/i],
    'Notebook': [/\b(notebook|laptop)\b/i],
    'Aspirador': [/\b(aspirador|vacuum)\b/i],
    'Acessório': [/\b(capa|case|película|protetor)\b/i],
    'Smartphone': [/\b(celular|smartphone|telefone|phone)\b/i, /\b(4g|5g)\b/i, /\b(note|redmi|poco)\s*\w*\d+/i],
  }

  let category = 'Produto Eletrônico'
  const lowerName = name.toLowerCase()

  for (const [cat, patterns] of Object.entries(categories)) {
    if (patterns.some(p => p.test(lowerName))) {
      category = cat
      break
    }
  }

  // Remover marcas
  let generic = name
  brandsToRemove.forEach(brand => {
    generic = generic.replace(new RegExp(`\\b${brand}\\b`, 'gi'), '').trim()
  })
  generic = generic.replace(/\s+/g, ' ').trim()

  // Remover redundância com categoria
  const catWords = category.toLowerCase().split(/\s+/)
  catWords.forEach(word => {
    if (word.length > 2) {
      generic = generic.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim()
    }
  })
  generic = generic.replace(/\s+/g, ' ').trim()

  return generic.length > 0 ? `${category} ${generic}` : category
}

function validateRequest(body: CheckoutRequest): string | null {
  if (!body.customer?.first_name || !body.customer?.last_name) return 'Customer name is required'
  if (!body.customer?.email) return 'Email is required'
  if (!body.customer?.phone) return 'Phone is required'
  if (!body.customer?.document_number) return 'CPF/CNPJ is required'
  if (!body.address?.postcode) return 'Address postcode is required'
  if (!body.address?.street) return 'Address street is required'
  if (!body.address?.city) return 'Address city is required'
  if (!body.address?.state) return 'Address state is required'
  if (!body.products || body.products.length === 0) return 'At least one product is required'
  if (!['credit_card', 'pix', 'boleto'].includes(body.payment_method)) return 'Invalid payment method'
  if (body.payment_method === 'credit_card') {
    if (!body.card_token) return 'Card token is required'
    if (!body.payment_method_id) return 'Payment method ID is required'
  }
  return null
}
