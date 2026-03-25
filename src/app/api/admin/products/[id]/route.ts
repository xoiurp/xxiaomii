import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/shopify-admin';
import { gql } from '@apollo/client';

// GET - Buscar produto específico
export async function GET(
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

    const GET_PRODUCT_QUERY = gql`
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          vendor
          productType
          createdAt
          updatedAt
          publishedAt
          totalInventory
          descriptionHtml
          tags
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                inventoryQuantity
                availableForSale
                sku
                barcode
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          metafields(first: 20) {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.query({
      query: GET_PRODUCT_QUERY,
      variables: { id: productId },
    });

    if (response.errors && response.errors.length > 0) {
      console.error('Erros GraphQL ao buscar produto:', response.errors);
      return NextResponse.json({
        success: false,
        error: 'Erro GraphQL',
        details: response.errors[0].message
      }, { status: 500 });
    }

    if (!response.data?.product) {
      return NextResponse.json({
        success: false,
        error: 'Produto não encontrado',
        details: `Produto com ID ${params.id} não encontrado`
      }, { status: 404 });
    }

    // Simplificar estrutura de retorno
    const product = response.data.product;
    const simplifiedProduct = {
      ...product,
      images: product.images.edges.map((edge: any) => edge.node),
      variants: product.variants.edges.map((edge: any) => edge.node),
      metafields: product.metafields.edges.map((edge: any) => edge.node),
    };

    return NextResponse.json({
      success: true,
      product: simplifiedProduct
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// PUT - Atualizar produto
export async function PUT(
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

    const productData = await request.json();
    const productId = `gid://shopify/Product/${params.id}`;

    const PRODUCT_UPDATE_MUTATION = gql`
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
            vendor
            productType
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: any = { id: productId };
    
    // Adicionar campos que podem ser atualizados
    if (productData.title) input.title = productData.title;
    if (productData.vendor) input.vendor = productData.vendor;
    if (productData.productType) input.productType = productData.productType;
    if (productData.tags) input.tags = productData.tags;
    if (productData.descriptionHtml) input.descriptionHtml = productData.descriptionHtml;
    if (productData.status) input.status = productData.status;

    const response = await adminClient.mutate({
      mutation: PRODUCT_UPDATE_MUTATION,
      variables: { input }
    });

    if (response.data?.productUpdate?.userErrors?.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Erro de validação',
        details: response.data.productUpdate.userErrors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      product: response.data?.productUpdate?.product
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// DELETE - Deletar produto
export async function DELETE(
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

    const PRODUCT_DELETE_MUTATION = gql`
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.mutate({
      mutation: PRODUCT_DELETE_MUTATION,
      variables: { input: { id: productId } }
    });

    if (response.data?.productDelete?.userErrors?.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar produto',
        details: response.data.productDelete.userErrors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedProductId: response.data?.productDelete?.deletedProductId
    });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
