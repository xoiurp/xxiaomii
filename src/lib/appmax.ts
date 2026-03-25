/**
 * AppMax API Client
 * Gerencia autenticacao, clientes, pedidos e pagamentos via AppMax.
 */

const APPMAX_API_URL = process.env.APPMAX_API_URL || 'https://api.appmax.com.br'
const APPMAX_AUTH_URL = process.env.APPMAX_AUTH_URL || 'https://auth.appmax.com.br'

// Cache do token em memoria (validade 1h)
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Obtem token Bearer do merchant para transacionar na API.
 * Usa cache em memoria para evitar requests desnecessarios.
 */
export async function getMerchantToken(clientId: string, clientSecret: string): Promise<string> {
  // Retorna cache se ainda valido (com 5min de margem)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.token
  }

  const response = await fetch(`${APPMAX_AUTH_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AppMax auth failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return cachedToken.token
}

/**
 * Helper para fazer requests autenticados na API AppMax.
 */
async function appmaxFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${APPMAX_API_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    console.error(`AppMax API error [${response.status}] ${path}:`, data)
    throw new AppMaxError(
      response.status,
      data?.errors?.message || data?.error?.message || `Request failed: ${path}`,
      data
    )
  }

  return data
}

export class AppMaxError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppMaxError'
  }
}

// ==========================================
// Clientes
// ==========================================

export interface CreateCustomerParams {
  first_name: string
  last_name: string
  email: string
  phone: string
  ip: string
  document_number?: string
  address?: {
    postcode: string
    street: string
    number: string
    complement?: string
    district: string
    city: string
    state: string
  }
  products?: Array<{
    sku: string
    name: string
    quantity: number
    unit_value: number  // centavos
    type?: 'physical' | 'digital'
  }>
  tracking?: {
    utm_source?: string
    utm_campaign?: string
    utm_medium?: string
    utm_content?: string
    utm_term?: string
  }
}

export async function createCustomer(token: string, params: CreateCustomerParams) {
  return appmaxFetch('/v1/customers', token, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ==========================================
// Pedidos
// ==========================================

export interface CreateOrderParams {
  customer_id: number
  products_value?: number   // centavos
  discount_value?: number   // centavos
  shipping_value?: number   // centavos
  products: Array<{
    sku: string
    name: string
    quantity: number
    unit_value?: number     // centavos
    type?: 'physical' | 'digital'
  }>
}

export async function createOrder(token: string, params: CreateOrderParams) {
  return appmaxFetch('/v1/orders', token, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getOrder(token: string, orderId: number) {
  return appmaxFetch(`/v1/orders/${orderId}`, token, {
    method: 'GET',
  })
}

// ==========================================
// Pagamentos
// ==========================================

// Calculo de parcelas (usa taxas configuradas na AppMax do merchant)
export async function getInstallments(token: string, totalValue: number, installments: number = 12) {
  return appmaxFetch('/v1/payments/installments', token, {
    method: 'POST',
    body: JSON.stringify({
      installments,
      total_value: totalValue,  // centavos
      settings: true,
    }),
  })
}

// Tokenizacao de cartao via API
export async function tokenizeCard(token: string, cardData: {
  number: string
  cvv: string
  expiration_month: string
  expiration_year: string
  holder_name: string
}) {
  return appmaxFetch('/v1/payments/tokenize', token, {
    method: 'POST',
    body: JSON.stringify({
      payment_data: {
        credit_card: cardData,
      },
    }),
  })
}

// Pagamento com cartao de credito (usando token do cartao)
export interface CreditCardPaymentParams {
  order_id: number
  customer_id: number
  payment_data: {
    credit_card: {
      token: string
      installments: number
      holder_document_number: string
      soft_descriptor?: string
    }
  }
}

export async function payCreditCard(token: string, params: CreditCardPaymentParams) {
  return appmaxFetch('/v1/payments/credit-card', token, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// Pagamento via PIX
export async function payPix(token: string, orderId: number, documentNumber: string) {
  return appmaxFetch('/v1/payments/pix', token, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      payment_data: {
        pix: {
          document_number: documentNumber,
        },
      },
    }),
  })
}

// Pagamento via Boleto
export async function payBoleto(token: string, orderId: number, documentNumber: string) {
  return appmaxFetch('/v1/payments/boleto', token, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      payment_data: {
        boleto: {
          document_number: documentNumber,
        },
      },
    }),
  })
}

// ==========================================
// Estornos
// ==========================================

export async function createRefund(token: string, orderId: number, amount?: number) {
  const body: any = { order_id: orderId }
  if (amount) body.amount = amount // centavos, para estorno parcial
  return appmaxFetch('/v1/orders/refund', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ==========================================
// Rastreio
// ==========================================

export async function setTrackingCode(token: string, orderId: number, trackingCode: string) {
  return appmaxFetch('/v1/orders/shipping-tracking-code', token, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      shipping_tracking_code: trackingCode,
    }),
  })
}

// ==========================================
// Helpers
// ==========================================

/**
 * Converte valor em reais (float) para centavos (int).
 * Ex: 123.45 → 12345
 */
export function toCents(value: number): number {
  return Math.round(value * 100)
}

/**
 * Converte centavos (int) para reais (float).
 * Ex: 12345 → 123.45
 */
export function fromCents(cents: number): number {
  return cents / 100
}
