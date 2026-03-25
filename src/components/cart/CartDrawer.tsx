'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { SheetClose } from '../ui/sheet';
import { Button } from '../ui/button';

const CartDrawerContent: React.FC = () => {
  const router = useRouter();
  const { cart, totalItems, totalPrice, clearCart, selectedShipping, setCartSheetOpen } = useCart();

  // Função para formatar preço
  const formatPrice = (price: number | string, currencyCode: string = 'BRL') => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'Preço inválido';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(numericPrice);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      console.log('[CartDrawer] Carrinho vazio, não é possível fazer checkout');
      return;
    }

    console.log('[CartDrawer] Iniciando checkout interno com', cart.length, 'itens');
    
    // Fechar o drawer do carrinho
    setCartSheetOpen(false);
    
    // Redirecionar para checkout interno
    router.push('/checkout');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conteúdo do carrinho - Scroll responsivo */}
      <div className="flex-grow overflow-y-auto p-3 sm:p-4 overscroll-contain"> 
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-base sm:text-lg font-medium text-center">Seu carrinho está vazio</p>
            <p className="mt-2 text-sm sm:text-base text-center">
              Adicione produtos para continuar suas compras
            </p>
            <SheetClose asChild>
              <Button className="mt-4 sm:mt-6 min-h-[44px] px-6 py-3 bg-[#FF6700] text-white rounded-md hover:bg-[#E05A00] transition-colors text-sm sm:text-base font-medium">
                Continuar Comprando
              </Button>
            </SheetClose>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {cart.map((item) => (
              <CartItem key={item.variantId} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Rodapé do carrinho com resumo e botão de checkout */}
      {cart.length > 0 && (
        <div className="border-t p-3 sm:p-4 bg-gray-50 safe-area-inset-bottom">
          {/* Subtotal */}
          <div className="flex justify-between mb-2 text-sm sm:text-base font-medium">
            <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'}):</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          
          {/* Total com frete (se selecionado) */}
          {selectedShipping && (
            <div className="flex justify-between mb-2 text-sm sm:text-base font-semibold text-[#FF6700]">
              <span>Total:</span>
              <span>{formatPrice(totalPrice + parseFloat(selectedShipping.price))}</span>
            </div>
          )}
          
          {/* Informação de frete */}
          <div className="flex justify-between mb-3 sm:mb-4 text-xs sm:text-sm">
            <span className="text-gray-600">Frete:</span>
            {selectedShipping ? (
              <div className="text-right">
                <span className="font-medium text-gray-700">{formatPrice(selectedShipping.price)}</span>
                <div className="text-[10px] sm:text-xs text-gray-500">
                  {selectedShipping.name} ({selectedShipping.delivery_time} dias)
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Calculado no checkout</span>
            )}
          </div>
          
          {/* Botão de Finalizar Compra - Touch target 44px */}
          <button 
            onClick={handleCheckout} 
            className="w-full min-h-[48px] py-3 sm:py-3.5 bg-[#FF6700] text-white rounded-md hover:bg-[#E05A00] transition-colors font-medium text-sm sm:text-base active:scale-[0.98]"
          >
            Finalizar Compra
          </button>
          
          {/* Botão de Limpar Carrinho - Touch target 44px */}
          <button
            onClick={clearCart}
            className="w-full min-h-[44px] mt-2 py-2.5 text-gray-600 hover:text-gray-800 text-xs sm:text-sm font-medium transition-colors"
          >
            Limpar Carrinho
          </button>
        </div>
      )}
    </div>
  );
};

export default CartDrawerContent;
