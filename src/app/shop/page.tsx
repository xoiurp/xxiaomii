import React from 'react';
import { getProducts, getCollections, Collection, ProductsConnection, ShopifyFetchOptions, Product, PageInfo } from '../../lib/shopify'; // Removido ShopifyProductPriceFilter
import ProductList from '../../components/shop/ProductList'; // Importar ProductList
import Link from 'next/link';
// Componentes de Paginação removidos
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Se precisar de um botão de fechar explícito
} from '../../components/ui/sheet';
import FiltersSidebarContent from '../../components/shop/FiltersSidebarContent';
import { Button } from '../../components/ui/button'; // Para o botão de trigger
import { FilterIcon, HomeIcon } from 'lucide-react'; // Ícone para o botão
import SortSelect from '../../components/shop/SortSelect'; // Importar o novo componente

const ITEMS_PER_PAGE = 12; // Defina quantos produtos por página

export const revalidate = 60; // ISR: revalida a cada 60 segundos

// Função para mapear o valor do parâmetro de ordenação da URL para sortKey e reverse
const getSortOptionsFromParam = (sortParam?: string | string[]): { sortKey?: string; reverse?: boolean } => {
  const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;
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
      return { sortKey: 'CREATED_AT', reverse: true };
    case 'created-asc':
      return { sortKey: 'CREATED_AT', reverse: false };
    case 'featured':
    default:
      return { sortKey: 'RELEVANCE', reverse: false };
  }
};

// Reintroduzindo getPriceQueryFromParam para retornar string
const getPriceQueryFromParam = (priceRangeParam?: string | string[]): string | undefined => {
  const priceRangeValue = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;
  if (!priceRangeValue || priceRangeValue === 'any') {
    return undefined;
  }
  const parts = priceRangeValue.split('-');
  if (parts.length === 2) {
    if (parts[0] === '0') return `variants.price:<=${parts[1]}`; 
    if (parts[1] === undefined || parts[1] === '+') return `variants.price:>=${parts[0]}`; 
    return `(variants.price:>=${parts[0]} AND variants.price:<=${parts[1]})`; 
  } else if (priceRangeValue.endsWith('+')) {
    const min = priceRangeValue.slice(0, -1);
    return `variants.price:>=${min}`; 
  }
  console.warn(`[ShopPage] Faixa de preço desconhecida para query string: ${priceRangeValue}`);
  return undefined;
};

// Função getPriceFilterObjectFromParam REMOVIDA - Voltaremos a usar getPriceQueryFromParam

interface ShopPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const afterCursor = typeof searchParams?.after === 'string' ? searchParams.after : null;
  const beforeCursor = typeof searchParams?.before === 'string' ? searchParams.before : null;

  interface ProductRequestParams {
    first?: number;
    last?: number;
    after?: string | null;
    before?: string | null;
    sortKey?: string;
    reverse?: boolean;
    query?: string; // Reintroduzido para conter preço e outras queries textuais
    tags?: string[];
    // priceFiltersArray?: ShopifyProductPriceFilter[]; // REMOVIDO
    // productTypes?: string[]; // Removido
  }

  const sortParam = searchParams?.sort;
  const priceRangeParam = searchParams?.priceRange;

  // Leitura robusta de tagsParamValue
  const tagsParamValue = searchParams?.tag; // Assumindo que o parâmetro da URL será 'tag'
  let tagsForApi: string[] | undefined = undefined;
  if (typeof tagsParamValue === 'string') {
    tagsForApi = [tagsParamValue]; 
  } else if (Array.isArray(tagsParamValue)) {
    tagsForApi = tagsParamValue; 
  }

  // Leitura robusta de productTypesParamValue - REMOVIDO
  // const productTypesParamValue = searchParams?.product_type;
  // let productTypesForApi: string[] | undefined = undefined;
  // if (typeof productTypesParamValue === 'string') {
  //   productTypesForApi = [productTypesParamValue];
  // } else if (Array.isArray(productTypesParamValue)) {
  //   productTypesForApi = productTypesParamValue;
  // }

  const { sortKey: initialSortKey, reverse: initialReverse } = getSortOptionsFromParam(sortParam);
  const priceQuery = getPriceQueryFromParam(priceRangeParam); // Voltamos a usar priceQuery (string)

  let effectiveSortKey = initialSortKey;
  let effectiveReverse = initialReverse;

  // Se um filtro de preço está ativo e a ordenação padrão é RELEVANCE,
  // RELEVANCE pode não funcionar bem com filtros de campo sem um termo de busca textual.
  // Altera para uma ordenação mais explícita (ex: Preço ASC) para garantir que o filtro de preço funcione.
  if (priceQuery && effectiveSortKey === 'RELEVANCE') { // Usar priceQuery
    effectiveSortKey = 'PRICE';
    effectiveReverse = false;
    // O SortSelect na UI continuará mostrando "Em destaque" a menos que seja atualizado para refletir essa mudança.
    // Para este fix, focamos na funcionalidade do filtro.
  }
  // A CHAVE '}' QUE ESTAVA AQUI FOI MOVIDA PARA O FINAL DA FUNÇÃO SHOPPAGE

