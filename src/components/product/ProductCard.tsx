'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  title: string;
  handle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  image: {
    transformedSrc: string;
    altText: string | null;
  };
  descricaoCurta?: string;
  colors?: string[];
  totalStock?: number;
  availableForSale?: boolean;
  isNew?: boolean;
  hasFreeShipping?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  handle,
  price,
  compareAtPrice,
  image,
  descricaoCurta,
  colors,
  totalStock,
  availableForSale = true,
  isNew = false,
  hasFreeShipping = true,
}) => {
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Função para formatar preço
  const formatPrice = (amount: string, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  // Função para adicionar ao carrinho
  const handleAddToCart = () => {
    addToCart({
      id,
      title,
      price: parseFloat(price.amount),
      currencyCode: price.currencyCode,
      image: image.transformedSrc,
      variantId: id,
      productId: id,
      handle: handle,
      quantity: 1,
    });
  };

  // Calcular desconto
  const discountPercent = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)
    ? Math.round(
        ((parseFloat(compareAtPrice.amount) - parseFloat(price.amount)) /
          parseFloat(compareAtPrice.amount)) *
          100
      )
    : 0;

  return (
    <div 
      className="group bg-white overflow-visible relative flex flex-col transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] z-0 hover:z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container da imagem com badges e favorito */}
      <div className="relative">
        {/* Badges no topo */}
        <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            {hasFreeShipping && (
              <span className="bg-[#00D26A] text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                Frete Grátis
              </span>
            )}
            {isNew && (
              <span className="bg-white text-[#FF6700] text-[10px] font-semibold px-2 py-1 rounded-full border border-[#FF6700]">
                Lançamento
              </span>
            )}
          </div>
          
          {/* Botão de favorito - visível sempre no topo direito */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="pointer-events-auto p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            />
          </button>
        </div>

        {/* Imagem do produto com link para a página de detalhes */}
        <Link 
          href={`/product/${handle}`} 
          className="block relative aspect-[4/5] overflow-hidden bg-white"
        >
          {image.transformedSrc ? (
            <Image
              src={image.transformedSrc}
              alt={image.altText || title}
              fill
              sizes="(max-width: 375px) 50vw, (max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 sm:h-16 sm:w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 2z"
                />
              </svg>
            </div>
          )}
        </Link>
      </div>

      {/* Detalhes do produto */}
      <div className="p-3 flex flex-col bg-white">
        <Link href={`/product/${handle}`} className="block">
          {/* Título do produto */}
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 hover:text-[#FF6700] transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
        </Link>

        {/* Descrição curta */}
        {descricaoCurta && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {descricaoCurta}
          </p>
        )}

        {/* Cores das variantes */}
        {colors && colors.length > 0 && (
          <div className="flex items-center gap-1.5 my-2">
            {colors.slice(0, 4).map((color, index) => (
              <span
                key={index}
                className="block w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-[10px] text-gray-500">+{colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Preços */}
        <div className="pt-1">
          {compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount) && (
            <div className="text-xs text-gray-400 line-through mb-0.5">
              De {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </div>
          )}
          <div className="text-lg font-bold text-[#FF6700]">
            Por {formatPrice(price.amount, price.currencyCode)}
          </div>
          {discountPercent > 0 && (
            <div className="text-[11px] text-gray-500 mt-0.5">
              Com {discountPercent}% de desconto à vista
            </div>
          )}
        </div>
      </div>

      {/* Botão Comprar - aparece apenas no hover, posicionado absolutamente */}
      <div 
        className={`absolute left-0 right-0 bottom-0 p-3 bg-white transition-all duration-300 shadow-[0_-10px_20px_rgba(255,255,255,1)] ${
          isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{
          boxShadow: isHovered ? '0 -10px 20px rgba(255,255,255,0.95), 0 4px 20px rgba(0,0,0,0.12)' : 'none'
        }}
      >
        <button
          onClick={handleAddToCart}
          disabled={!availableForSale || totalStock === 0}
          className={`w-full py-2.5 px-4 rounded-full text-sm font-medium transition-all
            ${!availableForSale || totalStock === 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-[#FF6700] text-white hover:bg-[#e55a00] active:scale-[0.98]'
            }`}
        >
          {!availableForSale || totalStock === 0 ? 'Indisponível' : 'Comprar'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
