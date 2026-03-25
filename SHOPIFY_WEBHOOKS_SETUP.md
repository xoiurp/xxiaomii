# Configuração de Webhooks Nativos da Shopify

Este guia explica como configurar **webhooks nativos** da Shopify para capturar dados de clientes e pedidos em tempo real, contornando as restrições de PII (Personally Identifiable Information) da Admin API.

## 🎯 Por que usar Webhooks Nativos?

A Shopify bloqueou o acesso a dados PII (nomes, emails, telefones, endereços) via Admin API em planos Basic/não-Plus. No entanto, **webhooks nativos ainda enviam dados completos** no momento da criação/atualização, antes das restrições de privacidade serem aplicadas.

### Vantagens:
- ✅ **Funciona em TODOS os planos** (Basic, Shopify, Advanced, Plus)
- ✅ Acesso a dados completos de clientes (firstName, lastName, email, phone)
- ✅ Dados de endereços (billingAddress, shippingAddress) completos
- ✅ Atualização em tempo real quando clientes/pedidos são criados
- ✅ Não depende de sincronizações manuais
- ✅ Gratuito - sem necessidade de apps adicionais

---

## 📋 Webhooks a Configurar

### 1. `customers/create`
**Endpoint:** `https://seudominio.com/api/webhooks/customers/create`

Disparado quando um novo cliente é criado na loja.

**Dados capturados:**
- first_name, last_name
- email, phone
- default_address (endereço completo)
- tags, note
- orders_count, total_spent
- marketing_consent

### 2. `customers/update`
**Endpoint:** `https://seudominio.com/api/webhooks/customers/update`

Disparado quando dados de um cliente são atualizados.

**Dados capturados:**
- Todos os mesmos campos de `customers/create`
- Atualiza registro existente ou cria novo se não existir

### 3. `orders/create`
**Endpoint:** `https://seudominio.com/api/webhooks/orders/create`

Disparado quando um novo pedido é criado.

**Dados capturados:**
- Dados do pedido (id, name, order_number, total_price, etc.)
- **billing_address** (inclui first_name, last_name do cliente)
- **shipping_address** (inclui first_name, last_name do cliente)
- line_items (produtos do pedido)
- shipping_lines (métodos de envio)
- Se houver dados de customer, também atualiza/cria o cliente
- **Salva pedido completo no banco de dados**

### 4. `orders/update`
**Endpoint:** `https://seudominio.com/api/webhooks/orders/update`

Disparado quando um pedido é atualizado (status, rastreio, fulfillment, etc.).

**Dados capturados:**
- Todas as atualizações do pedido
- **financial_status** (pending, paid, refunded, etc.)
- **fulfillment_status** (fulfilled, partial, null)
- **fulfillments** (informações de rastreio e envio)
- Atualiza dados do cliente se houver mudanças
- **Atualiza pedido no banco de dados**

---

## 🔧 Configuração no Painel Shopify

### Passo 1: Acessar Configurações de Webhooks

1. Acesse o painel admin da sua loja Shopify
2. Vá em **Settings** (Configurações) → **Notifications** (Notificações)
3. Role até a seção **Webhooks** (final da página)
4. Clique em **Create webhook** (Criar webhook)

### Passo 2: Webhook 1 - Clientes Criados

**Configuração:**

1. **Event:** Selecione `Customer creation`
2. **Format:** `JSON`
3. **URL:** `https://seudominio.com/api/webhooks/customers/create`
4. **API version:** `2025-01` (ou a versão mais recente disponível)
5. Clique em **Save webhook**

**IMPORTANTE:** Em desenvolvimento local, você precisará usar **ngrok** para expor seu localhost. A URL ficaria: `https://abc123.ngrok.io/api/webhooks/customers/create`

### Passo 3: Webhook 2 - Clientes Atualizados

**Configuração:**

1. Clique em **Create webhook** novamente
2. **Event:** Selecione `Customer update`
3. **Format:** `JSON`
4. **URL:** `https://seudominio.com/api/webhooks/customers/update`
5. **API version:** `2025-01`
6. Clique em **Save webhook**

### Passo 4: Webhook 3 - Pedidos Criados

**Configuração:**

1. Clique em **Create webhook** novamente
2. **Event:** Selecione `Order creation`
3. **Format:** `JSON`
4. **URL:** `https://seudominio.com/api/webhooks/orders/create`
5. **API version:** `2025-01`
6. Clique em **Save webhook**

### Passo 5: Webhook 4 - Pedidos Atualizados

**Configuração:**

1. Clique em **Create webhook** novamente
2. **Event:** Selecione `Order updated`
3. **Format:** `JSON`
4. **URL:** `https://seudominio.com/api/webhooks/orders/update`
5. **API version:** `2025-01`
6. Clique em **Save webhook**

