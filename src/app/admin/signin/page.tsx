'use client';

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react';

export default function AdminSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email, senha incorretos ou você não tem permissão de administrador');
      } else {
        router.push('/admin/dashboard');
        router.refresh(); // Forçar atualização da sessão
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <img
              src="/mibrasil2svg.svg"
              alt="Mi Brasil"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-[#FF6700]" />
              <h2 className="text-3xl font-bold text-gray-900">
                Área Administrativa
              </h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Acesso restrito para administradores
          </p>
        </div>

        <Card className="border-2 border-[#FF6700]/20">
          <CardHeader className="bg-[#FF6700]/5">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#FF6700]" />
              <span>Login Administrativo</span>
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais de administrador para acessar o painel de controle
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mibrasil.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha de administrador"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF6700] hover:bg-[#E05A00]"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Acessar Painel'}
              </Button>
            </form>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                Não é administrador?
              </div>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-[#FF6700] hover:text-[#E05A00]"
              >
                Fazer login como cliente
              </Link>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Área Segura
                  </h3>
                  <div className="mt-1 text-sm text-amber-700">
                    Esta é uma área restrita. Todas as ações são monitoradas e registradas.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 