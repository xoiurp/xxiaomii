import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getProductByHandle, getProducts } from '@/lib/shopify'; // Adicionado getProducts
import ProductClientDetails from '@/components/product/ProductClientDetails';
import { Product } from '@/lib/shopify'; // Importar o tipo Product se necessário para generateStaticParams

export const revalidate = 300; // ISR: revalida a cada 5 minutos
export const dynamicParams = true; // Permite gerar páginas para produtos não incluídos no build

// Função para gerar caminhos estáticos
export async function generateStaticParams() {
  // Buscar um número limitado de produtos para gerar os caminhos mais comuns
  // Em um cenário real, você pode querer buscar todos ou os mais populares
  const productsData = await getProducts({ first: 150 }); // Gera 150 produtos mais populares no build
  
  if ('errors' in productsData || !productsData.edges) {
    console.error("Erro ao buscar produtos para generateStaticParams:", ('errors' in productsData) ? productsData.errors : "Edges não encontrados");
    return []; // Retorna array vazio em caso de erro para não quebrar o build
  }

  return productsData.edges.map((edge: { node: Product }) => ({
    handle: edge.node.handle,
  }));
}


// Função auxiliar para ler o conteúdo do CSS
async function getCssContent(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    console.log(`Tentando ler CSS de: ${fullPath}`);
    return await fs.promises.readFile(fullPath, 'utf8');
  } catch (error) {
    console.error(`Erro ao ler o arquivo CSS: ${filePath}`, error);
    return '';
  }
}

// export type ParamsType = Promise<{ handle: string }>; // Tipo incorreto para Server Component params
interface ProductPageParams {
  handle: string;
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { handle } = params; // Removido await

  // Passando cacheOptions explicitamente, embora getProductByHandle tenha defaults
  // A tag aqui ajuda na revalidação sob demanda se necessário
  const product = await getProductByHandle(handle, { revalidate: 300, tags: [`product:${handle}`] }); // Reintroduzido cacheOptions

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
        <p className="mb-8">O produto que você está procurando não existe ou foi removido.</p>
        <Link
          href="/shop"
          className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const formatPrice = (amount: string, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  // Ajustado para usar transformedSrc e altText
  const images = product.images.edges.map((edge) => ({
    transformedSrc: edge.node.transformedSrc,
    altText: edge.node.altText || product.title,
  }));

  const variants = product.variants?.edges.map((edge) => {
    // Tipagem explícita para node.image dentro de mediavariant
    const variantSpecificImages = edge.node.mediavariant?.references?.nodes
      ?.filter(node => node && node.image) // Garante que node e node.image existam
      .map(node => ({
        transformedSrc: node.image.transformedSrc, // Usa transformedSrc
        altText: node.image.altText || product.title, // Usa altText
      })) || [];

    return {
      ...edge.node,
      colorHex: edge.node.metafield?.value || null,
      variantImages: variantSpecificImages,
    };
  }) || [];
  

  const colorOptionsMap = new Map<string, string>();
  variants.forEach((variant: { selectedOptions: { name: string; value: string }[]; colorHex: string | null }) => {
    const colorOption = variant.selectedOptions.find(
      (option: { name: string }) => option.name.toLowerCase() === 'cor'
    );
    if (colorOption && colorOption.value && variant.colorHex && !colorOptionsMap.has(colorOption.value)) {
      colorOptionsMap.set(colorOption.value, variant.colorHex);
    }
  });

  const uniqueColors = Array.from(colorOptionsMap, ([name, hex]) => ({ name, hex }));

  // Ajustado para usar a nova estrutura de 'images'
  const mainImage = images[0] || { transformedSrc: '', altText: product.title };
  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  const desktopCss = await getCssContent('../main-desk-14c.css');
  const mobileCss = await getCssContent('../main-mob-14.css');

  return (
    <ProductClientDetails
      product={product}
      variants={variants}
      images={images}
      uniqueColors={uniqueColors}
      price={price}
      mainImage={mainImage}
      desktopCss={desktopCss}
      mobileCss={mobileCss}
    />
  );
}
