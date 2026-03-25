import React from 'react';
import { 
  getProductsByCollection, 
  getCollections, 
  Collection, 
  CollectionWithProductsPage,
  ShopifyFetchOptions, // Importar para cacheOptions
  Product, // Importar para generateStaticParams
  PageInfo, // Importar para tipagem
  GetProductsByCollectionParams, // Importar tipo para productParams
  ShopifyProductPriceFilter // Importar tipo para priceFilterObject
} from '../../../lib/shopify';
import ProductList from '../../../components/shop/ProductList'; // Importar ProductList
import Link from 'next/link';
// Componentes de Paginação removidos
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '../../../components/ui/sheet';
import FiltersSidebarContent from '../../../components/shop/FiltersSidebarContent';
import { Button } from '../../../components/ui/button';
import { FilterIcon, HomeIcon } from 'lucide-react';
import SortSelect from '../../../components/shop/SortSelect'; // Importar o novo componente

const ITEMS_PER_PAGE = 12;

export const revalidate = 60; // ISR: revalida a cada 60 segundos

// Função para gerar caminhos estáticos para as páginas de categoria
export async function generateStaticParams() {
  const collections = await getCollections(); // Usa getCollections já migrado
  
  if (!collections || collections.length === 0) {
    console.error("Erro ao buscar coleções para generateStaticParams ou nenhuma coleção encontrada.");
    return [];
  }

  return collections.map((collection: Collection) => ({
    category: collection.handle,
  }));
}

// Função para gerar string de query de preço a partir do parâmetro da URL
// (Copiada de /shop/page.tsx para consistência, ou poderia ser movida para utils)
const getPriceQueryFromParam = (priceRangeParam?: string | string[]): string | undefined => {
  const priceRangeValue = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;
  if (!priceRangeValue || priceRangeValue === 'any') {
    return undefined;
  }
  const parts = priceRangeValue.split('-');
  if (parts.length === 2) {
    if (parts[0] === '0') return `price:<=${parts[1]}`; 
    if (parts[1] === undefined || parts[1] === '+') return `price:>=${parts[0]}`; 
    return `(price:>=${parts[0]} AND price:<=${parts[1]})`; 
  } else if (priceRangeValue.endsWith('+')) {
    const min = priceRangeValue.slice(0, -1);
    return `price:>=${min}`; 
  }
  console.warn(`[CategoryPage] Faixa de preço desconhecida para query string: ${priceRangeValue}`); // Ajustado o log
  return undefined; 
};

// Definição do tipo para o filtro de preço estruturado (usaremos o importado ShopifyProductPriceFilter)
// interface ProductPriceFilter {
//   price: {
//     min?: number;
//     max?: number;
//   };
// }

// Função para mapear o valor do parâmetro de ordenação da URL para sortKey e reverse
const getSortOptionsFromParam = (sortParam?: string | string[]): { sortKey?: string; reverse?: boolean } => {
  const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  // Mapear para ProductSortKeys que getProducts espera
  switch (sortValue) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false };
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true };
    case 'name-asc':
      return { sortKey: 'TITLE', reverse: false };
    case 'name-desc':
      return { sortKey: 'TITLE', reverse: true };
    case 'created-desc':
      return { sortKey: 'CREATED_AT', reverse: true }; // Mapeado de CREATED para CREATED_AT
    case 'created-asc':
      return { sortKey: 'CREATED_AT', reverse: false }; // Mapeado de CREATED para CREATED_AT
    case 'featured':
    default:
      // BEST_SELLING é uma ProductCollectionSortKeys válida, mas getProducts usa ProductSortKeys.
      // RELEVANCE é uma ProductSortKey. Se a intenção de 'featured' é relevância, usar RELEVANCE.
      // Se for realmente por mais vendidos na coleção, a API route precisaria de lógica diferente.
      // Por ora, vamos manter BEST_SELLING se getProductsByCollection o suportar,
      // mas para ProductList que usa /api/products (e getProducts), precisaremos de um sortKey compatível.
      // A função getProductsByCollection em shopify.ts usa ProductCollectionSortKeys, que inclui BEST_SELLING.
      // A função getProducts (usada por /api/products) usa ProductSortKeys, que inclui RELEVANCE.
      // Para o baseQuery do ProductList, vamos mapear 'featured' para 'RELEVANCE'.
      return { sortKey: 'BEST_SELLING', reverse: false }; // Mantido para getProductsByCollection
  }
};