**IMPORTANTE:** Este webhook captura mudanças de status financeiro, fulfillment, rastreio, cancelamentos, etc.

---

## 🔐 Configuração de Segurança (HMAC)

Os webhooks da Shopify incluem um header `X-Shopify-Hmac-SHA256` para validar a autenticidade.

### Adicione ao `.env`:

```bash
# Use o mesmo token do Admin API
SHOPIFY_WEBHOOK_SECRET=seu-admin-api-token-aqui

# OU crie um secret específico para webhooks
# SHOPIFY_WEBHOOK_SECRET=seu-secret-customizado
```

**IMPORTANTE:** O webhook secret é usado para validar a autenticidade dos webhooks via HMAC SHA256. Isso impede que terceiros enviem dados falsos para seus endpoints.

---

## 🌐 Desenvolvimento Local com ngrok

Para testar webhooks localmente, você precisa expor seu localhost para a internet:

### 1. Instalar ngrok

```bash
# Windows (via Chocolatey)
choco install ngrok

# Ou baixe de https://ngrok.com/download
```

### 2. Iniciar Next.js

```bash
npm run dev
# Servidor rodando em http://localhost:3000
```

### 3. Expor porta 3000 com ngrok

```bash
ngrok http 3000
```

Você verá algo como:
```
Session Status    online
Forwarding        https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Usar URL do ngrok nos Webhooks

Na configuração dos webhooks, use:
```
https://abc123.ngrok.io/api/webhooks/customers/create
https://abc123.ngrok.io/api/webhooks/customers/update
https://abc123.ngrok.io/api/webhooks/orders/create
```

**NOTA:** A URL do ngrok muda sempre que você reinicia. Você precisará atualizar os webhooks no painel Shopify.

**DICA:** Instale `ngrok` com conta gratuita para URLs fixas (não mudam ao reiniciar).

---

## 🧪 Testando Webhooks

### Método 1: Via Shopify Admin (Teste Simulado)

1. Vá em **Settings** → **Notifications** → **Webhooks**
2. Clique no webhook que deseja testar
3. Clique em **Send test notification**
4. Verifique os logs do seu servidor Next.js

**Logs esperados:**
```bash
📥 Webhook recebido - customers/create
✅ HMAC validado com sucesso
📦 Dados do webhook recebidos: {
  id: 9151137612005,
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe'
}
✅ Cliente salvo no banco de dados: {
  id: 'clxxx123',
  shopifyId: '9151137612005',
  name: 'John Doe',
  email: 'customer@example.com'
}
```

### Método 2: Criar Cliente Real

1. Vá em **Customers** → **Add customer**
2. Preencha os dados:
   - **First name:** `João`
   - **Last name:** `Silva`
   - **Email:** `joao@teste.com`
   - **Phone:** `+55 11 99999-9999`
3. Clique em **Save**
4. Verifique os logs do servidor

### Método 3: Criar Pedido Real

1. Vá em **Orders** → **Create order**
2. Adicione produtos
3. Adicione informações do cliente (ou selecione cliente existente)
4. Preencha endereço de cobrança e envio
5. Complete o pedido
6. Verifique os logs do servidor

---

## 📊 Verificando se Funciona

### 1. Verificar Logs do Servidor

No terminal onde o Next.js está rodando:

```bash
npm run dev
```

Você verá logs como:
```
📥 Webhook recebido - customers/create
✅ HMAC validado com sucesso
📦 Dados do webhook recebidos: { id: 123, email: 'test@example.com', ... }
✅ Cliente salvo no banco de dados: { ... }
```

### 2. Verificar Banco de Dados

```bash
# Abrir Prisma Studio
npx prisma studio
```

Ou query SQL direto:
```sql
SELECT "shopifyId", "firstName", "lastName", "email", "lastSyncAt"
FROM "shopify_customers"
ORDER BY "lastSyncAt" DESC
LIMIT 10;
```

### 3. Verificar Dashboard

Acesse `http://localhost:3000/admin/dashboard` e confirme:
- ✅ Os nomes dos clientes aparecem (não mais "Cliente sem nome")
- ✅ O contador de clientes aumentou
- ✅ Os dados estão atualizados

---

## 🚨 Problemas Comuns

### Problema 1: Webhook retorna 401 (Unauthorized)

**Causa:** HMAC inválido ou secret incorreto

**Solução:**
1. Verifique se `SHOPIFY_WEBHOOK_SECRET` está configurado no `.env`
2. Certifique-se de usar o mesmo token do Admin API
3. Reinicie o servidor Next.js após alterar o `.env`

