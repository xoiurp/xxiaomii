import { NextResponse } from 'next/server';
import { 
  calculateShipment, 
  type ShippingResponse
} from '@/lib/melhorenvio';

interface Product {
  id: string;
  title: string;
  quantity: number;
  originalUnitPriceSet?: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface Order {
  id: string;
  name: string;
  shippingAddress?: {
    zip: string;
    city: string;
    province: string;
  };
  totalPriceSet: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  totalShippingPriceSet?: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  lineItems?: {
    edges?: Array<{
      node: Product;
    }>;
  };
}

interface CalculateBatchRequest {
  orders: Order[];
  fromPostalCode?: string;
}

interface OrderShippingResult {
  orderId: string;
  orderName: string;
  shippingPaidByCustomer: number;
  shippingOptions: ShippingResponse[];
  recommendedService?: {
    id: number;
    name: string;
    price: string;
    difference: number; // Diferença entre o valor pago e o calculado
  };
}

export async function POST(request: Request) {
  try {
    const { orders, fromPostalCode = '13802170' } = (await request.json()) as CalculateBatchRequest;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Nenhum pedido fornecido.' }, { status: 400 });
    }

    const results: OrderShippingResult[] = [];

    // Processar cada pedido individualmente
    for (const order of orders) {
      try {
        if (!order.shippingAddress?.zip) {
          results.push({
            orderId: order.id,
            orderName: order.name,
            shippingPaidByCustomer: 0,
            shippingOptions: [],
            recommendedService: undefined
          });
          continue;
        }

        // Calcular dimensões e peso baseado nos produtos
        let totalWeight = 0;
        let maxWidth = 12; // valores padrão
        let maxHeight = 2;
        let maxLength = 17;
        let totalInsuranceValue = 0;

        if (order.lineItems?.edges) {
          order.lineItems.edges.forEach(edge => {
            const product = edge.node;
            const quantity = product.quantity || 1;
            
            // Por enquanto usar valores padrão de dimensões
            // TODO: Buscar dimensões reais dos produtos
            totalWeight += 0.25 * quantity;
            
            // Usar o valor unitário do produto
            if (product.originalUnitPriceSet) {
              const unitPrice = parseFloat(product.originalUnitPriceSet.presentmentMoney.amount);
              totalInsuranceValue += unitPrice * quantity;
            }
          });
        }

        // Se não calculou peso, usar padrão
        if (totalWeight === 0) {
          totalWeight = 0.25;
        }

        // Se não calculou valor do seguro, usar o total do pedido
        if (totalInsuranceValue === 0) {
          totalInsuranceValue = parseFloat(order.totalPriceSet.presentmentMoney.amount);
        }

        // Montar payload para cálculo
        const melhorEnvioPayload = {
          from: { postal_code: fromPostalCode.replace('-', '') },
          to: { postal_code: order.shippingAddress.zip.replace('-', '') },
          volumes: [{
            width: maxWidth,
            height: maxHeight,
            length: maxLength,
            weight: totalWeight
          }],
          options: {
            insurance_value: totalInsuranceValue,
            receipt: false,
            own_hand: false
          },
          services: "1,2,3" // PAC, SEDEX, SEDEX Hoje
        };

        console.log(`Calculando frete para pedido ${order.name}:`, melhorEnvioPayload);

        const shippingOptions = await calculateShipment(melhorEnvioPayload as any);
        
        // Filtrar opções válidas
        const validOptions = Array.isArray(shippingOptions) 
          ? shippingOptions.filter((option: any) => !option.error)
          : [];

        // Valor do frete pago pelo cliente
        const shippingPaidByCustomer = order.totalShippingPriceSet 
          ? parseFloat(order.totalShippingPriceSet.presentmentMoney.amount)
          : 0;

        // Encontrar o serviço com preço mais próximo ao pago pelo cliente
        let recommendedService;
        if (validOptions.length > 0 && shippingPaidByCustomer > 0) {
          recommendedService = validOptions.reduce((closest, current) => {
            const currentPrice = parseFloat(current.price);
            const closestPrice = parseFloat(closest.price);
            const currentDiff = Math.abs(currentPrice - shippingPaidByCustomer);
            const closestDiff = Math.abs(closestPrice - shippingPaidByCustomer);
            
            return currentDiff < closestDiff ? current : closest;
          });

          if (recommendedService) {
            recommendedService = {
              id: recommendedService.id,
              name: recommendedService.name,
              price: recommendedService.price,
              difference: parseFloat(recommendedService.price) - shippingPaidByCustomer
            };
          }
        }

        results.push({
          orderId: order.id,
          orderName: order.name,
          shippingPaidByCustomer,
          shippingOptions: validOptions,
          recommendedService
        });

      } catch (error) {
        console.error(`Erro ao calcular frete para pedido ${order.name}:`, error);
        results.push({
          orderId: order.id,
          orderName: order.name,
          shippingPaidByCustomer: order.totalShippingPriceSet 
            ? parseFloat(order.totalShippingPriceSet.presentmentMoney.amount)
            : 0,
          shippingOptions: [],
          recommendedService: undefined
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalOrders: orders.length,
        successfulCalculations: results.filter(r => r.shippingOptions.length > 0).length,
        totalShippingPaid: results.reduce((sum, r) => sum + r.shippingPaidByCustomer, 0)
      }
    });

  } catch (error: any) {
    console.error('Erro ao calcular frete em lote:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao calcular frete em lote', 
        details: error?.message || 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
}