// Nova função para obter o objeto de filtro de preço
const getPriceFilterObjectFromParam = (priceRangeParam?: string | string[]): ShopifyProductPriceFilter | undefined => {
  const priceRangeValue = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;

  if (!priceRangeValue || priceRangeValue === 'any') {
    return undefined;
  }

  const filter: ShopifyProductPriceFilter = { price: {} };

  switch (priceRangeValue) {
    case '0-500':
      filter.price.max = 500;
      break;
    case '500-1000':
      filter.price.min = 500;
      filter.price.max = 1000;
      break;
    case '1000-2000':
      filter.price.min = 1000;
      filter.price.max = 2000;
      break;
    case '2000+':
      filter.price.min = 2000;
      break;
    default:
      console.warn(`[CategoryPage] Faixa de preço desconhecida: ${priceRangeValue}`);
      return undefined;
  }
  return filter;
};

interface CategoryPageProps {
  params: { category: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = params;
  const afterCursor = typeof searchParams?.after === 'string' ? searchParams.after : null;
  const beforeCursor = typeof searchParams?.before === 'string' ? searchParams.before : null;

  // Removida definição local de ProductsByCollectionRequestParams, usaremos GetProductsByCollectionParams importado

  const sortParam = searchParams?.sort;
  const priceRangeParam = searchParams?.priceRange;
  
  // Leitura robusta de tagsParamValue
  const tagsParamValue = searchParams?.tag; 
  let tags: string[] | undefined = undefined;
  if (typeof tagsParamValue === 'string') {
    tags = [tagsParamValue]; 
  } else if (Array.isArray(tagsParamValue)) {
    tags = tagsParamValue; 
  }

  // Leitura robusta de productTypesParamValue - REMOVIDO
  // const productTypesParamValue = searchParams?.product_type;
  // let productTypes: string[] | undefined = undefined;
  // if (typeof productTypesParamValue === 'string') {
  //   productTypes = [productTypesParamValue];
  // } else if (Array.isArray(productTypesParamValue)) {
  //   productTypes = productTypesParamValue;
  // }

  const { sortKey, reverse } = getSortOptionsFromParam(sortParam);
  const priceFilterObject = getPriceFilterObjectFromParam(priceRangeParam); 

  console.log(`[CategoryPage: ${category}] searchParams received:`, JSON.stringify(searchParams));
  console.log(`[CategoryPage: ${category}] tags derived:`, tags); // Log do array de tags derivado
  // console.log(`[CategoryPage: ${category}] productTypes derived:`, productTypes); // REMOVIDO
  console.log(`[CategoryPage: ${category}] Generated priceFilterObject:`, priceFilterObject ? JSON.stringify(priceFilterObject) : undefined);
  console.log(`[CategoryPage: ${category}] Sort options:`, { sortKey, reverse });

  // const tags = tagsParam ? tagsParam.split(',') : undefined; // Lógica antiga removida
  // const productTypes = productTypesParam ? productTypesParam.split(',') : undefined; // Lógica antiga removida

  let productParams: GetProductsByCollectionParams = { 
    collectionHandle: category, 
    first: ITEMS_PER_PAGE,
    sortKey,
    reverse,
    filters: priceFilterObject ? [priceFilterObject] : undefined,
    tags: tags,
    // productTypes: productTypes, // REMOVIDO
  };

  if (afterCursor) {
    productParams.after = afterCursor;
    // Não precisamos deletar 'last' e 'before' se não estiverem definidos em productParams inicialmente
    // e a interface GetProductsByCollectionParams os tiver como opcionais.
    // A lógica de `getProductsByCollection` deve lidar com `first`/`after` vs `last`/`before`.
    // Para simplificar, vamos manter a lógica de paginação focada em 'first'/'after' para a carga inicial e scroll.
    // Se a paginação para trás for implementada, 'last'/'before' serão relevantes.
    // Por ora, a carga inicial não usa 'last'/'before'.
  } 
  // A lógica para 'beforeCursor' (paginação para trás) para a carga inicial não está totalmente implementada
  // e pode ser removida se não for um requisito imediato para a carga inicial da página.
  // O ProductList lida com 'after' para o scroll infinito.

  const categoryCacheOptions: ShopifyFetchOptions['next'] = { revalidate: 60, tags: [`collection:${category}`, 'products'] };
  // Passar apenas os parâmetros relevantes para a carga inicial
  const initialLoadParams: GetProductsByCollectionParams = {
    collectionHandle: category,
    first: ITEMS_PER_PAGE,
    sortKey,
    reverse,
    filters: priceFilterObject ? [priceFilterObject] : undefined,
    tags: tags,
    // productTypes: productTypes, // REMOVIDO
    // after e before não são usados para a primeira carga, a menos que a URL já os contenha (o que não é o caso típico)
  };
  console.log(`[CategoryPage: ${category}] initialLoadParams:`, JSON.stringify(initialLoadParams));
  const categoryData: CollectionWithProductsPage | null = await getProductsByCollection(initialLoadParams, categoryCacheOptions);
  
  const allCollectionsCacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: ['collections'] };
  const allCollections: Collection[] = await getCollections(allCollectionsCacheOptions);

