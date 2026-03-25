import { NextRequest, NextResponse } from 'next/server';
import { adminOperations } from '@/lib/shopify-admin';

// GET - Buscar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || null;
    const status = searchParams.get('status'); // ACTIVE, ARCHIVED, DRAFT

    // Usar adminOperations.getAllAdminProducts para buscar produtos
    const response = await adminOperations.getAllAdminProducts(limit, cursor);
    
    let filteredProducts = response.products;

    // Aplicar filtro de status se especificado
    if (status && status !== 'all') {
      filteredProducts = response.products.filter((product: any) => 
        product.status === status.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      products: filteredProducts,
      pageInfo: response.pageInfo,
      total: filteredProducts.length
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();

    const productInput = {
      title: productData.title,
      descriptionHtml: productData.descriptionHtml || '',
      vendor: productData.vendor || 'Mi Brasil',
      productType: productData.productType || '',
      tags: productData.tags || [],
      images: productData.images || [],
      variants: productData.variants || [{ price: "0.00" }]
    };

    const product = await adminOperations.createProduct(productInput);

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
