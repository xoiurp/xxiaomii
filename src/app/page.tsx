"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from 'react';
import BannerSlider from "../components/layout/BannerSlider";
import CategorySlider from "../components/layout/CategorySlider";
import ProductCard from "../components/product/ProductCard";
import ExclusiveOffersSlider from '../components/ExclusiveOffersSlider';
import { getProducts, getCollections, Product, Collection } from "../lib/shopify";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNewsletterMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterMessage('Obrigado por se inscrever!');
        setNewsletterEmail('');
      } else if (response.status === 409) {
        setNewsletterMessage('Este e-mail já está cadastrado.');
      } else {
        setNewsletterMessage(data.message || 'Ocorreu um erro. Tente novamente.');
      }
    } catch (error) {
      setNewsletterMessage('Ocorreu um erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const prodsData = await getProducts({ first: 12 });
      const colls = await getCollections();
      if (prodsData && prodsData.edges) {
        setProducts(prodsData.edges.map(edge => edge.node));
      } else {
        setProducts([]);
      }
      setCollections(colls);
    }
    fetchData();
  }, []);

  // Substitui a categoria 'Smartphones' por 'Casa Inteligente' para o slider
  const collectionsForSlider = collections.map(c => {
    if (c.handle === 'smartphones') {
      return {
        ...c,
        title: 'Casa Inteligente',
        handle: 'casa-inteligente',
        image: {
          transformedSrc: '/assets/images/casainteligente .png',
          altText: 'Casa Inteligente'
        }
      };
    }
    return c;
  });

  return (
    <>
      <BannerSlider />
      
      {/* Benefícios rápidos - Responsivo */}
      <section className="w-full py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div className="flex flex-col items-center p-2 sm:p-4">
              <Image 
                src="/icons/Produto_Oficial.png" 
                alt="Produtos Oficiais" 
                width={48} 
                height={48} 
                className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4" 
              />
              <h3 className="text-section-sm md:text-section font-semibold">Produtos Oficiais</h3>
              <p className="text-caption md:text-body-sm text-gray-600 hidden sm:block">Revendedores Xiaomi Brasil.</p>
            </div>
            <div className="flex flex-col items-center p-2 sm:p-4">
              <Image 
                src="/icons/Garantia_Xiaomi.png" 
                alt="Garantia Xiaomi" 
                width={48} 
                height={48} 
                className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4" 
              />
              <h3 className="text-section-sm md:text-section font-semibold">Garantia Xiaomi</h3>
              <p className="text-caption md:text-body-sm text-gray-600 hidden sm:block">Em produtos adquiridos no site.</p>
            </div>
            <div className="flex flex-col items-center p-2 sm:p-4">
              <Image 
                src="/icons/Frete_gratis.png" 
                alt="Frete Grátis" 
                width={48} 
                height={48} 
                className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4" 
              />
              <h3 className="text-section-sm md:text-section font-semibold">*Frete Grátis</h3>
              <p className="text-caption md:text-body-sm text-gray-600 hidden sm:block">Compras acima de R$ 200.</p>
            </div>
            <div className="flex flex-col items-center p-2 sm:p-4">
              <Image 
                src="/icons/desconto_a_vista.png" 
                alt="8% de desconto à vista" 
                width={48} 
                height={48} 
                className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4" 
              />
              <h3 className="text-section-sm md:text-section font-semibold">**8% OFF à vista</h3>
              <p className="text-caption md:text-body-sm text-gray-600 hidden sm:block">Parcele em 12X sem juros</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ofertas Exclusivas */}
      <ExclusiveOffersSlider products={products} />

      {/* Categorias em destaque */}
      <CategorySlider categories={collectionsForSlider.slice(0, 6).map((c) => ({
        id: c.id,
        title: c.title,
        handle: c.handle,
        image: c.image ? { 
          transformedSrc: c.image.transformedSrc || c.image.originalSrc || "",
          altText: c.image.altText || c.title 
        } : undefined 
      }))} />
      
      {/* Container principal com padding responsivo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Produtos em destaque */}
        <section className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-section md:text-section-md font-semibold">Produtos em Destaque</h2>
            <Link
              href="/shop"
              className="text-[#FF6700] hover:underline text-nav md:text-nav-md min-h-[44px] flex items-center"
            >
              Ver todos
            </Link>
          </div>
          {/* Grid de produtos responsivo - 2 colunas em mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {products.slice(0, 8).map((product: Product) => {
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
                    transformedSrc: product.images.edges[0]?.node.transformedSrc || "",
                    altText: product.images.edges[0]?.node.altText || product.title,
                  }}
                  descricaoCurta={descricaoCurtaValue}
                  compareAtPrice={product.variants?.edges[0]?.node.compareAtPrice || undefined}
                  colors={product.variants?.edges.map(edge => edge.node.metafield?.value).filter((color): color is string => typeof color === 'string')}
                  totalStock={totalStock}
                  availableForSale={availableForSale}
                  isNew={isNew}
                  hasFreeShipping={hasFreeShipping}
                />
              );
            })}
          </div>
        </section>

        {/* Benefícios - Por que escolher */}
        <section className="mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-section md:text-section-md font-semibold mb-4 sm:mb-6 text-center">
            Por que escolher a Mi Brasil?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700] mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-section-sm md:text-section font-semibold mb-1 sm:mb-2">
                Parcele em até 12x sem juros
              </h3>
              <p className="text-body md:text-body-sm text-gray-600">
                Facilidade no pagamento com diversas opções de parcelamento.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700] mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h3 className="text-section-sm md:text-section font-semibold mb-1 sm:mb-2">
                Frete Grátis acima de R$200
              </h3>
              <p className="text-body md:text-body-sm text-gray-600">
                Entrega gratuita para compras acima de R$200 para todo o Brasil.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700] mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-section-sm md:text-section font-semibold mb-1 sm:mb-2">
                Garantia Xiaomi
              </h3>
              <p className="text-body md:text-body-sm text-gray-600">
                Produtos originais com garantia oficial da Xiaomi no Brasil.
              </p>
            </div>
          </div>
        </section>

        {/* Newsletter - Responsivo */}
        <section className="bg-[#FF6700] text-white rounded-lg p-6 sm:p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-hero-sm md:text-hero-md font-bold mb-3 sm:mb-4">
              Inscreva-se em nossa newsletter
            </h2>
            <p className="mb-4 sm:mb-6 text-body-sm md:text-body-md text-white/90">
              Receba as últimas novidades, lançamentos e ofertas exclusivas diretamente no seu e-mail.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-grow min-h-[48px] px-4 py-3 rounded-md bg-transparent text-white placeholder-white/80 border border-white focus:outline-none focus:ring-2 focus:ring-white text-body-sm md:text-body-md"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="min-h-[48px] bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-500 text-button md:text-button-sm active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Inscrever-se'}
              </button>
            </form>
            {newsletterMessage && (
              <p className="mt-3 sm:mt-4 text-caption md:text-caption-sm text-center">{newsletterMessage}</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
