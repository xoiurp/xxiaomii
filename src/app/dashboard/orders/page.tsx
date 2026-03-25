'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingBag,
  Copy,
  AlertCircle,
} from 'lucide-react';

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image: string | null;
  sku: string | null;
  productId: string | null;
  variantTitle: string | null;
}

interface Order {
  id: string;
  source: 'shopify' | 'appmax';
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  currency: string;
  items: OrderItem[];
  shippingMethod: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Package; color: string; bg: string }> = {
  Pendente: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  Autorizado: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  Processando: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  Enviado: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  Entregue: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  Cancelado: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  Reembolsado: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  'Parcialmente Reembolsado': { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
};

const DEFAULT_STATUS = { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function OrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (authStatus === 'authenticated') {
      fetchOrders();
    }
  }, [authStatus]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Erro ao carregar pedidos');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setError('Não foi possível carregar seus pedidos.');
    } finally {
      setLoading(false);
    }
  }

  function copyTrackingCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6700] mx-auto" />
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'CLIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
          <Link href="/auth/signin">
            <Button className="bg-[#FF6700] hover:bg-[#E05A00]">Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 sm:py-6">
            <Link
              href="/dashboard"
              className="mr-4 p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-sm text-gray-600">
                {orders.length === 0
                  ? 'Nenhum pedido encontrado'
                  : `${orders.length} pedido${orders.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          /* Estado vazio */
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Você ainda não fez nenhum pedido
            </h2>
            <p className="text-gray-600 mb-6">
              Explore nossos produtos e faça seu primeiro pedido!
            </p>
            <Link href="/shop">
              <Button className="bg-[#FF6700] hover:bg-[#E05A00]">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#FF6700] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Todos ({orders.length})
              </button>
              {Object.entries(statusCounts).map(([status, count]) => {
                const config = STATUS_CONFIG[status] || DEFAULT_STATUS;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-[#FF6700] text-white'
                        : `bg-white border border-gray-200 ${config.color} hover:border-gray-300`
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const config = STATUS_CONFIG[order.status] || DEFAULT_STATUS;
                const StatusIcon = config.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Cabeçalho do pedido */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full text-left"
                    >
                      <div className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bg} border`}
                          >
                            <StatusIcon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm sm:text-base">
                                {order.orderNumber}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} border ${config.color}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              {formatDate(order.createdAt)}
                              {order.items.length > 0 && (
                                <span className="hidden sm:inline">
                                  {' '}
                                  &middot; {order.items.length}{' '}
                                  {order.items.length === 1 ? 'item' : 'itens'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm sm:text-base whitespace-nowrap">
                            {formatCurrency(order.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <CardContent className="border-t pt-4 px-4 sm:px-6 pb-5">
                        {/* Itens */}
                        <div className="mb-5">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Itens do Pedido
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 sm:gap-4"
                              >
                                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-full h-full object-contain p-1"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                      <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                    {item.title}
                                  </p>
                                  {item.variantTitle && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.variantTitle}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-0.5">Qtd: {item.quantity}</p>
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Resumo de valores */}
                        <div className="border-t pt-4 mb-5">
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span>
                              <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Desconto</span>
                                <span>-{formatCurrency(order.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                              <span>Frete</span>
                              <span>
                                {order.shipping === 0
                                  ? 'Grátis'
                                  : formatCurrency(order.shipping)}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t">
                              <span>Total</span>
                              <span>{formatCurrency(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Info adicional */}
                        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Data do pedido:</span>
                            <p className="font-medium">{formatDateTime(order.createdAt)}</p>
                          </div>
                          {order.paymentMethod && (
                            <div>
                              <span className="text-gray-500">Forma de pagamento:</span>
                              <p className="font-medium">{order.paymentMethod}</p>
                            </div>
                          )}
                          {order.shippingMethod && (
                            <div>
                              <span className="text-gray-500">Método de envio:</span>
                              <p className="font-medium">{order.shippingMethod}</p>
                            </div>
                          )}
                        </div>

                        {/* Rastreamento */}
                        {order.trackingCode && (
                          <div className="border-t mt-4 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Truck className="h-4 w-4 text-[#FF6700]" />
                              Rastreamento
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="bg-gray-100 px-3 py-1.5 rounded text-sm font-mono">
                                {order.trackingCode}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyTrackingCode(order.trackingCode!);
                                }}
                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                title="Copiar código"
                              >
                                {copiedCode === order.trackingCode ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#FF6700] hover:underline text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Rastrear
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">
                  Nenhum pedido com status &quot;{filter}&quot;.
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-[#FF6700] hover:underline text-sm"
                >
                  Ver todos os pedidos
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
