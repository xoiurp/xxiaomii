"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

// Intercepts generic checkout buttons in the DOM and redirects to internal checkout
export default function GlobalCheckoutInterceptor() {
  const { cart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const selectors = [
      'button[name="checkout"]',
      'input[name="checkout"]',
      '[href="/checkout"]',
      'form[action="/cart"] input[type="submit"]',
      'form[action="/cart"] button[type="submit"]',
      '.w-button[value="Finalizar Compra"]',
      'input[value="Finalizar Compra"]',
      'button.button-6',
      '[data-value="Finalizar Compra"]',
      'button, a'
    ];

    const onClick = (evt: Event) => {
      // Only act if the element resembles a checkout intent
      const target = evt.currentTarget as HTMLElement | null;
      const text = (target?.textContent || '').toLowerCase();
      const value = (target as HTMLInputElement)?.value?.toLowerCase?.() || '';
      const isCheckoutIntent =
        text.includes('finalizar compra') ||
        text.includes('checkout') ||
        value.includes('finalizar compra') ||
        value.includes('checkout');

      if (!isCheckoutIntent) return;
      if (!cart || cart.length === 0) {
        console.log('[Checkout Interceptor] Carrinho vazio, ignorando');
        return;
      }

      console.log('[Checkout Interceptor] Interceptando clique de checkout:', { text, value, cartItems: cart.length });

      evt.preventDefault();
      evt.stopPropagation();

      // Redirecionar para checkout interno
      console.log('[Checkout Interceptor] Redirecionando para checkout interno: /checkout');
      router.push('/checkout');
    };

    const attach = () => {
      const nodes = document.querySelectorAll(selectors.join(', '));
      nodes.forEach((node) => {
        // Avoid attaching multiple times
        const anyNode = node as any;
        if (anyNode.__checkoutAttached) return;
        node.addEventListener('click', onClick, { capture: true });
        anyNode.__checkoutAttached = true;
      });
    };

    attach();
    const t = setInterval(attach, 1000);
    return () => {
      clearInterval(t);
      const nodes = document.querySelectorAll(selectors.join(', '));
      nodes.forEach((node) => {
        node.removeEventListener('click', onClick, { capture: true } as any);
      });
    };
  }, [cart, router]);

  return null;
}
