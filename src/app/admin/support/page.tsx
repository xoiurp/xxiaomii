'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Mail,
  Phone,
  Hash,
  Save,
} from 'lucide-react';

interface Ticket {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  orderNumber: string | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Aberto', color: 'text-blue-700', bg: 'bg-blue-100' },
  IN_PROGRESS: { label: 'Em andamento', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  WAITING_CUSTOMER: { label: 'Aguardando cliente', color: 'text-orange-700', bg: 'bg-orange-100' },
  RESOLVED: { label: 'Resolvido', color: 'text-green-700', bg: 'bg-green-100' },
  CLOSED: { label: 'Fechado', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'text-gray-500' },
  MEDIUM: { label: 'Média', color: 'text-blue-600' },
  HIGH: { label: 'Alta', color: 'text-orange-600' },
  URGENT: { label: 'Urgente', color: 'text-red-600' },
};

const CATEGORY_LABELS: Record<string, string> = {
  ORDER: 'Pedido',
  PRODUCT: 'Produto',
  SHIPPING: 'Envio e Entrega',
  PAYMENT: 'Pagamento',
  RETURN: 'Troca ou Devolução',
  ACCOUNT: 'Minha Conta',
  OTHER: 'Outro',
};

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function AdminSupportPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Ticket expandido
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/signin');
    }
    if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchTickets();
    }
  }, [authStatus, filterStatus, filterCategory]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('category', filterCategory);

      const res = await fetch(`/api/admin/support?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      setStatusCounts(data.statusCounts || {});
      setTotal(data.total || 0);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  function expandTicket(ticket: Ticket) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(ticket.id);
    setEditNotes(ticket.adminNotes || '');
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
  }

  async function handleSave(ticketId: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          adminNotes: editNotes,
        }),
      });
      await fetchTickets();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6700]" />
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  const openCount = (statusCounts['OPEN'] || 0) + (statusCounts['IN_PROGRESS'] || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="mr-4 p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Tickets de Suporte
                  {openCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {openCount}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-600">{total} tickets no total</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTickets}
              disabled={loading}
            >
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                filterStatus === key
                  ? 'border-[#FF6700] bg-[#FF6700]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold">{statusCounts[key] || 0}</p>
              <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
            </button>
          ))}
        </div>

        {/* Filtro de categoria */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">Categoria:</span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-[#FF6700] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Todas
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterCategory === key
                  ? 'bg-[#FF6700] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de tickets */}
        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Nenhum ticket encontrado</h2>
            <p className="text-sm text-gray-600">
              {filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Tente alterar os filtros.'
                : 'Os tickets dos clientes aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              const priorityInfo = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
              const isExpanded = expandedId === ticket.id;

              return (
                <Card key={ticket.id} className="overflow-hidden">
                  {/* Linha resumo */}
                  <button
                    onClick={() => expandTicket(ticket)}
                    className="w-full text-left px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm truncate">
                            {ticket.subject}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className={`text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{ticket.name}</span>
                          <span>&middot;</span>
                          <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                          <span>&middot;</span>
                          <span>{formatDateTime(ticket.createdAt)}</span>
                          {ticket.orderNumber && (
                            <>
                              <span>&middot;</span>
                              <span className="font-mono">{ticket.orderNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <CardContent className="border-t px-4 sm:px-6 pt-4 pb-5">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna esquerda: dados do cliente e mensagem */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Info do cliente */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <User className="h-4 w-4" />
                              {ticket.name}
                              {ticket.user && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  Cadastrado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <a
                                href={`mailto:${ticket.email}`}
                                className="text-[#FF6700] hover:underline"
                              >
                                {ticket.email}
                              </a>
                            </div>
                            {ticket.phone && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Phone className="h-4 w-4" />
                                {ticket.phone}
                              </div>
                            )}
                            {ticket.orderNumber && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Hash className="h-4 w-4" />
                                Pedido {ticket.orderNumber}
                              </div>
                            )}
                          </div>

                          {/* Mensagem */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Mensagem do cliente</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                              {ticket.message}
                            </div>
                          </div>
                        </div>

                        {/* Coluna direita: ações do admin */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>
                                  {config.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Prioridade
                            </label>
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                            >
                              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>
                                  {config.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notas internas
                            </label>
                            <textarea
                              rows={4}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6700] resize-y"
                              placeholder="Notas visíveis apenas para admins..."
                            />
                          </div>

                          <Button
                            onClick={() => handleSave(ticket.id)}
                            disabled={saving}
                            className="w-full bg-[#FF6700] hover:bg-[#E05A00]"
                            size="sm"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                          </Button>

                          {ticket.resolvedAt && (
                            <p className="text-xs text-gray-500 text-center">
                              Resolvido em {formatDateTime(ticket.resolvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
