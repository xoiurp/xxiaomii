'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// ProductCard será renderizado dentro de ProductList
// import ProductCard from '../../components/product/ProductCard';
import ProductList from '../../components/shop/ProductList'; // Importar ProductList

// Importando a função de busca de produtos e tipos
import { searchProducts, Product, PageInfo, ShopifyFetchOptions } from '../../lib/shopify'; // Adicionar PageInfo e ShopifyFetchOptions
import { HomeIcon } from 'lucide-react'; // Importar HomeIcon

const ITEMS_PER_PAGE_SEARCH = 20; // Pode ser diferente de outras listagens

function SearchPageContent() {
  const searchParamsHook = useSearchParams(); // Renomeado para evitar conflito com a prop searchParams
  const query = searchParamsHook.get('q') || '';
  
  // Usar getAll para tags e productTypes, pois podem ser múltiplos
  const tagsArray = searchParamsHook.getAll('tag');
  // const productTypesArray = searchParamsHook.getAll('product_type'); // REMOVIDO

  // Para passar para searchProducts e baseQuery, precisamos de string[] ou string separada por vírgula
  // As API routes esperam strings separadas por vírgula para 'tags' e 'productTypes'
  const tagsParamString = tagsArray.length > 0 ? tagsArray.join(',') : undefined;
  // const productTypesParamString = productTypesArray.length > 0 ? productTypesArray.join(',') : undefined; // REMOVIDO
  
  const [products, setProducts] = useState<Product[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null); // Estado para pageInfo
  const [loading, setLoading] = useState(true); // Loading inicial da página
  const [searchTerm, setSearchTerm] = useState(query);

  // Buscar produtos quando a consulta mudar
  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) {
        setProducts([]);
        setPageInfo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageInfo(null); // Resetar pageInfo antes de nova busca
      try {
        // A função searchProducts em shopify.ts já usa shopifyFetch e tem cacheOptions default.
        // Para uma busca client-side, o cache do Next.js (revalidate, tags) não se aplica da mesma forma.
        // A chamada aqui não precisa passar cacheOptions explicitamente para o lado do servidor.
        const resultsConnection = await searchProducts({ 
          queryText: query, 
          first: ITEMS_PER_PAGE_SEARCH,
          tags: tagsArray.length > 0 ? tagsArray : undefined, // searchProducts espera string[]
          // productTypes: productTypesArray.length > 0 ? productTypesArray : undefined, // REMOVIDO
          // priceFilterString: construirPriceFilterStringSeNecessario(priceRangeParam),
        });
        
        if (resultsConnection.edges) {
          setProducts(resultsConnection.edges.map(edge => edge.node));
          setPageInfo(resultsConnection.pageInfo);
        } else {
          setProducts([]);
          setPageInfo({ hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null });
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProducts([]);
        setPageInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  // Função para lidar com a submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Atualizar a URL com o novo termo de busca
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchTerm);
    window.history.pushState({}, '', url.toString());

    // Recarregar a página para acionar a nova busca
    window.location.href = url.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Busca</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700]" aria-label="Início"> {/* Adicionado aria-label */}
            <HomeIcon className="h-4 w-4" /> {/* Ícone de casa */}
          </Link>
          <span className="mx-2">/</span>
          <span>Busca</span>
        </div>
      </div>

      {/* Formulário de busca */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="O que você está procurando?"
            className="flex-grow py-3 px-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-[#FF6700] text-white py-3 px-6 rounded-r-md hover:bg-[#E05A00] transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Resultados da busca */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6700]"></div>
            <p className="mt-4 text-gray-600">Buscando produtos...</p>
          </div>
        ) : (
          <>
            {query ? (
              <h2 className="text-xl font-semibold mb-6">
                {products.length > 0
                  ? `${products.length} resultados para "${query}"`
                  : `Nenhum resultado encontrado para "${query}"`}
              </h2>
            ) : (
              <h2 className="text-xl font-semibold mb-6">
                Digite um termo para buscar produtos
              </h2>
            )}

            {/* Usar ProductList se houver produtos iniciais e pageInfo */}
            {products.length > 0 && pageInfo ? (
              <ProductList
                initialProducts={products}
                initialPageInfo={pageInfo}
                baseQuery={{ 
                  queryText: query,
                  first: String(ITEMS_PER_PAGE_SEARCH),
                  ...(tagsParamString && { tags: tagsParamString }),
                  // ...(productTypesParamString && { productTypes: productTypesParamString }), // REMOVIDO
                  // ...(priceRangeParam && { priceRange: priceRangeParam }), // Se for implementar filtro de preço na busca
                }}
              />
            ) : query && !loading ? ( 
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Não encontramos produtos correspondentes à sua busca.
                </p>
                <p className="text-gray-500 mb-6">
                  Tente usar termos mais gerais ou verifique a ortografia.
                </p>
                <Link
                  href="/shop"
                  className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
                >
                  Ver todos os produtos
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Use a barra de busca acima para encontrar produtos.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6700]"></div><p className="mt-4 text-gray-600">Carregando busca...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
