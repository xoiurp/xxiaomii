/**
 * Mercado Pago API Client
 * Integra pagamentos via REST API (sem SDK npm).
 * Suporta cartao de credito (tokenizado), PIX e boleto.
 */

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com'

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    throw new MercadoPagoError('MERCADOPAGO_ACCESS_TOKEN not configured', 500)
  }
  return token
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class MercadoPagoError extends Error {
  status: number
  cause_detail: unknown

  constructor(message: string, status: number, cause_detail?: unknown) {
    super(message)
    this.name = 'MercadoPagoError'
    this.status = status
    this.cause_detail = cause_detail
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MercadoPagoPayerAddress {
  zip_code: string
  street_name: string
  street_number: number
  neighborhood?: string
  city?: string
  federal_unit?: string
}

export interface MercadoPagoPayer {
  email: string
  first_name?: string
  last_name?: string
  identification?: {
    type: 'CPF' | 'CNPJ'
    number: string
  }
  address?: MercadoPagoPayerAddress
}

export interface MercadoPagoPaymentItem {
  id?: string
  title: string
  description?: string
  quantity: number
  unit_price: number // decimal (e.g. 123.45)
  category_id?: string
  picture_url?: string
}

export interface CreatePaymentRequest {
  /** Valor total em decimal (ex: 123.45) */
  transaction_amount: number
  description: string
  payment_method_id: string
  payer: MercadoPagoPayer
  /** Token do cartao gerado pelo SDK client-side (somente credit_card) */
  token?: string
  /** Parcelas (somente credit_card, default 1) */
  installments?: number
  /** Issuer ID (somente credit_card) */
  issuer_id?: number
  /** Items do pedido */
  additional_info?: {
    items?: MercadoPagoPaymentItem[]
    payer?: {
      first_name?: string
      last_name?: string
      phone?: { area_code?: string; number?: string }
      address?: MercadoPagoPayerAddress
    }
  }
  /** Referencia externa (ex: order ID interno) */
  external_reference?: string
  /** URL de notificacao (webhook) */
  notification_url?: string
  /** Metadados livres */
  metadata?: Record<string, unknown>
  /** Statement descriptor (aparece na fatura do cartao) */
  statement_descriptor?: string
}

export interface MercadoPagoPixData {
  qr_code: string
  qr_code_base64: string
  ticket_url: string
}

export interface MercadoPagoPaymentResponse {
  id: number
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
  date_created: string
  date_approved: string | null
  date_last_updated: string
  date_of_expiration?: string
  money_release_date: string | null
  issuer_id?: number
  payment_method_id: string
  payment_type_id: 'credit_card' | 'debit_card' | 'bank_transfer' | 'ticket' | 'account_money'
  transaction_amount: number
  shipping_amount: number
  coupon_amount: number
  taxes_amount?: number
  currency_id: string
  description: string
  external_reference: string | null
  statement_descriptor?: string
  notification_url?: string
  processing_mode?: string
  collector_id?: number
  payer: MercadoPagoPayer & { id?: string | number }
  metadata: Record<string, unknown>
  installments: number
  transaction_details?: {
    net_received_amount?: number
    total_paid_amount?: number
    overpaid_amount?: number
    installment_amount?: number
    financial_institution?: string
    payment_method_reference_id?: string
    external_resource_url?: string
  }
  point_of_interaction?: {
    type?: string
    application_data?: { name?: string; version?: string }
    transaction_data?: MercadoPagoPixData
  }
  barcode?: {
    content?: string
  }
  fee_details?: Array<{ type: string; amount: number; fee_payer: string }>
  card?: {
    id?: string | null
    first_six_digits?: string | null
    last_four_digits?: string | number | null
    expiration_month?: number | null
    expiration_year?: number | null
    date_created?: string | null
    date_last_updated?: string | null
    cardholder?: { name: string | null; identification?: { number: string; type: string } }
  }
  transaction_amount_refunded?: number
  additional_info?: Record<string, any>
}

export interface MercadoPagoInstallment {
  payment_method_id: string
  payment_type_id: string
  issuer: { id: string; name: string }
  payer_costs: Array<{
    installments: number
    installment_rate: number
    discount_rate: number
    min_allowed_amount: number
    max_allowed_amount: number
    recommended_message: string
    installment_amount: number
    total_amount: number
  }>
}

export interface MercadoPagoRefundResponse {
  id: number
  payment_id: number
  amount: number
  status: string
  date_created: string
  source: { id: string; name: string; type: string }
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function mpFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()
  const url = `${MERCADOPAGO_API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Idempotency-Key': options.method === 'POST' ? crypto.randomUUID() : '',
      ...options.headers,
    },
  })

  const body = await response.text()
  let data: any
  try {
    data = JSON.parse(body)
  } catch {
    data = body
  }

  if (!response.ok) {
    const msg = data?.message || data?.error || `Mercado Pago request failed (${response.status})`
    throw new MercadoPagoError(msg, response.status, data)
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converte valor em centavos para decimal.
 * Ex: toDecimal(12345) => 123.45
 */
export function toDecimal(cents: number): number {
  return Math.round(cents) / 100
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Cria um pagamento no Mercado Pago.
 *
 * - Cartao de credito: payment_method_id = tipo do cartao (ex: "visa"),
 *   requer `token` gerado pelo SDK client-side e `installments`.
 * - PIX: payment_method_id = "pix".
 *   Retorna point_of_interaction.transaction_data com qr_code e qr_code_base64.
 * - Boleto: payment_method_id = "bolbradesco".
 *   Retorna transaction_details.external_resource_url com link do boleto.
 */
export async function createPayment(
  payment: CreatePaymentRequest
): Promise<MercadoPagoPaymentResponse> {
  return mpFetch<MercadoPagoPaymentResponse>('/v1/payments', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
}

/**
 * Consulta um pagamento pelo ID.
 */
export async function getPayment(
  paymentId: number | string
): Promise<MercadoPagoPaymentResponse> {
  return mpFetch<MercadoPagoPaymentResponse>(`/v1/payments/${paymentId}`)
}

/**
 * Consulta parcelas disponiveis para um valor e metodo de pagamento.
 */
export async function getInstallments(params: {
  amount: number
  payment_method_id?: string
  issuer_id?: string
}): Promise<MercadoPagoInstallment[]> {
  const query = new URLSearchParams()
  query.set('amount', String(params.amount))
  if (params.payment_method_id) query.set('payment_method_id', params.payment_method_id)
  if (params.issuer_id) query.set('issuer.id', params.issuer_id)

  return mpFetch<MercadoPagoInstallment[]>(`/v1/payment_methods/installments?${query.toString()}`)
}

/**
 * Cancela um pagamento pendente.
 * Somente pagamentos com status "pending" podem ser cancelados.
 */
export async function cancelPayment(
  paymentId: number | string
): Promise<MercadoPagoPaymentResponse> {
  return mpFetch<MercadoPagoPaymentResponse>(`/v1/payments/${paymentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  })
}

/**
 * Reembolsa um pagamento (total ou parcial).
 * Se `amount` nao for informado, reembolsa o valor total.
 */
export async function refundPayment(
  paymentId: number | string,
  amount?: number
): Promise<MercadoPagoRefundResponse> {
  return mpFetch<MercadoPagoRefundResponse>(`/v1/payments/${paymentId}/refunds`, {
    method: 'POST',
    body: JSON.stringify(amount != null ? { amount } : {}),
  })
}

// ---------------------------------------------------------------------------
// Customer & Card management
// ---------------------------------------------------------------------------

/**
 * Cria um customer no Mercado Pago para salvar cartoes.
 */
export async function createCustomer(email: string, firstName: string, lastName: string): Promise<any> {
  return mpFetch('/v1/customers', {
    method: 'POST',
    body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
  })
}

/**
 * Busca um customer pelo email.
 */
export async function getCustomerByEmail(email: string): Promise<any> {
  return mpFetch(`/v1/customers/search?email=${encodeURIComponent(email)}`)
}

/**
 * Salva um cartao tokenizado no customer.
 */
export async function saveCardToCustomer(customerId: string, cardToken: string): Promise<any> {
  return mpFetch(`/v1/customers/${customerId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ token: cardToken }),
  })
}

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------

/**
 * Lista os metodos de pagamento disponiveis.
 */
export async function getPaymentMethods(): Promise<any> {
  return mpFetch('/v1/payment_methods')
}
