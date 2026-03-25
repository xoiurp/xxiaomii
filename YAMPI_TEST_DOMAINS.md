# Teste de Domínios Yampi - Guia de Testes

## Domínios para Testar (em ordem)

Baseado nas configurações da sua conta Yampi, teste cada um destes domínios:

### 1. Alias da Loja (ATUAL)
```bash
YAMPI_SHOP_DOMAIN=mibrasil3
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=mibrasil3
```
**Status**: Em teste
**Baseado em**: Credenciais de API → Alias

---

### 2. Domínio Principal Configurado
```bash
YAMPI_SHOP_DOMAIN=shop.mibrasil.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=shop.mibrasil.com
```
**Status**: Testado - Merchant not found
**Baseado em**: Domínios → Loja virtual (Principal)

---

### 3. Domínio Shopify Direto
```bash
YAMPI_SHOP_DOMAIN=uxh1te-1d.myshopify.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=uxh1te-1d.myshopify.com
```
**Status**: Não testado
**Baseado em**: Integração Shopify → URL original da sua loja Shopify

---

### 4. Domínio Sem Subdomínio
```bash
YAMPI_SHOP_DOMAIN=mibrasil.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=mibrasil.com
```
**Status**: Testado - Merchant not found
**Baseado em**: Domínio raiz

---

### 5. Domínio de Checkout Seguro
```bash
YAMPI_SHOP_DOMAIN=seguro.mibrasil.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=seguro.mibrasil.com
```
**Status**: Testado - Merchant not found
**Baseado em**: Link de compra do checkout

---

## Informações Importantes

### O que sabemos até agora:

1. ✅ A integração está funcionando corretamente
2. ✅ O payload está sendo montado corretamente
3. ✅ A Shopify está respondendo e criando o cart
4. ✅ A requisição chega na API Dooki
5. ❌ A Dooki retorna "Merchant not found" - não reconhece o identificador

### Webhooks Yampi encontrados:

```
https://pay.yampi.com.br/postbacks/gateways/appmax?store_token=icpdwOc05WtmB52EvqcAwH5JbuPtYbJqiOvjSk80
```

Isso sugere que a Yampi pode usar um `store_token` interno.

## Próximos Passos se Todos os Domínios Falharem

1. **Entre em contato com o suporte da Yampi** e pergunte:
   - Qual é o identificador correto para usar na API Dooki/Shopify Cart?
   - Como configurar a integração com Shopify Headless (Next.js)?
   - Se existe algum passo de ativação que falta

2. **Perguntas específicas para o suporte:**
   ```
   Olá, estou integrando minha loja Shopify (uxh1te-1d.myshopify.com)
   com a API pública da Dooki para checkout Yampi em um projeto Next.js.

   Estou recebendo o erro "Merchant not found" ao chamar:
   POST https://api.dooki.com.br/v2/public/shopify/cart

   Payload enviado:
   {
     "shop": "???", // Qual valor devo usar aqui?
     "cart_payload": { ... }
   }

   Já tentei:
   - mibrasil3 (alias da API)
   - shop.mibrasil.com
   - uxh1te-1d.myshopify.com

   Qual é o identificador correto para o campo "shop"?
   ```

3. **Verificar se a integração Shopify está completa:**
   - No painel Yampi → Integrações → Shopify
   - Confirme que está "Sincronizar automaticamente: ATIVA"
   - Verifique se há algum status de "Configuração incompleta"

## Teste Direto da API Dooki

Você pode testar manualmente com cURL para isolar o problema:

```bash
curl -X POST https://api.dooki.com.br/v2/public/shopify/cart \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "mibrasil3",
    "cart_payload": {
      "token": "test-token",
      "items": [],
      "total_price": 0
    }
  }'
```

Teste com diferentes valores de "shop":
- `mibrasil3`
- `shop.mibrasil.com`
- `uxh1te-1d.myshopify.com`

Se algum retornar algo diferente de "Merchant not found", esse é o correto.

---

**Última atualização**: Testando alias `mibrasil3`
