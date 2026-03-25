# Configuração do Shopify Flow para Captura de Dados

Este guia explica como usar o **Shopify Flow** para capturar dados de clientes e pedidos em tempo real, contornando as restrições de PII (Personally Identifiable Information) da Shopify Admin API.

## 🎯 Por que usar Shopify Flow?

A Shopify bloqueou o acesso a dados PII (nomes, emails, telefones, endereços) via Admin API em planos Basic/não-Plus. No entanto, o **Shopify Flow** permite criar automações que **enviam dados completos** para endpoints HTTP personalizados no momento da criação/atualização.

### Vantagens do Shopify Flow:
- ✅ **Interface visual drag-and-drop** - muito mais fácil que configurar webhooks
- ✅ **Acesso a dados completos** de clientes (firstName, lastName, email, phone)
- ✅ **Condições personalizadas** - execute ações apenas quando certas condições forem verdadeiras
- ✅ **Atualização em tempo real** quando clientes/pedidos são criados
- ✅ **Gratuito** em todos os planos Shopify
- ✅ **Não requer verificação HMAC** - mais simples de implementar

---

## 📱 O que é o Shopify Flow?

Shopify Flow é um app de automação visual que permite criar workflows personalizados:

- **Trigger** (Gatilho): Um evento que inicia o workflow (ex: cliente criado, pedido criado)
- **Condition** (Condição): Filtros opcionais (ex: apenas pedidos acima de R$ 100)
- **Action** (Ação): O que fazer (ex: enviar dados para um endpoint HTTP)

