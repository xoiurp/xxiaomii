import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getMerchantToken,
  createCustomer,
  createOrder,
  tokenizeCard,
  payCreditCard,
  payPix,
  payBoleto,
  toCents,
  AppMaxError,
} from '@/lib/appmax'

interface CheckoutRequest {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
    document_number: string
    ip: string
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
  credit_card?: {
    number: string
    cvv: string
    expiration_month: string
    expiration_year: string
    holder_name: string
    installments: number
  }
}

/**
 * POST /api/appmax/checkout
 *
 * Fluxo completo de checkout:
 * 1. Criar cliente na AppMax
 * 2. Criar pedido na AppMax
 * 3. Processar pagamento (cartao, PIX ou boleto)
 * 4. Salvar pedido no banco local
 * 5. Retornar resultado ao frontend
 */
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()

    // Validar campos obrigatorios
    const validationError = validateRequest(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Buscar credenciais do merchant
    const merchant = await prisma.appmaxMerchant.findFirst({
      where: { isActive: true },
      orderBy: { installedAt: 'desc' },
    })

    if (!merchant) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const token = await getMerchantToken(merchant.clientId, merchant.clientSecret)

    // ========================================
    // ETAPA 1: Criar cliente na AppMax
    // ========================================
    const customerResult = await createCustomer(token, {
      first_name: body.customer.first_name,
      last_name: body.customer.last_name,
      email: body.customer.email,
      phone: body.customer.phone.replace(/\D/g, ''),
      document_number: body.customer.document_number.replace(/\D/g, ''),
      ip: body.customer.ip,
      address: {
        postcode: body.address.postcode.replace(/\D/g, ''),
        street: body.address.street,
        number: body.address.number,
        complement: body.address.complement || '',
        district: body.address.district,
        city: body.address.city,
        state: body.address.state,
      },
      products: body.products,
    })

    const customerId = customerResult.data?.customer?.id
    if (!customerId) {
      console.error('Failed to get customer_id:', customerResult)
      return NextResponse.json(
        { error: 'Failed to create customer in payment gateway' },
        { status: 500 }
      )
    }

    console.log('AppMax customer created:', customerId)

    // ========================================
    // ETAPA 2: Criar pedido na AppMax
    // ========================================
    const productsValue = body.products.reduce(
      (sum, p) => sum + p.unit_value * p.quantity,
      0
    )

    const orderResult = await createOrder(token, {
      customer_id: customerId,
      products_value: productsValue,
      discount_value: body.discount_value,
      shipping_value: body.shipping_value,
      products: body.products,
    })

    const appmaxOrderId = orderResult.data?.order?.id
    if (!appmaxOrderId) {
      console.error('Failed to get order_id:', orderResult)
      return NextResponse.json(
        { error: 'Failed to create order in payment gateway' },
        { status: 500 }
      )
    }

    console.log('AppMax order created:', appmaxOrderId)

    // ========================================
    // ETAPA 3: Processar pagamento
    // ========================================
    let paymentResult: any
    let paymentData: any = {}

    if (body.payment_method === 'credit_card') {
      if (!body.credit_card) {
        return NextResponse.json(
          { error: 'Credit card data is required' },
          { status: 400 }
        )
      }

      // Tokenizar cartao
      const tokenResult = await tokenizeCard(token, {
        number: body.credit_card.number.replace(/\s/g, ''),
        cvv: body.credit_card.cvv,
        expiration_month: body.credit_card.expiration_month,
        expiration_year: body.credit_card.expiration_year,
        holder_name: body.credit_card.holder_name,
      })

      const cardToken = tokenResult.data?.token
      if (!cardToken) {
        console.error('Card tokenization failed:', tokenResult)
        return NextResponse.json(
          { error: 'Failed to process credit card. Please check card details.' },
          { status: 422 }
        )
      }

      // Processar pagamento com token
      paymentResult = await payCreditCard(token, {
        order_id: appmaxOrderId,
        customer_id: customerId,
        payment_data: {
          credit_card: {
            token: cardToken,
            installments: body.credit_card.installments,
            holder_document_number: body.customer.document_number.replace(/\D/g, ''),
            soft_descriptor: 'MIBRASIL',
          },
        },
      })

      paymentData = {
        method: 'credit_card',
        installments: body.credit_card.installments,
      }
    } else if (body.payment_method === 'pix') {
      paymentResult = await payPix(
        token,
        appmaxOrderId,
        body.customer.document_number.replace(/\D/g, '')
      )

      paymentData = {
        method: 'pix',
        qr_code: paymentResult.data?.qr_code || paymentResult.data?.pix?.qr_code,
        emv_code: paymentResult.data?.emv || paymentResult.data?.pix?.emv,
        expires_at: paymentResult.data?.expires_at || paymentResult.data?.pix?.expires_at,
      }
    } else if (body.payment_method === 'boleto') {
      paymentResult = await payBoleto(
        token,
        appmaxOrderId,
        body.customer.document_number.replace(/\D/g, '')
      )

      paymentData = {
        method: 'boleto',
        url: paymentResult.data?.url || paymentResult.data?.boleto?.url,
        barcode: paymentResult.data?.barcode || paymentResult.data?.boleto?.barcode,
        due_date: paymentResult.data?.due_date || paymentResult.data?.boleto?.due_date,
      }
    }

    console.log('AppMax payment processed:', body.payment_method, 'for order:', appmaxOrderId)

    // ========================================
    // ETAPA 4: Salvar pedido no banco local
    // ========================================
    const totalPaid = productsValue + body.shipping_value - body.discount_value

    const localOrder = await prisma.appmaxOrder.create({
      data: {
        merchantId: merchant.id,
        appmaxOrderId: appmaxOrderId,
        appmaxCustomerId: customerId,
        status: body.payment_method === 'credit_card' ? 'autorizado' : 'pendente',
        paymentMethod: body.payment_method,
        installments: body.credit_card?.installments || 1,
        productsValue: productsValue,
        shippingValue: body.shipping_value,
        discountValue: body.discount_value,
        totalPaid: totalPaid,
        customerName: `${body.customer.first_name} ${body.customer.last_name}`,
        customerEmail: body.customer.email,
        customerDocument: body.customer.document_number,
        customerPhone: body.customer.phone,
        shippingAddress: body.address,
        lineItems: body.products,
        pixQrCode: paymentData.qr_code || null,
        pixEmvCode: paymentData.emv_code || null,
        boletoUrl: paymentData.url || null,
        boletoBarcode: paymentData.barcode || null,
        upsellHash: paymentResult?.data?.upsell_hash || null,
        paidAt: body.payment_method === 'credit_card' ? new Date() : null,
      },
    })

    // ========================================
    // ETAPA 5: Retornar resultado
    // ========================================
    return NextResponse.json({
      success: true,
      order: {
        id: localOrder.id,
        appmax_order_id: appmaxOrderId,
        status: localOrder.status,
        total: totalPaid,
      },
      payment: paymentData,
    })
  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof AppMaxError) {
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

function validateRequest(body: CheckoutRequest): string | null {
  if (!body.customer?.first_name || !body.customer?.last_name) return 'Customer name is required'
  if (!body.customer?.email) return 'Email is required'
  if (!body.customer?.phone) return 'Phone is required'
  if (!body.customer?.document_number) return 'CPF/CNPJ is required'
  if (!body.customer?.ip) return 'Client IP is required'
  if (!body.address?.postcode) return 'Address postcode is required'
  if (!body.address?.street) return 'Address street is required'
  if (!body.address?.city) return 'Address city is required'
  if (!body.address?.state) return 'Address state is required'
  if (!body.products || body.products.length === 0) return 'At least one product is required'
  if (!['credit_card', 'pix', 'boleto'].includes(body.payment_method)) return 'Invalid payment method'
  if (body.payment_method === 'credit_card' && !body.credit_card) return 'Credit card data is required'
  return null
}
