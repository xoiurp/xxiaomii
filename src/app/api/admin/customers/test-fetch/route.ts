import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id') || '9151137612005';

    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!shopDomain || !adminToken) {
      return NextResponse.json({
        error: 'Configuração Shopify incompleta'
      }, { status: 500 });
    }

    // Buscar cliente específico via REST API
    // Usando versão 2025-04 da API
    const restApiUrl = `https://${shopDomain}/admin/api/2025-04/customers/${customerId}.json`;

    console.log('Buscando cliente:', restApiUrl);

    const response = await fetch(restApiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Shopify:', errorText);
      return NextResponse.json({
        error: `Shopify REST API Error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    console.log('Dados do cliente retornados:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      customer: data.customer,
      analysis: {
        hasEmail: !!data.customer?.email,
        hasFirstName: !!data.customer?.first_name,
        hasLastName: !!data.customer?.last_name,
        hasPhone: !!data.customer?.phone,
        ordersCount: data.customer?.orders_count,
        totalSpent: data.customer?.total_spent,
        hasDefaultAddress: !!data.customer?.default_address
      }
    });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({
      error: 'Erro ao buscar cliente',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
