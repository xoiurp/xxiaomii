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

    // Converter ID numérico para GID do GraphQL
    const gid = `gid://shopify/Customer/${customerId}`;

    // Query GraphQL para buscar cliente
    const query = `
      query getCustomer($id: ID!) {
        customer(id: $id) {
          id
          email
          firstName
          lastName
          phone
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
          defaultAddress {
            address1
            address2
            city
            province
            zip
            country
            phone
          }
          addresses {
            address1
            city
            province
          }
          tags
          note
          state
          taxExempt
          acceptsMarketing
          acceptsMarketingUpdatedAt
          createdAt
          updatedAt
        }
      }
    `;

    console.log('Buscando cliente via GraphQL:', gid);

    const response = await fetch(`https://${shopDomain}/admin/api/2025-04/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: gid }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Shopify:', errorText);
      return NextResponse.json({
        error: `Shopify GraphQL API Error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Erros GraphQL:', data.errors);
      return NextResponse.json({
        error: 'Erro GraphQL',
        details: data.errors
      }, { status: 500 });
    }

    console.log('Dados do cliente via GraphQL:', JSON.stringify(data, null, 2));

    const customer = data.data?.customer;

    return NextResponse.json({
      success: true,
      customer,
      analysis: {
        hasEmail: !!customer?.email,
        hasFirstName: !!customer?.firstName,
        hasLastName: !!customer?.lastName,
        hasPhone: !!customer?.phone,
        ordersCount: customer?.numberOfOrders,
        totalSpent: customer?.amountSpent?.amount,
        hasDefaultAddress: !!customer?.defaultAddress
      },
      comparison: {
        message: 'Compare esses dados com a REST API para ver qual retorna mais informações'
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