  // Buscar tags e tipos de produto específicos da coleção atual
  let categorySpecificTags: string[] = [];
  // let categorySpecificProductTypes: string[] = []; // Removido

  if (categoryData) { // Só prosseguir se a coleção principal foi encontrada
    const productsForFacetsParams: GetProductsByCollectionParams = {
      collectionHandle: category,
      first: 250, // Buscar até 250 produtos para extrair tags/tipos.
                  // Não aplicar filtros de URL aqui, queremos todas as facetas da coleção base.
    };
    // Usar uma opção de cache separada ou a mesma, dependendo da frequência de atualização das tags/tipos
    const facetsCacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: [`collection:${category}:facets`] };
    const productsForFacetsData = await getProductsByCollection(productsForFacetsParams, facetsCacheOptions);

    if (productsForFacetsData?.products.edges) {
      const tagsSet = new Set<string>();
      // const productTypesSet = new Set<string>(); // Removido
      productsForFacetsData.products.edges.forEach(edge => {
        edge.node.tags?.forEach(tag => tagsSet.add(tag));
        // if (edge.node.productType) { // Removido
        //   productTypesSet.add(edge.node.productType);
        // }
      });
      categorySpecificTags = Array.from(tagsSet).sort();
      // categorySpecificProductTypes = Array.from(productTypesSet).sort(); // Removido
      console.log(`[CategoryPage: ${category}] Derived categorySpecificTags:`, categorySpecificTags);
      // console.log(`[CategoryPage: ${category}] Derived categorySpecificProductTypes:`, categorySpecificProductTypes); // Removido
    }
  }

  if (!categoryData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
        <p className="mb-8">A categoria que você está procurando não existe ou foi removida.</p>
        <Link
          href="/shop"
          className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const initialProducts: Product[] = categoryData.products.edges.map(edge => edge.node);
  const initialPageInfo: PageInfo = categoryData.products.pageInfo;

  // Preparar baseQuery para ProductList
  // A API /api/products espera 'query' para filtros.
  // getProductsByCollection usa 'filters' para preço e 'collectionHandle' para coleção.
  // Preparar baseQuery para ProductList
  // Com a nova API Route /api/collections/[handle]/products, não precisamos mais
  // passar collection_id via 'query' no baseQuery.
  // O baseQuery ainda será usado para 'first', 'sortKey', 'reverse', e filtros de preço/tag/tipo.

  // Função para gerar a string de query de preço para a API (se necessário)
  // Esta função é similar à getPriceQueryFromParam, mas pode ser ajustada se a API de coleção
  // esperar um formato diferente para o priceRange no searchParams.
  // A API /api/collections/[handle]/products já tem lógica para ler 'priceRange', 'tags', 'productTypes'.
  const priceRangeQueryParam = searchParams?.priceRange; 

  // Ajustar sortKey para ProductList. A API de coleção espera ProductCollectionSortKeys.
  // A API genérica de produtos espera ProductSortKeys.
  // Se ProductList sempre usa a mesma API para ordenação, o mapeamento pode ser consistente.
  // A nova API /api/collections/[handle]/products usa getProductsByCollection,
  // que aceita sortKeys como BEST_SELLING, CREATED_AT, etc.
  // A API /api/products usa getProducts, que também aceita estes.
  // O mapeamento de 'CREATED' para 'CREATED_AT' e 'BEST_SELLING' para 'RELEVANCE' (se aplicável)
  // deve ser consistente ou a API deve lidar com os aliases.
  // Por ora, vamos manter o sortKey como está, pois ambas as funções de backend
  // (getProducts e getProductsByCollection) parecem lidar com os mesmos sortKeys
  // ou a API route faz a tradução.
  // A API /api/collections/[handle]/products já usa sortKey diretamente.

  const baseQueryForProductList: Record<string, any> = { // Usar 'any' para flexibilidade
    first: String(ITEMS_PER_PAGE),
  };
  if (sortKey) baseQueryForProductList.sortKey = sortKey; 
  if (reverse !== undefined) baseQueryForProductList.reverse = reverse;
  
  // Adicionar parâmetros para a API /api/collections/[handle]/products
  if (priceRangeQueryParam) {
    baseQueryForProductList.priceRange = Array.isArray(priceRangeQueryParam) ? priceRangeQueryParam[0] : priceRangeQueryParam;
  }
  // Para tags e productTypes, passar a string original (se existir) ou o primeiro elemento do array (se for array)
  // A API route espera uma string separada por vírgulas ou um único valor.
  // Se tagsParamValue ou productTypesParamValue for um array, pegamos o primeiro,
  // assumindo que a lógica de múltiplos filtros no FiltersSidebarContent.tsx
  // já constrói a URL com múltiplos parâmetros (ex: tag=a&tag=b) que a API route lê com getAll.
  // No entanto, para o baseQuery que vai para o ProductList, que depois vai para a API route,
  // a API route espera uma string (ex: "tag1,tag2") para os parâmetros 'tags' e 'productTypes'.
  
  if (tagsParamValue) { // tagsParamValue é o valor bruto de searchParams.tag
    baseQueryForProductList.tags = Array.isArray(tagsParamValue) ? tagsParamValue.join(',') : tagsParamValue;
  }
  // if (productTypesParamValue) { // REMOVIDO
  //   baseQueryForProductList.productTypes = Array.isArray(productTypesParamValue) ? productTypesParamValue.join(',') : productTypesParamValue;
  // }
  
  // Não precisamos mais de combinedQueryForApi para collection_id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Cabeçalho da página - Responsivo */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{categoryData.title}</h1>
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700] min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2" aria-label="Início">
            <HomeIcon className="h-4 w-4" />
          </Link>
          <span className="mx-1 sm:mx-2">/</span>
          <Link href="/shop" className="hover:text-[#FF6700]">
            Loja
          </Link>
          <span className="mx-1 sm:mx-2">/</span>
          <span className="truncate max-w-[100px] sm:max-w-none">{categoryData.title}</span>
        </div>
      </div>

      {/* Filtros e produtos */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Sidebar para Desktop */}
        <div className="hidden md:block w-full md:w-56 lg:w-64 flex-shrink-0">
          <FiltersSidebarContent
            collections={allCollections}
            currentCategoryHandle={category}
            currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
            categoryTags={categorySpecificTags}
          />
        </div>

        {/* Lista de produtos */}
        <div className="flex-grow min-w-0">
          {/* Controles: Botão de Filtros (Mobile) e Select de Ordenação */}
          <div className="mb-4 sm:mb-6">
            {/* Barra de controles responsiva */}
            <div className="flex flex-row items-stretch gap-2 sm:gap-3 md:justify-end md:border-b md:pb-4">
              {/* Botão de Filtros para Mobile (SheetTrigger) - Touch target 44px */}
              <div className="flex-1 md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <FilterIcon size={18} />
                      <span>Filtros</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] max-w-[350px] p-4 sm:p-6 overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-lg">Filtros e Categorias</SheetTitle>
                    </SheetHeader>
                    <FiltersSidebarContent
                      collections={allCollections}
                      currentCategoryHandle={category}
                      currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
                      categoryTags={categorySpecificTags}
                    />
                    <SheetClose asChild>
                      <Button variant="outline" className="mt-4 w-full min-h-[44px]">Fechar</Button>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Select de Ordenação - Flex-1 em mobile para ocupar espaço igual */}
              <div className="flex-1 md:flex-none">
                <SortSelect initialSortValue={Array.isArray(sortParam) ? sortParam[0] : sortParam} />
              </div>
            </div>
          </div>

          {initialProducts.length > 0 ? (
            <ProductList
              initialProducts={initialProducts}
              initialPageInfo={initialPageInfo}
              baseQuery={baseQueryForProductList}
              collectionHandle={category} // Passa o handle da coleção para o ProductList
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block text-[#FF6700] hover:underline"
              >
                Ver todos os produtos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
