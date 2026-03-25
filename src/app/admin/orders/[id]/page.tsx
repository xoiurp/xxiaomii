'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Package, CreditCard, Truck, MapPin, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface OrderLineItem {
  id: string;
  title: string;
  quantity: number;
  variant?: {
    id: string;
    title: string;
    price: string;
    sku?: string;
    image?: {
      url: string;
      altText?: string;
    };
  };
  originalUnitPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  discountedUnitPriceSet?: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  taxLines: Array<{
    title: string;
    rate: number;
    priceSet: {
      shopMoney: {
        amount: string;
        currencyCode: string;
      };
    };
  }>;
}

interface OrderCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  defaultAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  };
}

interface MailingAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

interface OrderTransaction {
  id: string;
  kind: string;
  status: string;
  amount: string;
  gateway: string;
  createdAt: string;
  processedAt?: string;
}

interface OrderFulfillment {
  id: string;
  status: string;
  trackingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: Array<{
    id: string;
    quantity: number;
    lineItem: {
      id: string;
      title: string;
    };
  }>;
}

interface OrderDetails {
  id: string;
  name: string;
  orderNumber: number;
  createdAt: string;
  updatedAt: string;
  processedAt: string;
  closedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  confirmed: boolean;
  test: boolean;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  email?: string;
  phone?: string;
  note?: string;
  tags: string[];
  customer?: OrderCustomer;
  shippingAddress?: MailingAddress;
  billingAddress?: MailingAddress;
  currentTotalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  currentSubtotalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  currentTotalTaxSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  currentTotalDiscountsSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  currentShippingPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  lineItems: {
    edges: Array<{
      node: OrderLineItem;
    }>;
  };
  transactions: OrderTransaction[];
  fulfillments: OrderFulfillment[];
  shippingLines: Array<{
    id: string;
    title: string;
    priceSet: {
      shopMoney: {
        amount: string;
        currencyCode: string;
      };
    };
  }>;
  discountApplications: {
    edges: Array<{
      node: {
        targetSelection: string;
        targetType: string;
        value: {
          amount?: string;
          percentage?: number;
        };
        title?: string;
      };
    }>;
  };
  taxLines: Array<{
    title: string;
    rate: number;
    priceSet: {
      shopMoney: {
        amount: string;
        currencyCode: string;
      };
    };
  }>;
}

// Função para formatar valores monetários
const formatCurrency = (amount: string, currencyCode: string = 'BRL') => {
  const value = parseFloat(amount);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode === 'USD' ? 'USD' : 'BRL',
  }).format(value);
};

// Função para formatar data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Função para traduzir status financeiro
const getFinancialStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    'PAID': { label: 'Pago', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
    'PENDING': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
    'AUTHORIZED': { label: 'Autorizado', color: 'bg-blue-100 text-blue-800', icon: <CreditCard className="w-4 h-4" /> },
    'PARTIALLY_PAID': { label: 'Pago Parcialmente', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-4 h-4" /> },
    'PARTIALLY_REFUNDED': { label: 'Reembolsado Parcialmente', color: 'bg-purple-100 text-purple-800', icon: <AlertCircle className="w-4 h-4" /> },
    'REFUNDED': { label: 'Reembolsado', color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> },
    'VOIDED': { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: <X className="w-4 h-4" /> },
    'EXPIRED': { label: 'Expirado', color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> },
  };

  const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-4 h-4" /> };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.icon}
      {statusInfo.label}
    </span>
  );
};

