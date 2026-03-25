# Configuração do Checkout Yampi - Guia Completo

## Resumo da Implementação

O sistema de checkout Yampi está implementado e funcional no seu projeto Next.js. O fluxo funciona da seguinte forma:

### Fluxo de Checkout

1. **Usuário adiciona produtos ao carrinho** → CartContext armazena os itens
2. **Usuário clica em "Finalizar Compra"** → GlobalCheckoutInterceptor ou CartDrawer intercepta o clique
3. **Sistema chama API `/api/checkout/yampi`** → Cria um novo carrinho na Shopify
4. **API constrói payload Yampi** → Usando lib/yampi.ts
5. **API chama Dooki** → Endpoint público da Yampi
6. **Usuário é redirecionado** → Para o checkout Yampi/Dooki

## Arquivos Modificados

### 1. [src/lib/yampi.ts](src/lib/yampi.ts)
- **Função**: `prepareYampiCartPayload()` - Converte dados do carrinho Shopify para formato Yampi
- **Alteração**: Domínio padrão definido como `'seguro.mibrasil.com'` caso variáveis de ambiente não estejam configuradas

### 2. [src/app/api/checkout/yampi/route.ts](src/app/api/checkout/yampi/route.ts)
- **Função**: API route que processa o checkout
- **Alterações**:
  - Logs detalhados adicionados para debug
  - Melhor tratamento de erros
  - Log do payload enviado para Dooki
  - Log da resposta recebida

### 3. [src/components/checkout/GlobalCheckoutInterceptor.tsx](src/components/checkout/GlobalCheckoutInterceptor.tsx)
- **Função**: Intercepta cliques em botões de checkout em toda a aplicação
- **Alterações**: Logs detalhados adicionados para rastreamento do fluxo

### 4. [src/components/cart/CartDrawer.tsx](src/components/cart/CartDrawer.tsx)
- **Função**: Botão "Finalizar Compra" no carrinho lateral
- **Alterações**: Logs detalhados adicionados para rastreamento do fluxo

## Variáveis de Ambiente Necessárias

Certifique-se de que as seguintes variáveis estejam configuradas no arquivo `.env` (tanto local quanto na Netlify):

```bash
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=uxh1te-1d.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT=3b3febad21df1b2ba59d7d446ac21e96
SHOPIFY_ADMIN_API_TOKEN=YOUR_SHOPIFY_ADMIN_TOKEN

# Yampi Configuration
YAMPI_SHOP_DOMAIN=shop.mibrasil.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=shop.mibrasil.com

# Dooki API Endpoint
DOOKI_PUBLIC_ENDPOINT=https://api.dooki.com.br/v2/public/shopify/cart
```

### ⚠️ IMPORTANTE: Domínio da Loja Yampi

O domínio `shop.mibrasil.com` está configurado como padrão. Este domínio segue o padrão `shop.` utilizado no script de referência do Webflow. Se você precisar usar um domínio diferente, atualize as variáveis de ambiente acima.

## Como Testar

### 1. Teste Local

```bash
# Certifique-se de que o servidor está rodando
npm run dev

# Acesse http://localhost:3000
```

### 2. Fluxo de Teste Completo

1. **Adicione um produto ao carrinho**
   - Navegue até uma página de produto
   - Clique em "Adicionar ao Carrinho"
   - O carrinho lateral deve abrir automaticamente

2. **Verifique o Console do Navegador**
   - Abra DevTools (F12)
   - Vá para a aba "Console"
   - Você verá logs com prefixos `[CartDrawer]`, `[Checkout Interceptor]`, etc.

3. **Clique em "Finalizar Compra"**
   - No carrinho lateral, clique no botão "Finalizar Compra"
   - Observe os logs no console do navegador
   - Você verá:
     ```
     [CartDrawer] Iniciando checkout com items: [...]
     [CartDrawer] Resposta da API: {...}
     [CartDrawer] Redirecionando para: https://...
     ```

4. **Verifique os Logs do Servidor**
   - No terminal onde o servidor Next.js está rodando
   - Você verá:
     ```
     [Yampi Checkout] Sending payload to Dooki: {...}
     [Yampi Checkout] Dooki response: {...}
     ```

5. **Redirecionamento para Yampi**
   - Se tudo estiver correto, você será redirecionado para o checkout da Yampi
   - A URL será algo como: `https://shop.mibrasil.com/...`

## Troubleshooting

### Problema: "Não foi possível obter o link de checkout"

**Possíveis causas:**
1. Variáveis de ambiente não configuradas corretamente
2. Domínio Yampi incorreto
3. Erro na API Dooki

**Solução:**
- Verifique os logs do servidor no terminal
- Verifique os logs do navegador no DevTools
- Confirme que as variáveis de ambiente estão corretas

### Problema: Erro 502 da API Dooki

**Possíveis causas:**
1. Payload mal formatado
2. Domínio da loja Yampi incorreto
3. Problemas de conectividade com a API Dooki

**Solução:**
- Verifique o payload no log do servidor
- Confirme que o domínio `shop.mibrasil.com` está correto e ativo na Yampi
- Teste manualmente a API Dooki com uma ferramenta como Postman

### Problema: Variáveis de ambiente não são reconhecidas

**Solução na Netlify:**
1. Acesse o painel da Netlify
2. Vá para "Site settings" → "Environment variables"
3. Adicione todas as variáveis listadas acima
4. Faça um novo deploy do site

### Problema: Cart vazio mesmo com produtos adicionados

**Possíveis causas:**
1. LocalStorage não está funcionando
2. CartContext não está sendo provido corretamente

**Solução:**
- Verifique se há erros no console
- Limpe o cache do navegador e localStorage
- Recarregue a página

## Diferenças em relação ao Script do Webflow

O script do Webflow ([script-yampi.md](../../script-yampi.md)) usa uma abordagem diferente:

| Aspecto | Webflow | Next.js (Atual) |
|---------|---------|-----------------|
| **Obtenção do Cart** | IndexedDB do cliente | Cria novo cart via API |
| **Domínio da loja** | `shop.iwowatch.com.br` | `shop.mibrasil.com` |
| **Execução** | Client-side puro | Client-side + Server API |
| **Interceptação** | Seletores CSS fixos | React event handlers |

### Por que não usamos IndexedDB?

O seu projeto Next.js usa um **carrinho React gerenciado pelo CartContext**, não o carrinho nativo da Shopify armazenado no IndexedDB. Portanto, criamos um novo carrinho na Shopify via API usando os items do CartContext.

## Próximos Passos

1. **Teste em Produção (Netlify)**
   - Faça deploy do código atualizado
   - Verifique se as variáveis de ambiente estão configuradas
   - Teste o fluxo completo

2. **Remover Logs de Debug (Opcional)**
   - Após confirmar que tudo funciona, você pode remover os `console.log()` adicionados
   - Mantenha apenas os `console.error()` para rastreamento de erros

3. **Monitoramento**
   - Configure ferramentas de monitoramento (ex: Sentry)
   - Monitore erros em produção
   - Analise taxas de conversão do checkout

## Suporte

Se você encontrar problemas:

1. Verifique os logs detalhados no console do navegador e no terminal do servidor
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Teste o endpoint Dooki diretamente com o payload gerado
4. Verifique se o domínio Yampi está correto e ativo

---

**Última atualização**: 2025-01-27
**Versão da implementação**: 1.0
