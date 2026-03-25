'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, PageInfo } from '@/lib/shopify';
import ProductCard from '@/components/product/ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton'; // Importar o skeleton

interface ProductListProps {
  initialProducts: Product[];
  initialPageInfo: PageInfo;
  baseQuery?: Record<string, any>; // Para passar filtros, sortKey, etc., para a API Route
  collectionHandle?: string; // Nova prop para o handle da coleção
}

const ProductList: React.FC<ProductListProps> = ({ initialProducts, initialPageInfo, baseQuery = {}, collectionHandle }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null); // Ref para o elemento observável

  const hasMoreProducts = pageInfo.hasNextPage;

  // useEffect para atualizar o estado quando as props iniciais mudarem (novos filtros aplicados)
  useEffect(() => {
    console.log('[ProductList] Props initialProducts ou initialPageInfo mudaram. Atualizando estado.');
    console.log('[ProductList] Novos initialProducts:', initialProducts);
    console.log('[ProductList] Novo initialPageInfo:', initialPageInfo);
    setProducts(initialProducts);
    setPageInfo(initialPageInfo);
    // Quando os filtros mudam, queremos que o scroll infinito recomece do zero para a nova lista.
    // O IntersectionObserver será reconfigurado pelo useEffect abaixo devido à mudança em pageInfo/hasMoreProducts.
  }, [initialProducts, initialPageInfo]);

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMoreProducts || !pageInfo.endCursor) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        after: pageInfo.endCursor!, // Adicionando non-null assertion, pois é verificado antes
        ...baseQuery, 
      });

      let apiUrl = '/api/products';
      if (collectionHandle) {
        apiUrl = `/api/collections/${collectionHandle}/products`;
      }
      
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar mais produtos: ${response.statusText} (URL: ${apiUrl}?${params.toString()})`);
      }
      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Erro desconhecido ao buscar produtos.');
      }
      
      const newProducts = data.productsConnection.edges.map((edge: { node: Product }) => edge.node);
      
      setProducts((prevProducts) => [...prevProducts, ...newProducts]);
      setPageInfo(data.productsConnection.pageInfo);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMoreProducts, pageInfo.endCursor, baseQuery, collectionHandle]); // Adicionado collectionHandle às dependências

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver( (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !loading) {
          loadMoreProducts();
        }
      },
      { threshold: 1.0 } // Pode ajustar o threshold
    );

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMoreProducts, hasMoreProducts, loading]);

  return (
    <div>
      {/* Grid responsivo: 2 colunas mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {products.map((product) => {
          // Extraindo o valor do metafield
          const descricaoCurtaValue = product.metafield?.value;
          
          // Calcular estoque total somando quantityAvailable de todas as variantes
          const totalStock = product.variants?.edges.reduce((total, edge) => {
            const qty = edge.node.quantityAvailable;
            return total + (typeof qty === 'number' ? qty : 0);
          }, 0) ?? undefined;
          
          // Verificar se pelo menos uma variante está disponível para venda
          const availableForSale = product.variants?.edges.some(edge => edge.node.availableForSale) ?? true;
          
          // Verificar tags para badges
          const tags = product.tags || [];
          const isNew = tags.some(tag => 
            tag.toLowerCase().includes('lançamento') || 
            tag.toLowerCase().includes('lancamento') || 
            tag.toLowerCase().includes('novo') || 
            tag.toLowerCase().includes('new')
          );
          const hasFreeShipping = tags.some(tag => 
            tag.toLowerCase().includes('frete grátis') || 
            tag.toLowerCase().includes('frete gratis') || 
            tag.toLowerCase().includes('free shipping')
          );
          
          console.log(`[ProductList] Produto: ${product.title}, estoque: ${totalStock}, disponível: ${availableForSale}`);

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              handle={product.handle}
              price={{
                amount: product.priceRange.minVariantPrice.amount,
                currencyCode: product.priceRange.minVariantPrice.currencyCode,
              }}
              image={{
                transformedSrc: product.images.edges[0]?.node.transformedSrc || '',
                altText: product.images.edges[0]?.node.altText || product.title,
              }}
              // Mapeando novos campos
              descricaoCurta={descricaoCurtaValue}
              compareAtPrice={product.variants?.edges[0]?.node.compareAtPrice || undefined} // Pega o compareAtPrice da primeira variante
              colors={product.variants?.edges.map(edge => edge.node.metafield?.value).filter((color): color is string => typeof color === 'string')} // Extrai cores das variantes
              totalStock={totalStock}
              availableForSale={availableForSale}
              isNew={isNew}
              hasFreeShipping={hasFreeShipping}
            />
          );
        })}
        {/* Exibir skeletons durante o carregamento */}
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <ProductCardSkeleton key={`skeleton-loading-${index}`} />
          ))
        }
      </div>

      {/* Elemento observável para carregar mais */}
      <div ref={loadMoreRef} style={{ height: '1px', marginTop: '20px' }}> {/* Altura mínima para ser observável */}
        {loading && (
          <div className="text-center py-4 col-span-full"> {/* Ocupa toda a largura do grid */}
            {/* Poderia adicionar um spinner aqui se desejado, mas os skeletons já indicam carregamento */}
            <p className="text-gray-500">Carregando mais produtos...</p>
          </div>
        )}
        {/* {!hasMoreProducts && products.length > 0 && !loading && (
          <div className="text-center py-4">
            <p>Você chegou ao fim da lista.</p>
          </div>
        )} */}
      </div>
      {error && (
        <div className="text-center py-4 text-red-500">
          <p>Erro ao carregar produtos: {error}</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
