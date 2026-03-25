# Notas de Integração - Sistema de Frete

## Fluxo de Geração de Etiquetas

### 1. Cálculo de Frete (Modal de Etiquetas)
Quando o modal de geração de etiquetas é aberto:

**Payload enviado para `/api/shipping/calculate`:**
```json
{
  "from": {
    "postal_code": "13802170"
  },
  "to": {
    "postal_code": "14096600"
  },
  "products": [
    {
      "id": "prod_1",
      "width": 12,
      "height": 2,
      "length": 17,
      "weight": 0.25,
      "insurance_value": 453,
      "quantity": 1
    }
  ],
  "options": {
    "receipt": false,
    "own_hand": false
  },
  "services": "2"  // Sempre SEDEX
}
```

### 2. Conversão de Pedidos
Após selecionar o serviço de frete, a API `/api/admin/shipping/convert` processa os pedidos:

**Dados importantes do pedido Shopify:**
- `lineItems.edges[].node.originalUnitPriceSet.presentmentMoney.amount`: Valor unitário do produto
- `totalPriceSet.presentmentMoney.amount`: Valor total do pedido (usado para seguro)
- `subtotalPriceSet.presentmentMoney.amount`: Subtotal sem frete
- `totalShippingPriceSet.presentmentMoney.amount`: Valor do frete cobrado

**Conversão para Melhor Envio:**
```json
{
  "products": [
    {
      "name": "Nome do Produto",
      "quantity": 1,
      "unitary_value": 453.00  // Vem de originalUnitPriceSet
    }
  ],
  "options": {
    "insurance_value": 453.00  // Vem de totalPriceSet
  }
}
```

## Observações Importantes

1. **Serviço de Frete**: Sempre usa o serviço "2" (SEDEX) para cotações
2. **Valor Unitário**: Extraído de `originalUnitPriceSet.presentmentMoney.amount`
3. **Valor do Seguro**: Baseado no valor total do pedido
4. **Frete Original**: O valor em `totalShippingPriceSet` representa o frete já cobrado do cliente no Shopify

## Campos do Pedido Shopify

```typescript
interface Order {
  // Valores monetários
  totalPriceSet: {
    presentmentMoney: {
      amount: string;      // Valor total do pedido
      currencyCode: string;
    }
  };
  subtotalPriceSet: {
    presentmentMoney: {
      amount: string;      // Subtotal sem frete
      currencyCode: string;
    }
  };
  totalShippingPriceSet?: {
    presentmentMoney: {
      amount: string;      // Valor do frete
      currencyCode: string;
    }
  };
  
  // Itens do pedido
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        originalUnitPriceSet: {
          presentmentMoney: {
            amount: string;  // Valor unitário do produto
            currencyCode: string;
          }
        };
      }
    }>
  };
}
```