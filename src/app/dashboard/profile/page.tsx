'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, CheckCircle } from 'lucide-react';

interface AddressData {
  id?: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  addresses: (AddressData & { id: string; type: string; isDefault: boolean })[];
}

const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [address, setAddress] = useState<AddressData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Erro ao carregar perfil');
      const data: ProfileData = await res.json();

      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone ? formatPhone(data.phone) : '');
      setCpf(data.cpf ? formatCPF(data.cpf) : '');
      setBirthDate(data.birthDate || '');

      const defaultAddr = data.addresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setAddress({
          street: defaultAddr.street,
          number: defaultAddr.number,
          complement: defaultAddr.complement,
          neighborhood: defaultAddr.neighborhood,
          city: defaultAddr.city,
          state: defaultAddr.state,
          postalCode: defaultAddr.postalCode ? formatCEP(defaultAddr.postalCode) : '',
        });
      }
    } catch {
      setError('Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCepBlur() {
    const cepDigits = address.postalCode.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // silently fail
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone.replace(/\D/g, ''),
          cpf: cpf.replace(/\D/g, ''),
          birthDate: birthDate || null,
          address: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode.replace(/\D/g, ''),
          },
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6700] mx-auto" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
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

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 sm:py-6">
            <Link
              href="/dashboard"
              className="mr-4 p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Perfil atualizado com sucesso!
          </div>
        )}

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Nome Completo *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
                />
                <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cpf" className={labelClass}>
                  CPF
                </label>
                <input
                  id="cpf"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className={inputClass}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Telefone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className={inputClass}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label htmlFor="birthDate" className={labelClass}>
                  Data de Nascimento
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereço Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cep" className={labelClass}>
                  CEP
                </label>
                <div className="relative">
                  <input
                    id="cep"
                    type="text"
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, postalCode: formatCEP(e.target.value) }))
                    }
                    onBlur={handleCepBlur}
                    className={inputClass}
                    placeholder="00000-000"
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="street" className={labelClass}>
                  Rua / Logradouro
                </label>
                <input
                  id="street"
                  type="text"
                  value={address.street}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, street: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Nome da rua"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="number" className={labelClass}>
                  Número
                </label>
                <input
                  id="number"
                  type="text"
                  value={address.number}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, number: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="123"
                />
              </div>
              <div>
                <label htmlFor="complement" className={labelClass}>
                  Complemento
                </label>
                <input
                  id="complement"
                  type="text"
                  value={address.complement}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, complement: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div>
                <label htmlFor="neighborhood" className={labelClass}>
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={address.neighborhood}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, neighborhood: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>
                  Cidade
                </label>
                <input
                  id="city"
                  type="text"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  Estado
                </label>
                <select
                  id="state"
                  value={address.state}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Link href="/dashboard">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-[#FF6700] hover:bg-[#E05A00]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