// Função para traduzir status de entrega
const getFulfillmentStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    'FULFILLED': { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
    'SHIPPED': { label: 'Enviado', color: 'bg-blue-100 text-blue-800', icon: <Truck className="w-4 h-4" /> },
    'UNSHIPPED': { label: 'Não Enviado', color: 'bg-gray-100 text-gray-800', icon: <Package className="w-4 h-4" /> },
    'UNFULFILLED': { label: 'Não Atendido', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
    'PARTIAL': { label: 'Parcial', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-4 h-4" /> },
    'SCHEDULED': { label: 'Agendado', color: 'bg-purple-100 text-purple-800', icon: <Calendar className="w-4 h-4" /> },
    'ON_HOLD': { label: 'Em Espera', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
    'REQUEST_DECLINED': { label: 'Solicitação Negada', color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> },
  };

  const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-4 h-4" /> };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.icon}
      {statusInfo.label}
    </span>
  );
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setOrder(data.order);
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro ao carregar pedido</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Pedido não encontrado</span>
            </div>
            <p className="text-yellow-700 mt-2">O pedido solicitado não foi encontrado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Pedido {order.name}</h1>
            <p className="text-gray-600">
              {formatDate(order.createdAt)} • {order.test ? 'Teste' : 'Produção'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {getFinancialStatusBadge(order.displayFinancialStatus)}
            {getFulfillmentStatusBadge(order.displayFulfillmentStatus)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Itens do Pedido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Itens do Pedido
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.lineItems.edges.map(({ node: item }) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.variant?.image?.url ? (
                          <img
                            src={item.variant.image.url}
                            alt={item.variant.image.altText || item.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.title}
                            {item.variant.sku && ` • SKU: ${item.variant.sku}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.originalUnitPriceSet.shopMoney.amount, item.originalUnitPriceSet.shopMoney.currencyCode)}
                        </p>
                        {item.discountedUnitPriceSet && item.discountedUnitPriceSet.shopMoney.amount !== item.originalUnitPriceSet.shopMoney.amount && (
                          <p className="text-sm text-green-600">
                            Desconto: {formatCurrency(item.discountedUnitPriceSet.shopMoney.amount, item.discountedUnitPriceSet.shopMoney.currencyCode)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Informações de Entrega */}
            {order.fulfillments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Informações de Entrega
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.fulfillments.map((fulfillment) => (
                      <div key={fulfillment.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Entrega #{fulfillment.id.split('/').pop()}</span>
                          <span className="text-sm text-gray-600">{formatDate(fulfillment.createdAt)}</span>
                        </div>
                        {fulfillment.trackingNumber && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-600">
                              Código de rastreamento: 
                              {fulfillment.trackingUrl ? (
                                <a href={fulfillment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                  {fulfillment.trackingNumber}
                                </a>
                              ) : (
                                <span className="ml-1">{fulfillment.trackingNumber}</span>
                              )}
                            </p>
                            {fulfillment.trackingCompany && (
                              <p className="text-sm text-gray-600">Transportadora: {fulfillment.trackingCompany}</p>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          <p>Itens: {fulfillment.lineItems.length}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transações */}
            {order.transactions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Transações
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{transaction.kind}</span>
                          <span className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Status: {transaction.status}</p>
                          <p>Gateway: {transaction.gateway}</p>
                          <p>Valor: {formatCurrency(transaction.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo do Pedido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumo do Pedido
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(order.currentSubtotalPriceSet.shopMoney.amount, order.currentSubtotalPriceSet.shopMoney.currencyCode)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete:</span>
                    <span>{formatCurrency(order.currentShippingPriceSet.shopMoney.amount, order.currentShippingPriceSet.shopMoney.currencyCode)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impostos:</span>
                    <span>{formatCurrency(order.currentTotalTaxSet.shopMoney.amount, order.currentTotalTaxSet.shopMoney.currencyCode)}</span>
                  </div>
                  {parseFloat(order.currentTotalDiscountsSet.shopMoney.amount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(order.currentTotalDiscountsSet.shopMoney.amount, order.currentTotalDiscountsSet.shopMoney.currencyCode)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(order.currentTotalPriceSet.shopMoney.amount, order.currentTotalPriceSet.shopMoney.currencyCode)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliente
                </h2>
              </div>
              <div className="p-6">
                {order.customer ? (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    {order.customer.email && (
                      <p className="text-sm text-gray-600">{order.customer.email}</p>
                    )}
                    {order.customer.phone && (
                      <p className="text-sm text-gray-600">{order.customer.phone}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {order.email && (
                      <p className="text-sm text-gray-600">{order.email}</p>
                    )}
                    {order.phone && (
                      <p className="text-sm text-gray-600">{order.phone}</p>
                    )}
                    {!order.email && !order.phone && (
                      <p className="text-sm text-gray-500">Cliente convidado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Endereços */}
            {(order.shippingAddress || order.billingAddress) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereços
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.shippingAddress && (
                      <div>
                        <h3 className="font-medium mb-2">Endereço de Entrega</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p>{order.shippingAddress.address1}</p>
                          {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                          <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
                          <p>{order.shippingAddress.country}</p>
                          {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                        </div>
                      </div>
                    )}
                    {order.billingAddress && (
                      <div>
                        <h3 className="font-medium mb-2">Endereço de Cobrança</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                          <p>{order.billingAddress.address1}</p>
                          {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                          <p>{order.billingAddress.city}, {order.billingAddress.province} {order.billingAddress.zip}</p>
                          <p>{order.billingAddress.country}</p>
                          {order.billingAddress.phone && <p>{order.billingAddress.phone}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Informações Adicionais
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número do Pedido:</span>
                    <span>#{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criado em:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processado em:</span>
                    <span>{formatDate(order.processedAt)}</span>
                  </div>
                  {order.updatedAt !== order.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Atualizado em:</span>
                      <span>{formatDate(order.updatedAt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmado:</span>
                    <span>{order.confirmed ? 'Sim' : 'Não'}</span>
                  </div>
                  {order.note && (
                    <div>
                      <span className="text-gray-600 block mb-1">Observações:</span>
                      <p className="text-gray-800">{order.note}</p>
                    </div>
                  )}
                  {order.tags.length > 0 && (
                    <div>
                      <span className="text-gray-600 block mb-1">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {order.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 