'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  CreditCard,
  QrCode,
  FileText,
  Truck,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Clock
} from 'lucide-react';

// Tipos
interface CustomerData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  installments: number;
}

interface PaymentResult {
  method: 'credit_card' | 'pix' | 'boleto';
  qr_code?: string;
  emv_code?: string;
  expires_at?: string;
  url?: string;
  barcode?: string;
  due_date?: string;
}

interface OrderResult {
  id: string;
  appmax_order_id: number;
  status: string;
  total: number;
}

type PaymentMethod = 'credit_card' | 'pix' | 'boleto';
type CheckoutStep = 'customer' | 'address' | 'payment' | 'review';

// Declaracao do AppmaxScripts global (carregado via CDN no layout)
declare global {
  interface Window {
    AppmaxScripts?: {
      init: (onSuccess: Function, onError: Function, externalId: string, onUpdate?: Function, onAuthorize?: Function) => void;
      getIp?: () => string;
    };
    appmaxClientIp?: string;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, totalItems, selectedShipping, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string>('');
  const [copiedEmv, setCopiedEmv] = useState(false);

  // Resultado do pagamento
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Timer para PIX
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(0);

  const [customer, setCustomer] = useState<CustomerData>({
    name: '', email: '', cpf: '', phone: ''
  });

  const [address, setAddress] = useState<AddressData>({
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
  });

  const [card, setCard] = useState<CardData>({
    number: '', name: '', expiry: '', cvv: '', installments: 1
  });

  // Inicializar AppMax JS e coletar IP
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AppmaxScripts) {
      window.AppmaxScripts.init(
        (data: any) => {
          const ip = data?.ip || '';
          setClientIp(ip);
          window.appmaxClientIp = ip;
        },
        (err: any) => {
          console.error('AppMax JS error:', err);
        },
        '' // external_id - sera preenchido quando tivermos
      );
    }
    // Fallback: buscar IP via API publica se AppMax JS nao carregar
    if (!clientIp) {
      fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => {
          if (!clientIp && data.ip) {
            setClientIp(data.ip);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Timer do PIX
  useEffect(() => {
    if (paymentResult?.method !== 'pix' || !paymentResult.expires_at) return;

    const expiresAt = new Date(paymentResult.expires_at).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setPixTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentResult]);

  useEffect(() => {
    if (cart.length === 0 && !orderComplete) {
      router.push('/');
    }
  }, [cart, router, orderComplete]);

  // ViaCEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    }
  };

  // Formatadores
  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})\d+?$/, '$1');
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\/\d{2})\d+?$/, '$1');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatCentsAsCurrency = (cents: number) => {
    return formatCurrency(cents / 100);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculos
  const shippingPrice = selectedShipping ? parseFloat(selectedShipping.price) : 0;
  const subtotal = totalPrice;
  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const total = subtotal + shippingPrice - pixDiscount;

  // Converter para centavos para AppMax
  const toCents = (value: number) => Math.round(value * 100);

  const getInstallmentOptions = () => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const value = total / i;
      if (value >= 50 || i === 1) {
        const hasInterest = i > 6;
        const totalWithInterest = hasInterest ? total * Math.pow(1.0199, i) : total;
        options.push({ installments: i, value: totalWithInterest / i, total: totalWithInterest, hasInterest });
      }
    }
    return options;
  };

  // Validacoes
  const validateCustomer = () => {
    if (!customer.name || customer.name.split(' ').length < 2) { setError('Digite seu nome completo'); return false; }
    if (!customer.email || !customer.email.includes('@')) { setError('Digite um email válido'); return false; }
    if (!customer.cpf || customer.cpf.replace(/\D/g, '').length !== 11) { setError('Digite um CPF válido'); return false; }
    if (!customer.phone || customer.phone.replace(/\D/g, '').length < 10) { setError('Digite um telefone válido'); return false; }
    setError(null); return true;
  };

  const validateAddress = () => {
    if (!address.cep || address.cep.replace(/\D/g, '').length !== 8) { setError('Digite um CEP válido'); return false; }
    if (!address.street) { setError('Digite o endereço'); return false; }
    if (!address.number) { setError('Digite o número'); return false; }
    if (!address.neighborhood) { setError('Digite o bairro'); return false; }
    if (!address.city) { setError('Digite a cidade'); return false; }
    if (!address.state) { setError('Digite o estado'); return false; }
    setError(null); return true;
  };

  const validatePayment = () => {
    if (paymentMethod === 'credit_card') {
      if (!card.number || card.number.replace(/\D/g, '').length < 16) { setError('Digite um número de cartão válido'); return false; }
      if (!card.name) { setError('Digite o nome no cartão'); return false; }
      if (!card.expiry || card.expiry.replace(/\D/g, '').length !== 4) { setError('Digite a validade do cartão'); return false; }
      if (!card.cvv || card.cvv.length < 3) { setError('Digite o CVV'); return false; }
    }
    setError(null); return true;
  };

  const nextStep = () => {
    if (currentStep === 'customer' && validateCustomer()) setCurrentStep('address');
    else if (currentStep === 'address' && validateAddress()) setCurrentStep('payment');
    else if (currentStep === 'payment' && validatePayment()) setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'address') setCurrentStep('customer');
    else if (currentStep === 'payment') setCurrentStep('address');
    else if (currentStep === 'review') setCurrentStep('payment');
  };

  // Copiar codigo PIX
  const copyEmvCode = useCallback(() => {
    if (paymentResult?.emv_code) {
      navigator.clipboard.writeText(paymentResult.emv_code);
      setCopiedEmv(true);
      setTimeout(() => setCopiedEmv(false), 3000);
    }
  }, [paymentResult]);

  // ========================================
  // PROCESSAR PAGAMENTO REAL VIA APPMAX
  // ========================================
  const processPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Separar nome em first_name e last_name
      const nameParts = customer.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Montar produtos para AppMax (valores em centavos)
      const products = cart.map(item => ({
        sku: item.variantId || item.id,
        name: item.title,
        quantity: item.quantity,
        unit_value: toCents(item.price),
        type: 'physical' as const,
      }));

      // Montar dados do cartao se necessario
      let creditCardData = undefined;
      if (paymentMethod === 'credit_card') {
        const expiryParts = card.expiry.split('/');
        creditCardData = {
          number: card.number.replace(/\s/g, ''),
          cvv: card.cvv,
          expiration_month: expiryParts[0],
          expiration_year: expiryParts[1],
          holder_name: card.name,
          installments: card.installments,
        };
      }

      const response = await fetch('/api/appmax/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: customer.email,
            phone: customer.phone,
            document_number: customer.cpf,
            ip: clientIp || '0.0.0.0',
          },
          address: {
            postcode: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement || '',
            district: address.neighborhood,
            city: address.city,
            state: address.state,
          },
          products,
          shipping_value: toCents(shippingPrice),
          discount_value: toCents(pixDiscount),
          payment_method: paymentMethod,
          credit_card: creditCardData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      // Sucesso
      setOrderResult(data.order);
      setPaymentResult(data.payment);
      setOrderComplete(true);
      clearCart();

      // Iniciar timer do PIX (30 minutos padrao)
      if (data.payment?.method === 'pix') {
        if (data.payment.expires_at) {
          const expiresAt = new Date(data.payment.expires_at).getTime();
          setPixTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
        } else {
          setPixTimeLeft(30 * 60); // 30 minutos fallback
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ========================================
  // TELAS DE SUCESSO POR METODO DE PAGAMENTO
  // ========================================
  if (orderComplete && orderResult) {
    // SUCESSO - CARTAO DE CREDITO
    if (paymentResult?.method === 'credit_card') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
            <p className="text-gray-600 mb-6">Seu pagamento foi aprovado. Você receberá um email com os detalhes.</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Número do pedido</p>
              <p className="text-lg font-mono font-bold text-gray-900">#{orderResult.appmax_order_id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Total pago</p>
              <p className="text-lg font-bold text-gray-900">{formatCentsAsCurrency(orderResult.total)}</p>
            </div>
            <Link href="/" className="block w-full bg-[#FF6700] text-white py-3 rounded-lg font-semibold hover:bg-[#e55d00] transition-colors">
              Voltar para a Loja
            </Link>
          </div>
        </div>
      );
    }

    // SUCESSO - PIX
    if (paymentResult?.method === 'pix') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pague com PIX</h1>
            <p className="text-gray-600 mb-4">Escaneie o QR Code ou copie o código para finalizar o pagamento.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">Pedido #{orderResult.appmax_order_id}</p>
              <p className="text-lg font-bold text-[#FF6700]">{formatCentsAsCurrency(orderResult.total)}</p>
            </div>

            {/* Timer */}
            {pixTimeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Expira em {formatTimer(pixTimeLeft)}</span>
              </div>
            )}
            {pixTimeLeft === 0 && paymentResult.expires_at && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">Código PIX expirado. Faça um novo pedido.</p>
              </div>
            )}

            {/* QR Code */}
            {paymentResult.qr_code && (
              <div className="mb-4 p-4 bg-white border-2 border-gray-200 rounded-xl inline-block">
                <img
                  src={paymentResult.qr_code}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}

            {/* Copia e cola */}
            {paymentResult.emv_code && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Ou copie o código:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentResult.emv_code}
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono truncate"
                  />
                  <button
                    onClick={copyEmvCode}
                    className="px-4 py-2 bg-[#FF6700] text-white rounded-lg text-sm font-medium hover:bg-[#e55d00] transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedEmv ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            <Link href="/" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Voltar para a Loja
            </Link>
          </div>
        </div>
      );
    }

    // SUCESSO - BOLETO
    if (paymentResult?.method === 'boleto') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Boleto Gerado!</h1>
            <p className="text-gray-600 mb-4">Baixe o boleto ou copie a linha digitável para efetuar o pagamento.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">Pedido #{orderResult.appmax_order_id}</p>
              <p className="text-lg font-bold text-[#FF6700]">{formatCentsAsCurrency(orderResult.total)}</p>
              {paymentResult.due_date && (
                <p className="text-sm text-gray-500 mt-1">Vencimento: {paymentResult.due_date}</p>
              )}
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-yellow-800 text-sm">Prazo de compensação: até 3 dias úteis após o pagamento.</p>
            </div>

            {/* Linha digitavel */}
            {paymentResult.barcode && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Linha digitável:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentResult.barcode}
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentResult.barcode!);
                    }}
                    className="px-4 py-2 bg-[#FF6700] text-white rounded-lg text-sm font-medium hover:bg-[#e55d00] transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {/* Botao de download */}
            {paymentResult.url && (
              <a
                href={paymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#FF6700] text-white py-3 rounded-lg font-semibold hover:bg-[#e55d00] transition-colors mb-4"
              >
                <Download className="w-5 h-5" />
                Baixar Boleto
              </a>
            )}

            <Link href="/" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Voltar para a Loja
            </Link>
          </div>
        </div>
      );
    }
  }

  // Fallback para orderComplete sem resultado (nao deveria acontecer)
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Realizado!</h1>
          <p className="text-gray-600 mb-6">Seu pedido foi registrado. Você receberá um email com os detalhes.</p>
          <Link href="/" className="block w-full bg-[#FF6700] text-white py-3 rounded-lg font-semibold hover:bg-[#e55d00] transition-colors">
            Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'customer', label: 'Dados', number: 1 },
    { id: 'address', label: 'Entrega', number: 2 },
    { id: 'payment', label: 'Pagamento', number: 3 },
    { id: 'review', label: 'Revisão', number: 4 }
  ];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <Link href="/">
            <Image src="/assets/images/novo-logo.svg" alt="Mi Brasil" width={120} height={40} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2 text-green-600">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Compra Segura</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index <= currentStepIndex ? 'bg-[#FF6700] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {index < currentStepIndex ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                  </div>
                  <span className={`text-xs mt-1 ${index <= currentStepIndex ? 'text-[#FF6700] font-medium' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${index < currentStepIndex ? 'bg-[#FF6700]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Customer */}
              {currentStep === 'customer' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Seus Dados</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                      <input type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="Digite seu nome completo" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="seu@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                      <input type="text" value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: formatCPF(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="000.000.000-00" maxLength={14} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                      <input type="text" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 'address' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Endereço de Entrega</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                      <input type="text" value={address.cep} onChange={(e) => { const f = formatCEP(e.target.value); setAddress({ ...address, cep: f }); if (f.replace(/\D/g, '').length === 8) fetchAddressByCep(f); }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="00000-000" maxLength={9} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                      <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="Rua, Avenida..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                      <input type="text" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="123" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                      <input type="text" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="Apto, Bloco..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                      <input type="text" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="Bairro" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                      <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="Cidade" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                      <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none">
                        <option value="">Selecione</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Forma de Pagamento</h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-[#FF6700] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'credit_card' ? 'text-[#FF6700]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === 'credit_card' ? 'text-[#FF6700]' : 'text-gray-600'}`}>Cartão</span>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('pix')} className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-[#FF6700] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-[#FF6700]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === 'pix' ? 'text-[#FF6700]' : 'text-gray-600'}`}>PIX</span>
                      <span className="text-xs text-green-600 font-medium">5% OFF</span>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('boleto')} className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'boleto' ? 'border-[#FF6700] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <FileText className={`w-6 h-6 ${paymentMethod === 'boleto' ? 'text-[#FF6700]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === 'boleto' ? 'text-[#FF6700]' : 'text-gray-600'}`}>Boleto</span>
                    </button>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão *</label>
                        <input type="text" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="0000 0000 0000 0000" maxLength={19} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão *</label>
                        <input type="text" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="NOME COMO NO CARTÃO" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Validade *</label>
                          <input type="text" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="MM/AA" maxLength={5} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                          <input type="text" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none" placeholder="123" maxLength={4} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                        <select value={card.installments} onChange={(e) => setCard({ ...card, installments: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent outline-none">
                          {getInstallmentOptions().map(opt => (
                            <option key={opt.installments} value={opt.installments}>
                              {opt.installments}x de {formatCurrency(opt.value)} {opt.hasInterest ? '(com juros)' : 'sem juros'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">Você ganha 5% de desconto pagando com PIX!</p>
                      <p className="text-green-600 text-sm mt-1">O QR Code será gerado após confirmar o pedido.</p>
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">Boleto Bancário</p>
                      <p className="text-yellow-600 text-sm mt-1">O boleto será gerado após confirmar o pedido. Prazo de compensação: até 3 dias úteis.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Revisão do Pedido</h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Dados Pessoais</h3>
                      <p className="text-gray-600">{customer.name}</p>
                      <p className="text-gray-600">{customer.email}</p>
                      <p className="text-gray-600">{customer.phone}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Endereço de Entrega</h3>
                      <p className="text-gray-600">{address.street}, {address.number} {address.complement}</p>
                      <p className="text-gray-600">{address.neighborhood} - {address.city}/{address.state}</p>
                      <p className="text-gray-600">CEP: {address.cep}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Pagamento</h3>
                      <p className="text-gray-600">
                        {paymentMethod === 'credit_card' && `Cartão de Crédito - ${card.installments}x`}
                        {paymentMethod === 'pix' && 'PIX (5% de desconto)'}
                        {paymentMethod === 'boleto' && 'Boleto Bancário'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep !== 'customer' ? (
                  <button onClick={prevStep} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                    Voltar
                  </button>
                ) : <div />}

                {currentStep !== 'review' ? (
                  <button onClick={nextStep} className="px-8 py-3 bg-[#FF6700] text-white rounded-lg font-semibold hover:bg-[#e55d00] transition-colors">
                    Continuar
                  </button>
                ) : (
                  <button onClick={processPayment} disabled={isProcessing} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Finalizar Compra
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Pedido</h3>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image src={item.image} alt={item.title} width={64} height={64} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-900">{shippingPrice > 0 ? formatCurrency(shippingPrice) : 'A calcular'}</span>
                </div>
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>-{formatCurrency(pixDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#FF6700]">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>Pagamento 100% seguro</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Entrega para todo Brasil</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Garantia de 12 meses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
