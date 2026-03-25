'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function MelhorEnvioCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Obter código de autorização da URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Erro na autorização: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Código de autorização não encontrado');
          return;
        }

        // Trocar código por token de acesso
        const response = await fetch('/api/admin/melhor-envio/oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Autorização concluída com sucesso!');
          setTokenInfo(data.token);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao processar autorização');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erro interno ao processar callback');
        console.error('Erro no callback:', error);
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            
            Autorização Melhor Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-gray-600">Processando autorização...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-green-600">{message}</p>
              
              {tokenInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Token configurado:</strong> {tokenInfo.access_token?.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Expira em: {new Date(Date.now() + tokenInfo.expires_in * 1000).toLocaleString()}
                  </p>
                </div>
              )}
              
              <Link href="/admin/orders">
                <Button className="w-full bg-[#FF6700] hover:bg-[#E55A00]">
                  Voltar para Pedidos
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-red-600">{message}</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Possíveis soluções:</strong>
                </p>
                <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                  <li>Verifique se o aplicativo está configurado corretamente</li>
                  <li>Confirme se as URLs de callback estão corretas</li>
                  <li>Tente autorizar novamente</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Link href="/admin/orders" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Voltar para Pedidos
                  </Button>
                </Link>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-[#FF6700] hover:bg-[#E55A00]"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MelhorEnvioCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <MelhorEnvioCallbackContent />
    </Suspense>
  );
}