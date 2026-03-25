# API de Cálculo de Frete - Exemplos de Uso

## Endpoint
`POST /api/shipping/calculate`

## Formato Antigo (Compatível)
Apenas com CEP:
```json
{
  "cep": "14096600"
}
```

## Novo Formato (Completo)
Com payload detalhado:
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
      "id": "x",
      "width": 11,
      "height": 17,
      "length": 11,
      "weight": 0.3,
      "insurance_value": 10.1,
      "quantity": 1
    }
  ],
  "options": {
    "receipt": false,
    "own_hand": false
  },
  "services": "2"
}
```

## Parâmetros

### from (opcional)
- `postal_code`: CEP de origem (padrão: "13802170")

### to (obrigatório)
- `postal_code`: CEP de destino

### products (opcional)
Array de produtos com:
- `id`: Identificador único do produto
- `width`: Largura em cm
- `height`: Altura em cm
- `length`: Comprimento em cm
- `weight`: Peso em kg
- `insurance_value`: Valor do seguro
- `quantity`: Quantidade

### options (opcional)
- `receipt`: Aviso de recebimento (padrão: false)
- `own_hand`: Mão própria (padrão: false)

### services (opcional)
IDs dos serviços separados por vírgula:
- "1": PAC
- "2": SEDEX
- "3": SEDEX 10
- "4": SEDEX 12
- "5": SEDEX Hoje

## Exemplo de Resposta
```json
[
  {
    "id": 1,
    "name": "PAC",
    "price": "29.90",
    "currency": "R$",
    "delivery_time": 8,
    "company": {
      "id": 1,
      "name": "Correios",
      "picture": "https://..."
    }
  },
  {
    "id": 2,
    "name": "SEDEX",
    "price": "45.50",
    "currency": "R$",
    "delivery_time": 3,
    "company": {
      "id": 1,
      "name": "Correios",
      "picture": "https://..."
    }
  }
]
```

## Notas de Implementação

1. A API mantém compatibilidade com o formato antigo (apenas CEP)
2. Quando múltiplos produtos são enviados, as dimensões máximas são usadas e o peso é somado
3. O valor do seguro é calculado como a soma dos valores de todos os produtos
4. Se nenhum produto for especificado, dimensões padrão são utilizadas
5. O CEP de origem pode ser personalizado no payload