console.log("[ShopPage] Generated priceQuery:", priceQuery);
// console.log("[ShopPage] Generated priceFilterObject:", priceFilterObject); // Removido
console.log("[ShopPage] Initial Sort options from URL:", { initialSortKey, initialReverse });
console.log("[ShopPage] Effective Sort options for API:", { sortKey: effectiveSortKey, reverse: effectiveReverse });

  let productParams: ProductRequestParams = { 
    first: ITEMS_PER_PAGE,
    sortKey: effectiveSortKey,
    reverse: effectiveReverse,
    query: priceQuery, // Passando a string de query de preço aqui
    tags: tagsForApi,
    // priceFiltersArray: priceFilterObject ? [priceFilterObject] : undefined, // REMOVIDO
    // productTypes: productTypesForApi, // Removido
  };

  if (afterCursor) {
    productParams.after = afterCursor;
    delete productParams.before;
    delete productParams.last;
  } else if (beforeCursor) {
    // Ajustar productParams para paginação para trás
    const baseParamsForPagination = {
      sortKey: effectiveSortKey,
      reverse: effectiveReverse,
      query: priceQuery,
      tags: tagsForApi,
      // priceFiltersArray: priceFilterObject ? [priceFilterObject] : undefined, // REMOVIDO
    };
    productParams = {
      last: ITEMS_PER_PAGE,
      before: beforeCursor,
      ...baseParamsForPagination
    };
    delete productParams.first;
    delete productParams.after; 
  }
  
  // Definindo cacheOptions para getProducts
  // const productCacheOptions: ShopifyFetchOptions['next'] = { revalidate: 60, tags: ['products', 'shop'] }; // Cache original comentado
  // FORÇAR NO-STORE PARA TESTE
  const productCacheOptionsTest: ShopifyFetchOptions = { cache: 'no-store' }; // Mantém a definição como ShopifyFetchOptions
  const productData: ProductsConnection = await getProducts(productParams, productCacheOptionsTest); // Agora getProducts espera ShopifyFetchOptions

  // Definindo cacheOptions para getCollections (pode usar o default da função ou ser explícito)
  const collectionCacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: ['collections'] }; // Exemplo: revalida a cada hora
  const collections: Collection[] = await getCollections(collectionCacheOptions);

  const initialProducts: Product[] = productData.edges.map(edge => edge.node);
  const initialPageInfo: PageInfo = productData.pageInfo;

  // Preparar baseQuery para ProductList
  const baseQueryForProductList: Record<string, string | boolean> = {};
  if (effectiveSortKey) baseQueryForProductList.sortKey = effectiveSortKey;
  if (effectiveReverse !== undefined) baseQueryForProductList.reverse = effectiveReverse;
  if (priceQuery) baseQueryForProductList.query = priceQuery; // Restaurado para passar a string de query de preço
  // if (priceRangeParam && priceRangeParam !== 'any') { // Removido, priceQuery já lida com isso
  //   baseQueryForProductList.priceRange = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;
  // }
  
  // Para tags e productTypes no baseQuery, passar a string original da URL (se existir)
  // ou juntar o array (se for array) para a API route que espera string separada por vírgula.
  if (tagsParamValue) {
    baseQueryForProductList.tags = Array.isArray(tagsParamValue) ? tagsParamValue.join(',') : tagsParamValue;
  }
  // if (productTypesParamValue) { // Removido
  //   baseQueryForProductList.productTypes = Array.isArray(productTypesParamValue) ? productTypesParamValue.join(',') : productTypesParamValue;
  // }
  
  baseQueryForProductList.first = String(ITEMS_PER_PAGE);


  // Lógica de buildPaginationLink e totalPages removida, pois será tratada pelo ProductList
  // Para uma paginação completa (1, 2, 3...), precisaríamos do total de produtos.
  // Por ora, vamos focar nos botões Previous/Next.
  // Se quisermos números de página, precisaríamos de uma query adicional para contar produtos,
  // o que pode não ser performático ou suportado diretamente para "todos os produtos".
  // Uma alternativa é buscar um número muito grande de produtos (ex: 99999) na primeira vez
  // e contar, mas isso é ineficiente.
  // Outra é, se a API permitir, uma query específica de contagem.
  // Shopify Admin API tem `productsCount`, mas Storefront é mais limitada.

  // Para este exemplo, vamos simular totalPages se tivéssemos um totalCount.
  // const totalProducts = ???; // Precisaria buscar este valor
  // const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  // const currentPage = ???; // Precisaria calcular com base no cursor 'after' ou 'before'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Cabeçalho da página - Responsivo */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Loja</h1>
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700] min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2" aria-label="Início">
            <HomeIcon className="h-4 w-4" />
          </Link>
          <span className="mx-1 sm:mx-2">/</span>
          <span>Loja</span>
        </div>
      </div>

      {/* Filtros e produtos */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Sidebar para Desktop */}
        <div className="hidden md:block w-full md:w-56 lg:w-64 flex-shrink-0">
          <FiltersSidebarContent 
            collections={collections} 
            currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
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
                      collections={collections} 
                      currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
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
          
          {/* Grid de produtos agora é gerenciado por ProductList */}
          {initialProducts.length > 0 ? (
            <ProductList
              initialProducts={initialProducts}
              initialPageInfo={initialPageInfo}
              baseQuery={baseQueryForProductList}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} // <<<<<< CHAVE DE FECHAMENTO CORRETA PARA A FUNÇÃO ShopPage