```bash
# Parar servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### Problema 2: Webhook não é disparado

**Causa:** URL incorreta ou webhook não foi salvo

**Solução:**
1. Verifique se a URL está correta (deve ser HTTPS ou ngrok em dev)
2. Confirme que o webhook está **ativo** no painel Shopify
3. Teste com "Send test notification"
4. Em dev, confirme que o ngrok está rodando

### Problema 3: Servidor não recebe nada (ngrok)

**Causa:** ngrok não está rodando ou URL mudou

**Solução:**
1. Verifique se o ngrok está ativo:
   ```bash
   ngrok http 3000
   ```
2. Copie a nova URL do ngrok
3. Atualize todos os webhooks no painel Shopify com a nova URL

### Problema 4: Dados não aparecem no banco

**Causa:** Erro no processamento ou Prisma desconectado

**Solução:**
1. Verifique os logs do servidor para erros
2. Confirme que o Prisma está conectado:
   ```bash
   npx prisma db push
   ```
3. Teste a conexão:
   ```bash
   npx prisma studio
   ```

### Problema 5: firstName/lastName ainda null

**Causa:** Webhook não está enviando dados ou campos não estão no payload

**Solução:**
1. Verifique os logs para ver o payload completo do webhook
2. Confirme que o cliente tem first_name/last_name preenchidos no Shopify
3. Para pedidos, os dados vêm em `billing_address.first_name` e `shipping_address.first_name`
4. Teste com "Send test notification" para ver dados de exemplo

---

## 🔄 Sincronização de Clientes Existentes

Os webhooks só capturam **novos** eventos (criação/atualização). Para clientes existentes antes de configurar webhooks:

### Opção 1: Atualização Manual

1. Vá em **Customers** no painel Shopify
2. Abra cada cliente existente
3. Faça uma pequena alteração (ex: adicionar tag "synced")
4. Salve o cliente
5. O webhook `customers/update` será disparado

### Opção 2: Atualização em Massa via Tags

1. Selecione múltiplos clientes
2. Clique em **More actions** → **Add tags**
3. Adicione uma tag (ex: "webhook-sync")
4. Isso dispara o webhook `customers/update` para cada cliente

### Opção 3: Script de Atualização (Bulk Edit)

Use o app **Bulk Product Edit** (gratuito) ou similar:
1. Instale app de edição em massa
2. Selecione todos os clientes
3. Adicione uma tag ou faça alteração em massa
4. Cada atualização dispara o webhook

### Opção 4: API Sync Manual (fallback)

Para clientes que nunca passaram pelo webhook, use o endpoint de sincronização manual:

```bash
GET /api/admin/customers/sync
```

**NOTA:** Este método pode não retornar firstName/lastName devido às restrições de PII, mas captura outros dados.

---

## 📝 Exemplo de Payload de Webhook

### customers/create

```json
{
  "id": 9151137612005,
  "email": "joao@teste.com",
  "first_name": "João",
  "last_name": "Silva",
  "phone": "+5511999999999",
  "created_at": "2025-01-21T10:30:00-03:00",
  "updated_at": "2025-01-21T10:30:00-03:00",
  "orders_count": 0,
  "total_spent": "0.00",
  "tags": "",
  "state": "enabled",
  "verified_email": true,
  "accepts_marketing": false,
  "email_marketing_consent": {
    "state": "not_subscribed",
    "opt_in_level": "single_opt_in"
  },
  "default_address": {
    "id": 123456789,
    "first_name": "João",
    "last_name": "Silva",
    "address1": "Rua Exemplo, 123",
    "address2": "Apto 45",
    "city": "São Paulo",
    "province": "SP",
    "province_code": "SP",
    "country": "Brazil",
    "country_code": "BR",
    "zip": "01234-567",
    "phone": "+5511999999999",
    "company": null
  },
  "addresses": [
    {
      "id": 123456789,
      "first_name": "João",
      "last_name": "Silva",
      "address1": "Rua Exemplo, 123",
      "city": "São Paulo",
      "province": "SP",
      "country": "Brazil",
      "zip": "01234-567",
      "phone": "+5511999999999"
    }
  ]
}
```

### orders/create

```json
{
  "id": 5678901234567,
  "name": "#1001",
  "order_number": 1001,
  "email": "joao@teste.com",
  "phone": "+5511999999999",
  "created_at": "2025-01-21T11:00:00-03:00",
  "updated_at": "2025-01-21T11:00:00-03:00",
  "total_price": "150.00",
  "subtotal_price": "120.00",
  "total_tax": "10.00",
  "total_discounts": "0.00",
  "currency": "BRL",
  "financial_status": "paid",
  "fulfillment_status": null,
  "customer": {
    "id": 9151137612005,
    "email": "joao@teste.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999999999",
    "orders_count": 1,
    "total_spent": "150.00"
  },
  "billing_address": {
    "first_name": "João",
    "last_name": "Silva",
    "address1": "Rua Exemplo, 123",
    "address2": null,
    "city": "São Paulo",
    "province": "São Paulo",
    "province_code": "SP",
    "country": "Brazil",
    "country_code": "BR",
    "zip": "01234-567",
    "phone": "+5511999999999",
    "company": null
  },
  "shipping_address": {
    "first_name": "João",
    "last_name": "Silva",
    "address1": "Rua Destino, 456",
    "address2": "Casa",
    "city": "Rio de Janeiro",
    "province": "Rio de Janeiro",
    "province_code": "RJ",
    "country": "Brazil",
    "country_code": "BR",
    "zip": "20000-000",
    "phone": "+5521888888888"
  },
  "line_items": [
    {
      "id": 123456789,
      "title": "Produto Exemplo",
      "quantity": 2,
      "price": "60.00",
      "sku": "PROD-001",
      "variant_title": "Tamanho M"
    }
  ],
  "shipping_lines": [
    {
      "id": 987654321,
      "title": "Sedex",
      "price": "20.00",
      "code": "SEDEX"
    }
  ]
}
```

---

## 🚀 Deploy em Produção

### Vercel / Netlify / Render

1. **Faça deploy do seu app:**
   ```bash
   git push origin main
   # Ou faça deploy via dashboard da plataforma
   ```

2. **Obtenha a URL de produção:**
   - Vercel: `https://meuapp.vercel.app`
   - Netlify: `https://meuapp.netlify.app`
   - Domínio customizado: `https://mibrasil.com`

