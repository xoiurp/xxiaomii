import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/shopify-admin';
import { gql } from '@apollo/client';

// POST - Despublicar produto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!adminClient) {
      return NextResponse.json({
        success: false,
        error: 'Admin API client não inicializado',
        details: 'Token de acesso admin não configurado'
      }, { status: 500 });
    }

    const productId = `gid://shopify/Product/${params.id}`;

    // Atualizar status do produto para DRAFT (despublicar)
    const PRODUCT_UNPUBLISH_MUTATION = gql`
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            status
            publishedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.mutate({
      mutation: PRODUCT_UNPUBLISH_MUTATION,
      variables: {
        input: {
          id: productId,
          status: 'DRAFT'
        }
      }
    });

    if (response.data?.productUpdate?.userErrors?.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao despublicar produto',
        details: response.data.productUpdate.userErrors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produto despublicado com sucesso',
      product: response.data?.productUpdate?.product
    });

  } catch (error) {
    console.error('Erro ao despublicar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
