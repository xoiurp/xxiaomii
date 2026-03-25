'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Importar o componente Link
import { useCart, CartItem as CartItemType } from '../../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  // Função para formatar preço
  const formatPrice = (price: number, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  // Função para lidar com a mudança de quantidade (REMOVIDA - NÃO UTILIZADA)
  // const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const newQuantity = parseInt(e.target.value, 10);
  //   updateQuantity(item.id, newQuantity);
  // };

  return (
    <div className="flex py-4 border-b border-gray-100 last:border-b-0"> {/* Remove borda externa, adiciona borda inferior sutil */}
      {/* Link para a página do produto (envolve imagem e detalhes) */}
      <Link href={`/product/${item.handle}`} className="flex flex-grow">
        {/* Imagem do produto */}
        <div className="w-28 h-28 relative flex-shrink-0 bg-gray-50 rounded mr-4"> {/* Aumenta um pouco a imagem, fundo cinza claro */}
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="112px" // Ajusta o sizes
              className="object-contain p-1" // Menos padding
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {/* Placeholder SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Detalhes do produto */}
        <div className="flex-grow flex flex-col justify-between">
          {/* Informações Superiores */}
          <div>
            {item.category && (
              <p className="text-xs uppercase text-gray-500 mb-1">{item.category}</p>
            )}
            <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">{item.title}</h3>
            {item.variantOptions && item.variantOptions.length > 0 && (
              <p className="text-sm text-gray-600 mb-2">
                {item.variantOptions.map(opt => `${opt.name}: ${opt.value}`).join(' / ')}
              </p>
            )}
            {/* Tags/Badges (Exemplo) */}
            {item.tags && item.tags.length > 0 && (
              <div className="mb-2">
                {item.tags.slice(0, 2).map(tag => ( // Limita a 2 tags para não poluir
                  <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mr-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Linha Inferior: Quantidade (mantida dentro do link) */}
          <div className="flex justify-between items-end mt-2">
            {/* Controle de Quantidade +/- */}
            <div className="flex items-center border border-gray-200 rounded"> {/* Borda mais sutil */}
              <button
                onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity - 1); }} // Previne o comportamento padrão do link
                disabled={item.quantity <= 1}
                className="px-2 py-1 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded-l focus:outline-none focus:ring-1 focus:ring-gray-300" // Estilo mais sutil
                aria-label="Diminuir quantidade"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 border-l border-r border-gray-200 bg-white"> {/* Borda mais sutil */}
                {item.quantity}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity + 1); }} // Previne o comportamento padrão do link
                // Adicionar disabled={item.quantity >= MAX_QUANTITY} se houver um limite
                className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded-r focus:outline-none focus:ring-1 focus:ring-gray-300" // Estilo mais sutil
                aria-label="Aumentar quantidade"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {/* Preço (mantido dentro do link) */}
            <div className="text-right">
              {/* Verifica se compareAtPrice existe e se o valor é maior que o preço atual */}
              {item.compareAtPrice && parseFloat(item.compareAtPrice.amount) > item.price && (
                <div className="text-xs text-gray-400 line-through">
                  {/* Formata o compareAtPrice total (compareAtPrice.amount * quantity) */}
                  {formatPrice(parseFloat(item.compareAtPrice.amount) * item.quantity, item.compareAtPrice.currencyCode)}
                </div>
              )}
              <div className="text-base font-semibold text-gray-900"> {/* Tamanho de fonte ajustado */}
                {/* Formata o preço atual total (item.price * quantity) */}
                {formatPrice(item.price * item.quantity, item.currencyCode)}
              </div>
            </div>
          </div>
        </div>
      </Link> {/* Fecha o Link que envolve a imagem e detalhes */}

      {/* Botão Remover (fora do link) */}
      <div className="flex items-end ml-4"> {/* Adiciona margem à esquerda para separar */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-gray-400 hover:text-red-500" // Estilo minimalista
          aria-label="Remover item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> {/* Ícone mais fino */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
