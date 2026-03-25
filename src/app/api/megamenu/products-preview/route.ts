import { NextResponse } from 'next/server';
import { adminOperations } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Configurar CORS para produção
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const url = new URL(request.url || 'http://localhost:3000');
    const searchParams = url.searchParams;
    const collectionId = searchParams.get('collectionId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 4; // Default limit to 4

    if (!collectionId) {
      return NextResponse.json({ error: 'O parâmetro "collectionId" é obrigatório.' }, { status: 400, headers: corsHeaders });
    }

    // Validação básica para o limite
    if (isNaN(limit) || limit <= 0 || limit > 10) { // Limite razoável para preview
      return NextResponse.json({ error: 'Parâmetro "limit" inválido. Deve ser um número entre 1 e 10.' }, { status: 400, headers: corsHeaders });
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!shopDomain || !adminToken) {
      console.warn('Configuração Shopify incompleta para megamenu - retornando produtos mock');
      
      // Retornar produtos mock para não quebrar o megamenu
      const mockProducts = Array.from({ length: limit }, (_, index) => ({
        id: `gid://shopify/Product/mock-${index + 1}`,
        title: `Produto ${index + 1}`,
        handle: `produto-${index + 1}`,
        images: {
          edges: [{
            node: {
              id: `gid://shopify/ProductImage/mock-${index + 1}`,
              src: 'https://placehold.co/300x300?text=Produto',
              altText: `Produto ${index + 1}`
            }
          }]
        }
      }));

      return NextResponse.json({ products: mockProducts }, { headers: corsHeaders });
    }

    try {
      const products = await adminOperations.getProductsPreviewForMegamenu(collectionId, limit);
      
      // A função getProductsPreviewForMegamenu já retorna os produtos no formato esperado (array de nós de produto)
      // e já lida com o caso de coleção não encontrada ou sem produtos retornando array vazio.
      return NextResponse.json({ products }, { headers: corsHeaders });

    } catch (shopifyError) {
      console.error('Erro ao buscar produtos da Shopify para megamenu:', shopifyError);
      
      // Se houver erro na Shopify, retornar produtos mock para não quebrar o megamenu
      const mockProducts = Array.from({ length: limit }, (_, index) => ({
        id: `gid://shopify/Product/mock-${index + 1}`,
        title: `Produto ${index + 1}`,
        handle: `produto-${index + 1}`,
        images: {
          edges: [{
            node: {
              id: `gid://shopify/ProductImage/mock-${index + 1}`,
              src: 'https://placehold.co/300x300?text=Produto',
              altText: `Produto ${index + 1}`
            }
          }]
        }
      }));

      return NextResponse.json({ 
        products: mockProducts,
        warning: 'Dados mock - erro na conexão com Shopify'
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('Erro geral ao buscar produtos para preview do megamenu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retornar produtos mock mesmo em caso de erro geral
    const mockProducts = Array.from({ length: 4 }, (_, index) => ({
      id: `gid://shopify/Product/mock-${index + 1}`,
      title: `Produto ${index + 1}`,
      handle: `produto-${index + 1}`,
      images: {
        edges: [{
          node: {
            id: `gid://shopify/ProductImage/mock-${index + 1}`,
            src: 'https://placehold.co/300x300?text=Produto',
            altText: `Produto ${index + 1}`
          }
        }]
      }
    }));

    return NextResponse.json({ 
      products: mockProducts,
      error: 'Falha ao buscar produtos para o megamenu',
      details: errorMessage
    }, { status: 200, headers: corsHeaders }); // Status 200 para não quebrar o frontend
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
