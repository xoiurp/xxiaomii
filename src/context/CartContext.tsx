'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definindo os tipos
// Definindo os tipos
export interface VariantOption {
  name: string;
  value: string;
}

export interface CartItem {
  id: string; // Geralmente o variantId
  title: string;
  price: number; // Preço atual da variante
  currencyCode: string;
  quantity: number;
  image: string; // Imagem da variante ou produto
  variantId: string;
  productId: string;
  handle: string; // Adicionado o handle do produto
  category?: string; // Categoria do produto (opcional)
  variantOptions?: VariantOption[]; // Opções selecionadas da variante (opcional)
  compareAtPrice?: { amount: string; currencyCode: string } | null; // Preço original (opcional)
  tags?: string[]; // Tags do produto (opcional)
}
export interface ShippingOption {
  id: number;
  name: string;
  price: string;
  delivery_time?: number;
  delivery_min?: number;
  delivery_max?: number;
  company?: {
    id: number;
    name: string;
    picture: string;
  };
}


interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void; // Aceita o item completo com quantidade
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartSheetOpen: boolean; // Renomeado
  setCartSheetOpen: (isOpen: boolean) => void; // Nova função para controle explícito
  toggleCartSheet: () => void; // Renomeado
  totalItems: number;
  totalPrice: number;
  selectedShipping: ShippingOption | null;
  setSelectedShipping: (option: ShippingOption | null) => void;
}

// Criando o contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}

// Provedor do contexto
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  // Estado para o carrinho
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartSheetOpen, setCartSheetOpen] = useState(false); // Renomeado e função de set direta
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  // Carregar carrinho do localStorage ao iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
      }
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Adicionar item ao carrinho (com quantidade específica)
  // Adicionar item ao carrinho (com quantidade e dados adicionais)
  const addToCart = (itemToAdd: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.variantId === itemToAdd.variantId
      );

      if (existingItemIndex >= 0) {
        // Se existe, atualiza a quantidade
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += itemToAdd.quantity;
        // Opcional: Atualizar outros dados se necessário (ex: preço pode mudar?)
        // updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], ...itemToAdd, quantity: updatedCart[existingItemIndex].quantity + itemToAdd.quantity };
        return updatedCart;
      } else {
        // Se não existe, adiciona o novo item completo
        return [...prevCart, itemToAdd];
      }
    });
    
    // Abrir o carrinho (Sheet) quando um item é adicionado
    setCartSheetOpen(true);
  };

  // Remover item do carrinho
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Atualizar quantidade de um item
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Limpar o carrinho
  const clearCart = () => {
    setCart([]);
  };

  // Alternar visibilidade do carrinho (Sheet)
  const toggleCartSheet = () => {
    setCartSheetOpen((prev) => !prev);
  };

  // Calcular total de itens
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Calcular preço total
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Valor do contexto
  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartSheetOpen, // Renomeado
    setCartSheetOpen, // Adicionado
    toggleCartSheet, // Renomeado
    totalItems,
    totalPrice,
    selectedShipping,
    setSelectedShipping,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
