'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Send,
  CheckCircle,
  Loader2,
  MessageSquare,
  Clock,
  ArrowLeft,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'ORDER', label: 'Pedido' },
  { value: 'PRODUCT', label: 'Produto' },
  { value: 'SHIPPING', label: 'Envio e Entrega' },
  { value: 'PAYMENT', label: 'Pagamento' },
  { value: 'RETURN', label: 'Troca ou Devolução' },
  { value: 'ACCOUNT', label: 'Minha Conta' },
  { value: 'OTHER', label: 'Outro assunto' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-yellow-100 text-yellow-700' },
  WAITING_CUSTOMER: { label: 'Aguardando resposta', color: 'bg-orange-100 text-orange-700' },
  RESOLVED: { label: 'Resolvido', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Fechado', color: 'bg-gray-100 text-gray-600' },
};

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function SupportPage() {
  const { data: session } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Pré-preencher com dados do usuário logado
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  // Carregar tickets do usuário logado
  useEffect(() => {
    if (session?.user) {
      fetchTickets();
    }
  }, [session]);

  async function fetchTickets() {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingTickets(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          category,
          message,
          orderNumber: orderNumber || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar ticket');
      }

      setSent(true);
      setTicketId(data.ticketId);
      // Recarregar tickets
      if (session?.user) fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setSent(false);
    setTicketId('');
    setSubject('');
    setCategory('OTHER');
    setOrderNumber('');
    setMessage('');
    setError('');
  }

  const showOrderField = category === 'ORDER' || category === 'SHIPPING' || category === 'RETURN';

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Suporte</h1>
      </div>
      <p className="text-gray-600 mb-8 sm:mb-10">
        Tem alguma dúvida ou problema? Envie uma mensagem e nossa equipe entrará em contato.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2">
          {sent ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Ticket Enviado!</h2>
                <p className="text-gray-600 mb-2">
                  Sua solicitação foi registrada com sucesso.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Protocolo: <span className="font-mono font-medium">{ticketId}</span>
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Entraremos em contato pelo e-mail <strong>{email}</strong> o mais breve possível.
                </p>
                <Button onClick={resetForm} className="bg-[#FF6700] hover:bg-[#E05A00]">
                  Enviar Outro Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#FF6700]" />
                  Abrir Ticket de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Nome *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={labelClass}>
                        E-mail *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        Telefone
                      </label>
                      <input
                        id="phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className={labelClass}>
                        Categoria *
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputClass}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {showOrderField && (
                    <div>
                      <label htmlFor="orderNumber" className={labelClass}>
                        Número do Pedido
                      </label>
                      <input
                        id="orderNumber"
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className={inputClass}
                        placeholder="Ex: #1001"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="subject" className={labelClass}>
                      Assunto *
                    </label>
                    <input
                      id="subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClass}
                      placeholder="Resumo do seu problema ou dúvida"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className={labelClass}>
                      Mensagem *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${inputClass} resize-y`}
                      placeholder="Descreva em detalhes o que precisa de ajuda..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto bg-[#FF6700] hover:bg-[#E05A00]"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Tickets anteriores + Info */}
        <div className="space-y-6">
          {/* Info de contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outras formas de contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-[#FF6700] mt-0.5">@</span>
                <div>
                  <p className="font-medium">E-mail</p>
                  <a
                    href="mailto:contato@mibrasil.com"
                    className="text-[#FF6700] hover:underline"
                  >
                    contato@mibrasil.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-[#FF6700] mt-0.5" />
                <div>
                  <p className="font-medium">Horário de atendimento</p>
                  <p className="text-gray-600">Seg a Sex, 9h às 18h</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-[#FF6700] mt-0.5" />
                <div>
                  <p className="font-medium">Tempo de resposta</p>
                  <p className="text-gray-600">Até 24h úteis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets anteriores (somente logado) */}
          {session?.user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meus Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum ticket anterior.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((ticket) => {
                      const statusInfo = STATUS_LABELS[ticket.status] || STATUS_LABELS.OPEN;
                      return (
                        <div
                          key={ticket.id}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {ticket.subject}
                            </p>
                            <span
                              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                            {' · '}
                            {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