3. **Configure variáveis de ambiente na plataforma:**
   - `SHOPIFY_WEBHOOK_SECRET`
   - `SHOPIFY_ADMIN_API_TOKEN`
   - `DATABASE_URL`
   - Outras variáveis do `.env`

4. **Atualize os webhooks no Shopify:**
   - Vá em Settings → Notifications → Webhooks
   - Edite cada webhook
   - Atualize as URLs:
     - `https://mibrasil.com/api/webhooks/customers/create`
     - `https://mibrasil.com/api/webhooks/customers/update`
     - `https://mibrasil.com/api/webhooks/orders/create`
   - Salve cada webhook

5. **Teste em produção:**
   - Crie um cliente de teste na loja
   - Verifique os logs da plataforma (Vercel Logs, Netlify Functions, etc.)
   - Confirme que os dados aparecem no dashboard

### IMPORTANTE: HTTPS Obrigatório

Webhooks da Shopify **só funcionam com HTTPS** em produção. URLs `http://` serão rejeitadas.

✅ Válido: `https://mibrasil.com/api/webhooks/customers/create`
❌ Inválido: `http://mibrasil.com/api/webhooks/customers/create`

---

## ✅ Checklist de Configuração

### Desenvolvimento Local:
- [ ] Instalar ngrok (`choco install ngrok` ou via site)
- [ ] Iniciar Next.js (`npm run dev`)
- [ ] Iniciar ngrok (`ngrok http 3000`)
- [ ] Configurar `SHOPIFY_WEBHOOK_SECRET` no `.env`
- [ ] Criar webhook `customers/create` com URL do ngrok
- [ ] Criar webhook `customers/update` com URL do ngrok
- [ ] Criar webhook `orders/create` com URL do ngrok
- [ ] Criar webhook `orders/update` com URL do ngrok
- [ ] Testar com "Send test notification"
- [ ] Criar cliente de teste e verificar logs
- [ ] Criar pedido de teste e verificar logs
- [ ] Atualizar pedido de teste e verificar logs de status/rastreio
- [ ] Verificar dashboard para confirmar nomes de clientes

### Produção:
- [ ] Fazer deploy do app (Vercel/Netlify/etc)
- [ ] Configurar variáveis de ambiente na plataforma
- [ ] Obter URL de produção (HTTPS)
- [ ] Atualizar webhook `customers/create` com URL de produção
- [ ] Atualizar webhook `customers/update` com URL de produção
- [ ] Atualizar webhook `orders/create` com URL de produção
- [ ] Atualizar webhook `orders/update` com URL de produção
- [ ] Testar criando cliente real em produção
- [ ] Testar criando pedido real em produção
- [ ] Verificar logs da plataforma
- [ ] Verificar dashboard em produção
- [ ] Sincronizar clientes existentes (atualização em massa)

---

## 📚 Referências

- [Shopify Webhooks Documentation](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)
- [Webhook Event Topics](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook#event-topics)
- [HMAC Validation](https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Última atualização:** 2025-01-21

**Status:** ✅ Webhooks nativos funcionam em TODOS os planos Shopify (Basic, Shopify, Advanced, Plus)