**Link:** [Shopify Flow App](https://apps.shopify.com/flow)

---

## 🚀 Instalação do Shopify Flow

### Passo 1: Instalar o App

1. Acesse o painel admin da sua loja Shopify
2. Vá em **Apps** → **Shopify App Store**
3. Busque por "**Shopify Flow**"
4. Clique em **Add app** (Adicionar app)
5. Clique em **Install** (Instalar)

**NOTA:** O Shopify Flow é **gratuito** e oficial da Shopify.

### Passo 2: Acessar o Flow

1. Após instalar, vá em **Apps** → **Flow**
2. Você verá a interface visual do Flow
3. Clique em **Create workflow** (Criar workflow)

---

## 📋 Workflows a Criar

Você precisará criar **2 workflows principais**:

1. **Workflow 1:** Quando um cliente é criado → Enviar dados para nosso endpoint
2. **Workflow 2:** Quando um pedido é criado → Enviar dados para nosso endpoint

---

## 🔧 Workflow 1: Capturar Clientes Criados

### Configuração Completa

#### 1. Trigger (Gatilho)

1. No Flow, clique em **Select a trigger**
2. Busque e selecione: **Customer created**
3. O Flow agora mostra "When a customer is created..."

#### 2. Action (Ação HTTP)

1. Clique no **+** abaixo do trigger
2. Selecione **Action** (Ação)
3. Busque por "**Send HTTP request**"
4. Configure os campos:

**URL:**
```
https://seudominio.com/api/webhooks/customers/create
```

**Method:**
```
POST
```

**Headers:**
```
Content-Type: application/json
```

**Body:** (Clique em "Insert a variable" para adicionar os campos do cliente)

```json
{
  "id": "{{customer.id}}",
  "email": "{{customer.email}}",
  "firstName": "{{customer.firstName}}",
  "lastName": "{{customer.lastName}}",
  "phone": "{{customer.phone}}",
  "ordersCount": "{{customer.ordersCount}}",
  "totalSpent": "{{customer.totalSpent}}",
  "tags": "{{customer.tags}}",
  "note": "{{customer.note}}",
  "verifiedEmail": "{{customer.verifiedEmail}}",
  "taxExempt": "{{customer.taxExempt}}",
  "state": "{{customer.state}}",
  "createdAt": "{{customer.createdAt}}",
  "updatedAt": "{{customer.updatedAt}}",
  "acceptsMarketing": "{{customer.acceptsMarketing}}",
  "defaultAddress": {
    "address1": "{{customer.defaultAddress.address1}}",
    "address2": "{{customer.defaultAddress.address2}}",
    "city": "{{customer.defaultAddress.city}}",
    "province": "{{customer.defaultAddress.province}}",
    "country": "{{customer.defaultAddress.country}}",
    "zip": "{{customer.defaultAddress.zip}}",
    "phone": "{{customer.defaultAddress.phone}}",
    "firstName": "{{customer.defaultAddress.firstName}}",
    "lastName": "{{customer.defaultAddress.lastName}}"
  }
}
```

**IMPORTANTE:** No Flow, você clica em "Insert a variable" e seleciona visualmente cada campo (customer.id, customer.email, etc.). Não precisa digitar os `{{}}` manualmente.

#### 3. Salvar o Workflow

1. Dê um nome ao workflow: "**Sync Customer Created to Database**"
2. Clique em **Turn on workflow** (Ativar workflow)
3. Pronto! ✅

---

## 🛒 Workflow 2: Capturar Pedidos Criados

### Configuração Completa

#### 1. Trigger (Gatilho)

1. No Flow, clique em **Create workflow**
2. Clique em **Select a trigger**
3. Busque e selecione: **Order created**
4. O Flow agora mostra "When an order is created..."

#### 2. Action (Ação HTTP)

1. Clique no **+** abaixo do trigger
2. Selecione **Action** (Ação)
3. Busque por "**Send HTTP request**"
4. Configure os campos:

**URL:**
```
https://seudominio.com/api/webhooks/orders/create
```

**Method:**
```
POST
```

**Headers:**
```
Content-Type: application/json
```

**Body:**

```json
{
  "id": "{{order.id}}",
  "name": "{{order.name}}",
  "orderNumber": "{{order.orderNumber}}",
  "email": "{{order.email}}",
  "phone": "{{order.phone}}",
  "financialStatus": "{{order.financialStatus}}",
  "fulfillmentStatus": "{{order.fulfillmentStatus}}",
  "currency": "{{order.currency}}",
  "totalPrice": "{{order.totalPrice}}",
  "subtotalPrice": "{{order.subtotalPrice}}",
  "totalTax": "{{order.totalTax}}",
  "totalDiscounts": "{{order.totalDiscounts}}",
  "tags": "{{order.tags}}",
  "note": "{{order.note}}",
  "createdAt": "{{order.createdAt}}",
  "customer": {
    "id": "{{order.customer.id}}",
    "email": "{{order.customer.email}}",
    "firstName": "{{order.customer.firstName}}",
    "lastName": "{{order.customer.lastName}}",
    "phone": "{{order.customer.phone}}"
  },
  "billing_address": {
    "firstName": "{{order.billingAddress.firstName}}",
    "lastName": "{{order.billingAddress.lastName}}",
    "address1": "{{order.billingAddress.address1}}",
    "address2": "{{order.billingAddress.address2}}",
    "city": "{{order.billingAddress.city}}",
    "province": "{{order.billingAddress.province}}",
    "country": "{{order.billingAddress.country}}",
    "zip": "{{order.billingAddress.zip}}",
    "phone": "{{order.billingAddress.phone}}"
  },
  "shipping_address": {
    "firstName": "{{order.shippingAddress.firstName}}",
    "lastName": "{{order.shippingAddress.lastName}}",
    "address1": "{{order.shippingAddress.address1}}",
    "address2": "{{order.shippingAddress.address2}}",
    "city": "{{order.shippingAddress.city}}",
    "province": "{{order.shippingAddress.province}}",
    "country": "{{order.shippingAddress.country}}",
    "zip": "{{order.shippingAddress.zip}}",
    "phone": "{{order.shippingAddress.phone}}"
  }
}
```

#### 3. Salvar o Workflow

1. Dê um nome ao workflow: "**Sync Order Created to Database**"
2. Clique em **Turn on workflow** (Ativar workflow)
3. Pronto! ✅

---

## 🧪 Testando os Workflows

### Método 1: Teste Direto no Flow

1. No Flow, abra o workflow que criou
2. Clique em **Test workflow** (Testar workflow)
3. O Flow executará com dados de teste
4. Verifique os logs do seu servidor Next.js

### Método 2: Criar Cliente Real

1. Vá em **Customers** → **Add customer**
2. Preencha:
   - First name: `João`
   - Last name: `Silva`
   - Email: `joao@teste.com`
   - Phone: `+55 11 99999-9999`
3. Clique em **Save**
4. Verifique os logs do servidor

**Logs esperados:**
```bash
📥 Requisição recebida do Shopify Flow - customers/create
📦 Dados do Shopify Flow recebidos: {
  id: 9151137612005,
  email: 'joao@teste.com',
  firstName: 'João',
  lastName: 'Silva'
}
✅ Cliente salvo no banco de dados: {
  id: 'clxxx123',
  shopifyId: '9151137612005',
  name: 'João Silva',
  email: 'joao@teste.com'
}
```

### Método 3: Criar Pedido Real

1. Vá em **Orders** → **Create order**
2. Adicione produtos
3. Adicione informações do cliente
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

Você verá logs quando o Flow enviar dados.

### 2. Verificar Banco de Dados

```bash
# Abrir Prisma Studio
npx prisma studio

# Ou query SQL direto
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

## 🔧 Endpoints Criados

### 1. `/api/webhooks/customers/create`

Recebe dados do Flow quando um cliente é criado.

**Features:**
- ✅ Aceita dados em camelCase ou snake_case
- ✅ Normaliza automaticamente os campos
- ✅ Upsert (cria ou atualiza) cliente no Prisma
- ✅ Registra log de sincronização
- ✅ Retorna confirmação JSON

### 2. `/api/webhooks/customers/update`

Recebe dados do Flow quando um cliente é atualizado.

**Features:**
- ✅ Mesma lógica de normalização
- ✅ Atualiza cliente existente ou cria novo
- ✅ Registra logs separados para create vs update

### 3. `/api/webhooks/orders/create`

Recebe dados do Flow quando um pedido é criado.

**Features:**
- ✅ Extrai dados do pedido
- ✅ Extrai billingAddress e shippingAddress
- ✅ Atualiza/cria cliente automaticamente com dados do pedido
- ✅ Prepara dados para salvar pedido (precisa do model ShopifyOrder)

---

## 🚨 Problemas Comuns

### Problema 1: Flow não envia dados

**Causa:** Workflow não está ativado ou URL incorreta

**Solução:**
1. Verifique se o workflow está **ON** (ativado)
2. Confirme que a URL está correta
3. Em desenvolvimento, use **ngrok** para expor localhost

### Problema 2: Erro 400 - Bad Request

**Causa:** Formato de JSON inválido no Body do Flow

**Solução:**
1. Verifique se todos os campos têm `{{variavel}}`
2. Confirme que as vírgulas estão corretas no JSON
3. Teste o workflow com "Test workflow"

### Problema 3: Servidor não recebe nada

**Causa:** URL não está acessível (localhost não funciona)

**Solução:**
1. Use **ngrok** em desenvolvimento:
   ```bash
   ngrok http 3000
   ```
2. Use a URL do ngrok no Flow (ex: `https://abc123.ngrok.io/api/webhooks/customers/create`)
3. Em produção, use domínio real com HTTPS

### Problema 4: firstName/lastName ainda null

**Causa:** Variáveis do Flow não estão sendo inseridas corretamente

**Solução:**
1. No Flow, clique em "Insert a variable"
2. Selecione visualmente: Customer → firstName
3. Não digite manualmente `{{customer.firstName}}`
4. Teste o workflow e verifique o JSON enviado nos logs

---

## 🌐 Desenvolvimento Local com ngrok

Para testar o Flow localmente, você precisa expor seu localhost:

### 1. Instalar ngrok

```bash
# Windows (via Chocolatey)
choco install ngrok

# Ou baixe de https://ngrok.com/download
```

### 2. Expor porta 3000

```bash
ngrok http 3000
```

### 3. Copiar URL

O ngrok mostrará algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Usar no Flow

No Shopify Flow, use:
```
https://abc123.ngrok.io/api/webhooks/customers/create
```

**IMPORTANTE:** Sempre que reiniciar o ngrok, a URL muda. Você precisará atualizar no Flow.

---

## 🚀 Deploy em Produção

### Vercel / Netlify

1. Faça deploy do seu app
2. Obtenha a URL de produção (ex: `https://mibrasil.com`)
3. Atualize os workflows no Shopify Flow com as URLs de produção:
   - `https://mibrasil.com/api/webhooks/customers/create`
   - `https://mibrasil.com/api/webhooks/orders/create`
4. Teste criando um cliente/pedido real

**NOTA:** Flow funciona apenas com **HTTPS** em produção.

---

## 🔄 Sincronização de Clientes Existentes

O Flow só captura **novos** eventos. Para clientes existentes:

### Opção 1: Atualização Manual

1. Vá em **Customers** → selecione um cliente existente
2. Faça uma pequena alteração (ex: adicionar tag "synced")
3. Salve o cliente
4. Crie um workflow "Customer updated" com mesma configuração

### Opção 2: Workflow de Customer Updated

1. No Flow, crie um novo workflow
2. Trigger: **Customer updated**
3. Action: Send HTTP request para `/api/webhooks/customers/update`
4. Isso capturará qualquer alteração em clientes existentes

### Opção 3: Importação Manual

Use o endpoint de sincronização manual (sem Flow):

```bash
GET /api/admin/customers/sync
```

**NOTA:** Este método pode não retornar firstName/lastName devido às restrições de PII.

---

## 📝 Variáveis Disponíveis no Flow

### Customer (cliente)

- `{{customer.id}}` - ID do cliente
- `{{customer.email}}` - Email
- `{{customer.firstName}}` - Primeiro nome
- `{{customer.lastName}}` - Sobrenome
- `{{customer.phone}}` - Telefone
- `{{customer.ordersCount}}` - Total de pedidos
- `{{customer.totalSpent}}` - Total gasto
- `{{customer.tags}}` - Tags
- `{{customer.note}}` - Nota
- `{{customer.state}}` - Estado (enabled/disabled)
- `{{customer.createdAt}}` - Data de criação
- `{{customer.defaultAddress.address1}}` - Endereço linha 1
- `{{customer.defaultAddress.city}}` - Cidade
- `{{customer.defaultAddress.province}}` - Estado/Província
- `{{customer.defaultAddress.zip}}` - CEP

### Order (pedido)

- `{{order.id}}` - ID do pedido
- `{{order.name}}` - Nome do pedido (ex: #1001)
- `{{order.orderNumber}}` - Número do pedido
- `{{order.email}}` - Email do cliente
- `{{order.phone}}` - Telefone do cliente
- `{{order.totalPrice}}` - Preço total
- `{{order.financialStatus}}` - Status financeiro (paid, pending, etc.)
- `{{order.customer.id}}` - ID do cliente
- `{{order.customer.firstName}}` - Nome do cliente
- `{{order.billingAddress.firstName}}` - Nome no endereço de cobrança
- `{{order.billingAddress.address1}}` - Endereço de cobrança
- `{{order.shippingAddress.firstName}}` - Nome no endereço de envio
- `{{order.shippingAddress.city}}` - Cidade de envio

**DICA:** Ao criar o workflow, clique em "Insert a variable" para ver todas as variáveis disponíveis.

---

## ✅ Checklist de Configuração

- [ ] Instalar Shopify Flow na loja
- [ ] Criar workflow "Customer created"
- [ ] Configurar ação HTTP para `/api/webhooks/customers/create`
- [ ] Inserir variáveis do cliente no Body JSON
- [ ] Ativar workflow
- [ ] Criar workflow "Order created"
- [ ] Configurar ação HTTP para `/api/webhooks/orders/create`
- [ ] Inserir variáveis do pedido no Body JSON
- [ ] Ativar workflow
- [ ] Testar com "Test workflow"
- [ ] Criar cliente de teste e verificar logs
- [ ] Criar pedido de teste e verificar logs
- [ ] Verificar dashboard para confirmar nomes
- [ ] Deploy em produção com HTTPS
- [ ] Atualizar URLs dos workflows para produção
- [ ] Testar workflows em produção

---

## 📚 Recursos Úteis

- [Shopify Flow Documentation](https://help.shopify.com/en/manual/shopify-flow)
- [Flow Triggers Reference](https://help.shopify.com/en/manual/shopify-flow/triggers)
- [Flow Actions Reference](https://help.shopify.com/en/manual/shopify-flow/actions)
- [HTTP Request Action](https://help.shopify.com/en/manual/shopify-flow/actions/http-request)

---

**Última atualização:** 2025-01-21
