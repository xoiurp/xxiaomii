import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorização não fornecido' }, { status: 400 });
    }

    // Obter credenciais do ambiente
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
    const environment = process.env.MELHOR_ENVIO_ENVIRONMENT || 'sandbox';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Credenciais do Melhor Envio não configuradas',
        details: 'Verifique as variáveis MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET'
      }, { status: 500 });
    }

    // URL base da API
    const baseUrl = environment === 'production' 
      ? 'https://melhorenvio.com.br/api/v2'
      : 'https://sandbox.melhorenvio.com.br/api/v2';

    // Trocar código por token de acesso
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/admin/orders/thankyou`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Erro ao obter token:', tokenData);
      return NextResponse.json({ 
        error: 'Erro ao obter token de acesso',
        details: tokenData.error_description || tokenData.error || 'Erro desconhecido'
      }, { status: 400 });
    }

    // Aqui você deve salvar o token em um local seguro
    // Por exemplo: banco de dados, variáveis de ambiente, etc.
    console.log('Token obtido com sucesso:', {
      access_token: tokenData.access_token?.substring(0, 20) + '...',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

    // IMPORTANTE: Em produção, salve o token em um local seguro
    // Exemplo: await saveTokenToDatabase(tokenData);

    return NextResponse.json({ 
      success: true, 
      message: 'Token obtido com sucesso',
      token: {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope
      }
    });

  } catch (error) {
    console.error('Erro no OAuth:', error);
    return NextResponse.json({ 
      error: 'Erro interno no processamento OAuth',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// GET - Gerar URL de autorização
export async function GET() {
  try {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    const environment = process.env.MELHOR_ENVIO_ENVIRONMENT || 'sandbox';

    if (!clientId) {
      return NextResponse.json({ 
        error: 'Client ID não configurado',
        details: 'Verifique a variável MELHOR_ENVIO_CLIENT_ID'
      }, { status: 500 });
    }

    const baseUrl = environment === 'production' 
      ? 'https://melhorenvio.com.br'
      : 'https://sandbox.melhorenvio.com.br';

    const redirectUri = `${process.env.NEXTAUTH_URL}/admin/orders/thankyou`;
    const state = Math.random().toString(36).substring(2, 15);

    const authUrl = `${baseUrl}/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=shipping-calculate,shipping-cancel,shipping-checkout,shipping-companies,shipping-generate,shipping-preview,shipping-print,shipping-share,shipping-tracking,cart-read,cart-write`;

    return NextResponse.json({ 
      success: true, 
      authUrl,
      state,
      redirectUri
    });

  } catch (error) {
    console.error('Erro ao gerar URL de autorização:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar URL de autorização',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 