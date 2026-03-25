import { NextRequest, NextResponse } from 'next/server';
import { 
  addToCart, 
  checkout, 
  generateLabels, 
  printLabels, 
  getCart, 
  removeFromCart,
  type CartItem 
} from '@/lib/melhorenvio';

// POST - Gerar etiquetas em lote
export async function POST(request: NextRequest) {
  try {
    const { action, orders, cartItems } = await request.json();

    switch (action) {
      case 'addToCart':
        if (!cartItems || !Array.isArray(cartItems)) {
          return NextResponse.json({ error: 'cartItems é obrigatório e deve ser um array' }, { status: 400 });
        }

        const cartResults = [];
        for (const item of cartItems) {
          try {
            const result = await addToCart(item as CartItem);
            cartResults.push({ success: true, data: result });
          } catch (error) {
            console.error('Erro ao adicionar item ao carrinho:', error);
            cartResults.push({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
          }
        }

        return NextResponse.json({ results: cartResults });

      case 'checkout':
        try {
          const checkoutResult = await checkout();
          return NextResponse.json({ success: true, data: checkoutResult });
        } catch (error) {
          console.error('Erro no checkout:', error);
          return NextResponse.json({ 
            error: 'Erro ao fazer checkout', 
            details: error instanceof Error ? error.message : 'Erro desconhecido' 
          }, { status: 500 });
        }

      case 'generateLabels':
        if (!orders || !Array.isArray(orders)) {
          return NextResponse.json({ error: 'orders é obrigatório e deve ser um array' }, { status: 400 });
        }

        try {
          const generateResult = await generateLabels(orders);
          return NextResponse.json({ success: true, data: generateResult });
        } catch (error) {
          console.error('Erro ao gerar etiquetas:', error);
          return NextResponse.json({ 
            error: 'Erro ao gerar etiquetas', 
            details: error instanceof Error ? error.message : 'Erro desconhecido' 
          }, { status: 500 });
        }

      case 'printLabels':
        if (!orders || !Array.isArray(orders)) {
          return NextResponse.json({ error: 'orders é obrigatório e deve ser um array' }, { status: 400 });
        }

        try {
          const printResult = await printLabels(orders);
          return NextResponse.json({ success: true, data: printResult });
        } catch (error) {
          console.error('Erro ao imprimir etiquetas:', error);
          return NextResponse.json({ 
            error: 'Erro ao imprimir etiquetas', 
            details: error instanceof Error ? error.message : 'Erro desconhecido' 
          }, { status: 500 });
        }

      case 'fullProcess':
        // Processo completo: adicionar ao carrinho -> checkout -> gerar -> imprimir
        if (!cartItems || !Array.isArray(cartItems)) {
          return NextResponse.json({ error: 'cartItems é obrigatório para o processo completo' }, { status: 400 });
        }

        try {
          console.log('Iniciando processo completo para', cartItems.length, 'itens');
          
          // 1. Limpar carrinho primeiro (opcional)
          try {
            const currentCart = await getCart();
            if (Array.isArray(currentCart) && currentCart.length > 0) {
              const idsToRemove = currentCart.map((item: any) => item.id);
              await removeFromCart(idsToRemove);
              console.log('Carrinho limpo com sucesso.');
            }
          } catch (error) {
            console.log('Carrinho já estava vazio ou erro ao limpar:', error);
          }

          // 2. Adicionar ao carrinho
          const addResults = [];
          for (const item of cartItems) {
            const result = await addToCart(item as CartItem);
            addResults.push(result);
          }

          console.log('Itens adicionados ao carrinho:', addResults.length);

          // 3. Verificar se há itens no carrinho
          const cartStatus = await getCart();
          console.log('Status do carrinho:', cartStatus);

          if (!cartStatus || (Array.isArray(cartStatus) && cartStatus.length === 0)) {
            throw new Error('Nenhum item foi adicionado ao carrinho');
          }

          return NextResponse.json({ 
            success: true, 
            data: {
              cart: cartStatus,
            },
            message: 'Itens adicionados ao carrinho do Melhor Envio com sucesso!'
          });
          
        } catch (error) {
          console.error('Erro no processo completo:', error);
          return NextResponse.json({ 
            error: 'Erro no processo completo de etiquetas', 
            details: error instanceof Error ? error.message : 'Erro desconhecido' 
          }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API de etiquetas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// GET - Obter informações do carrinho
export async function GET() {
  try {
    const cartData = await getCart();
    return NextResponse.json({ success: true, data: cartData });
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    return NextResponse.json({ 
      error: 'Erro ao obter carrinho', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// DELETE - Remover itens do carrinho
export async function DELETE(request: NextRequest) {
  try {
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({ error: 'orderIds é obrigatório e deve ser um array' }, { status: 400 });
    }

    const removeResult = await removeFromCart(orderIds);
    return NextResponse.json({ success: true, data: removeResult });
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error);
    return NextResponse.json({ 
      error: 'Erro ao remover do carrinho', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
} 