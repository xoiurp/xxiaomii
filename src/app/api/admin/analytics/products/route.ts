import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Aceitar parâmetros de data personalizados
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!shopDomain || !adminToken) {
      return NextResponse.json({
        error: 'Configuração Shopify incompleta'
      }, { status: 500 });
    }

    // Query para buscar produtos e informações de estoque
    const query = `
      query ProductsAnalytics {
        products(first: 250) {
          edges {
            node {
              id
              title
              status
              totalInventory
              createdAt
              updatedAt
              variants(first: 10) {
                edges {
                  node {
                    id
                    inventoryQuantity
                    inventoryPolicy
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL Error: ${data.errors[0].message}`);
    }

    const products = data.data.products.edges.map((edge: any) => edge.node);

    // Calcular estatísticas
    const totalProducts = products.length;
    const activeProducts = products.filter((product: any) => product.status === 'ACTIVE').length;
    const draftProducts = products.filter((product: any) => product.status === 'DRAFT').length;

    // Produtos com estoque baixo (menos de 10 unidades)
    const lowStockProducts = products.filter((product: any) => {
      const totalStock = product.variants.edges.reduce((sum: number, variant: any) => {
        return sum + (variant.node.inventoryQuantity || 0);
      }, 0);
      return totalStock > 0 && totalStock < 10;
    });

    // Produtos sem estoque
    const outOfStockProducts = products.filter((product: any) => {
      const totalStock = product.variants.edges.reduce((sum: number, variant: any) => {
        return sum + (variant.node.inventoryQuantity || 0);
      }, 0);
      return totalStock === 0;
    });

    // Produtos com estoque alto (mais de 100 unidades)
    const highStockProducts = products.filter((product: any) => {
      const totalStock = product.variants.edges.reduce((sum: number, variant: any) => {
        return sum + (variant.node.inventoryQuantity || 0);
      }, 0);
      return totalStock > 100;
    });

    // Lista de produtos com estoque baixo para alertas
    const lowStockAlerts = lowStockProducts.slice(0, 10).map((product: any) => {
      const totalStock = product.variants.edges.reduce((sum: number, variant: any) => {
        return sum + (variant.node.inventoryQuantity || 0);
      }, 0);
      return {
        id: product.id,
        title: product.title,
        stock: totalStock,
        status: product.status
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalProducts,
        activeProducts,
        draftProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        highStockCount: highStockProducts.length
      },
      distribution: {
        active: Math.round((activeProducts / totalProducts) * 100),
        draft: Math.round((draftProducts / totalProducts) * 100),
        lowStock: Math.round((lowStockProducts.length / totalProducts) * 100),
        outOfStock: Math.round((outOfStockProducts.length / totalProducts) * 100)
      },
      lowStockAlerts,
      summary: {
        needsAttention: lowStockProducts.length + outOfStockProducts.length,
        healthy: totalProducts - lowStockProducts.length - outOfStockProducts.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar analytics de produtos:', error);
    return NextResponse.json({
      error: 'Erro ao buscar dados de produtos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
