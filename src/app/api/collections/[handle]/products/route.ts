import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductsByCollection, 
  CollectionWithProductsPage, 
  ShopifyFetchOptions,
  ShopifyProductPriceFilter // Corrigido: Importando o tipo de filtro de preço com o nome correto
} from '@/lib/shopify';

const ITEMS_PER_PAGE = 12; // Pode ser ajustado ou passado como parâmetro se necessário

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const collectionHandle = params.handle;
  const { searchParams } = new URL(request.url);

  const after = searchParams.get('after');
  const first = searchParams.get('first') ? parseInt(searchParams.get('first')!, 10) : ITEMS_PER_PAGE;
  const sortKey = searchParams.get('sortKey') || undefined;
  const reverse = searchParams.get('reverse') === 'true';
  
  // Ler tags e productTypes da URL
  const tagsParam = searchParams.get('tags'); // Ex: "tagA,tagB"
  // const productTypesParam = searchParams.get('productTypes'); // REMOVIDO

  const tags = tagsParam ? tagsParam.split(',') : undefined;
  // const productTypes = productTypesParam ? productTypesParam.split(',') : undefined; // REMOVIDO

  // Lógica para filtros de preço
  const priceRangeParam = searchParams.get('priceRange'); 
  let priceFilters: ShopifyProductPriceFilter[] | undefined = undefined;

  if (priceRangeParam) {
    const getPriceFilterObject = (value: string): ShopifyProductPriceFilter | undefined => {
      const filter: ShopifyProductPriceFilter = { price: {} };
      if (value.includes('-')) {
        const [min, max] = value.split('-').map(Number);
        if (!isNaN(min)) filter.price.min = min;
        if (!isNaN(max)) filter.price.max = max;
      } else if (value.endsWith('+')) {
        const min = Number(value.slice(0, -1));
        if (!isNaN(min)) filter.price.min = min;
      } else { // Assume que é um valor máximo se não houver '-' ou '+' (ex: '500' significa <=500)
        const max = Number(value);
        if (!isNaN(max)) filter.price.max = max;
      }
      if (Object.keys(filter.price).length > 0) return filter;
      return undefined;
    };
    const pf = getPriceFilterObject(priceRangeParam);
    if (pf) {
      priceFilters = [pf];
    }
  }

  const cacheOptions: ShopifyFetchOptions['next'] = {
    revalidate: 60, // Revalida a cada 60 segundos
    tags: [`collection:${collectionHandle}`, 'products-paginated'],
  };

  try {
    const collectionWithProducts: CollectionWithProductsPage | null = await getProductsByCollection(
      {
        collectionHandle,
        first,
        after,
        sortKey,
        reverse,
        // A propriedade 'filters' aqui deve conter apenas os filtros de preço.
        // Tags e productTypes são passados como propriedades separadas para getProductsByCollection,
        // que então os combina internamente no array gqlProductFilters.
        filters: priceFilters,
        tags,
        // productTypes // REMOVIDO
      },
      cacheOptions
    );

    if (!collectionWithProducts) {
      return NextResponse.json(
        { errors: [{ message: `Coleção '${collectionHandle}' não encontrada.` }] },
        { status: 404 }
      );
    }

    // A API deve retornar apenas a parte 'productsConnection'
    return NextResponse.json({ productsConnection: collectionWithProducts.products });

  } catch (error) {
    console.error(`Erro na API Route /api/collections/${collectionHandle}/products:`, error);
    return NextResponse.json(
      { errors: [{ message: (error instanceof Error ? error.message : 'Erro desconhecido na API.') }] },
      { status: 500 }
    );
  }
}
