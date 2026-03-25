import { NextRequest, NextResponse } from 'next/server';
import { getProducts, ProductsConnection, ShopifyFetchOptions } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const after = searchParams.get('after');
  const first = searchParams.get('first') ? parseInt(searchParams.get('first')!, 10) : 12; // Default ITEMS_PER_PAGE
  const sortKey = searchParams.get('sortKey') || undefined;
  const reverse = searchParams.get('reverse') === 'true'; // Shopify API espera boolean
  const query = searchParams.get('query') || undefined; // Para filtros de preço, busca textual, etc.
  
  // Ler tags e productTypes da URL
  const tagsParam = searchParams.get('tags'); // Ex: "tagA,tagB"
  // const productTypesParam = searchParams.get('productTypes'); // REMOVIDO

  const tags = tagsParam ? tagsParam.split(',') : undefined;
  // const productTypes = productTypesParam ? productTypesParam.split(',') : undefined; // REMOVIDO

  // Definindo cacheOptions para esta API route (pode ser diferente do default em getProducts se necessário)
  // Por exemplo, para uma API de paginação, pode-se querer um revalidate mais curto ou tags específicas.
  const cacheOptions: ShopifyFetchOptions['next'] = {
    revalidate: 60, // Revalida a cada 60 segundos, por exemplo
    tags: ['api-products-paginated', 'products'], // Tags específicas para esta rota
  };

  try {
    const productsConnection: ProductsConnection = await getProducts(
      {
        first,
        after,
        sortKey,
        reverse,
        query, // Este é o existingQuery para getProducts
        tags, // Passa as tags
        // productTypes // REMOVIDO
      },
      { next: cacheOptions } // Passando o objeto ShopifyFetchOptions corretamente estruturado
    );

    return NextResponse.json({ productsConnection });

  } catch (error) {
    console.error('Erro na API Route /api/products:', error);
    return NextResponse.json(
      { errors: [{ message: (error instanceof Error ? error.message : 'Erro desconhecido na API.') }] },
      { status: 500 }
    );
  }
}
