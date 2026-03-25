'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CartItem } from '../../context/CartContext'; // Importa o tipo CartItem

import { VariantOption } from '../../context/CartContext'; // Importar VariantOption

interface Product {
  id: string; // Geralmente o variantId
  title: string;
  price: number; // Preço atual da variante
  currencyCode: string;
  image: string; // Imagem da variante ou produto
  variantId: string | null; // Permitir null
  productId: string;
  handle: string; // Adicionado o handle do produto
  category?: string; // Categoria do produto (opcional)
  variantOptions?: VariantOption[]; // Opções selecionadas da variante (opcional)
  compareAtPrice?: { amount: string; currencyCode: string } | null; // Preço original (opcional)
  tags?: string[]; // Tags do produto (opcional)
}

interface AddToCartButtonProps {
  product: Product; // Agora product contém os campos opcionais
  quantity?: number;
  className?: string;
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  quantity = 1,
  className = '',
  disabled = false, // Receber e definir valor padrão
}) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    // Não fazer nada se o botão estiver desabilitado ou variantId for null
    if (disabled || !product.variantId) {
      console.warn("Tentativa de adicionar ao carrinho com botão desabilitado ou variantId nulo.");
      return;
    }

    setIsAdding(true);

    // Criar o objeto CartItem completo - Garantir que variantId é string aqui
    // Como verificamos !product.variantId acima, podemos usar type assertion aqui
    // Criar o objeto CartItem completo, incluindo os novos campos opcionais
    const itemToAdd: CartItem = {
      id: product.variantId as string, // Usar variantId como id principal do item no carrinho
      title: product.title,
      price: product.price,
      currencyCode: product.currencyCode,
      quantity: quantity,
      image: product.image,
      variantId: product.variantId as string,
      productId: product.productId,
      category: product.category, // Passar a categoria
      variantOptions: product.variantOptions, // Passar as opções da variante
      compareAtPrice: product.compareAtPrice, // Passar o preço original
      tags: product.tags, // Passar as tags
      handle: product.handle, // Adicionado o handle do produto
    };

    // Adicionar ao carrinho
    addToCart(itemToAdd);

    // A lógica de setTimeout e updateQuantity não é mais necessária aqui
    
    // Resetar o estado após um breve período
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding} // Usar a prop disabled E o estado isAdding
      className={`h-[55px] w-full max-w-[418px] font-bold flex justify-center items-center relative text-white text-sm border border-[#FF6700] bg-[#FF6700] rounded-[50px] transition duration-300 hover:bg-white hover:text-[#FF6700] ${
        (disabled || isAdding) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-[#FF6700] cursor-pointer' // Ajustar estilos de desabilitado
      } ${className}`}
    >
      {(isAdding) ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Adicionando...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Adicionar ao Carrinho
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
