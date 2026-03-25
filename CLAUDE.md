# ShopMi (MiBrasil) - Loja Virtual Xiaomi Brasil

## Visao Geral

Loja virtual completa de produtos Xiaomi para o mercado brasileiro. Integrada com Shopify como backend de e-commerce, Yampi para pagamentos e Melhor Envio para frete.

**Nome do projeto:** loja-shopify (package.json) / ShopMi / MiBrasil
**URL da loja:** shop.mibrasil.com
**Data de referencia:** 2026-03-23

---

## Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14.2.3 |
| Frontend | React + TypeScript | 18.2 / 5.x |
| Estilizacao | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (Radix UI) + Lucide Icons | - |
| ORM | Prisma (PostgreSQL) | 6.11.1 |
| DB Connection | Prisma Accelerate | - |
| Auth | NextAuth.js v5 beta | 5.0.0-beta.29 |
| GraphQL | Apollo Client | 3.13.6 |
| Pagamento | Yampi (PIX, Boleto, Cartao) | - |
| Frete | Melhor Envio | 1.6.3 |
| E-commerce API | Shopify Storefront + Admin API | - |
| Edge | Cloudflare Workers (KV, D1, AI) | - |
| Deploy | Netlify | - |
| Data Grid | AG Grid Community | 33.3.0 |
| Charts | Recharts | 3.1.0 |

---

## Estrutura do Projeto

```
shopmi/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout (MiSans font, providers, footer)
│   │   ├── globals.css         # Global styles
│   │   ├── shop/               # Catalogo de produtos
│   │   │   ├── page.tsx        # Listagem com filtros
│   │   │   └── [category]/     # Pagina de categoria
│   │   ├── product/[handle]/   # Detalhe do produto
│   │   ├── cart/               # Pagina do carrinho
│   │   ├── checkout/           # Checkout em 4 etapas
│   │   ├── search/             # Busca de produtos
│   │   ├── auth/
│   │   │   ├── signin/         # Login
│   │   │   └── signup/         # Cadastro
│   │   ├── dashboard/          # Dashboard do cliente
│   │   ├── admin/
│   │   │   ├── page.tsx        # Admin home
│   │   │   ├── signin/         # Login admin
│   │   │   ├── dashboard/      # Dashboard admin
│   │   │   ├── products/       # CRUD produtos
│   │   │   ├── orders/         # Gestao de pedidos
│   │   │   ├── customers/      # Gestao de clientes
│   │   │   └── cadastro/       # Cadastro de dados
│   │   └── api/                # 46+ API routes
│   │       ├── auth/           # NextAuth + registro
│   │       ├── admin/          # Admin endpoints
│   │       ├── checkout/yampi/ # Pagamento Yampi
│   │       ├── collections/    # Colecoes Shopify
│   │       ├── products/       # Consulta produtos
│   │       ├── shipping/       # Calculo de frete
│   │       ├── newsletter/     # Inscricao newsletter
│   │       ├── megamenu/       # Preview de produtos
│   │       ├── health/         # Health check
│   │       └── webhooks/       # Webhooks Shopify (orders/customers)
│   ├── components/
│   │   ├── admin/              # Componentes admin (grid renderers, sync, labels)
│   │   ├── cart/               # CartDrawer, CartItem
│   │   ├── checkout/           # GlobalCheckoutInterceptor
│   │   ├── layout/             # Header, ConditionalHeader, BannerSlider, CategorySlider
│   │   ├── product/            # ProductCard, ProductGallery, AddToCartButton
│   │   ├── shipping/           # Calculo de frete UI
│   │   ├── shop/               # Filtros (FiltersSidebarContent)
│   │   ├── ui/                 # shadcn/ui (button, card, input, sheet, etc.)
│   │   └── ExclusiveOffersSlider.tsx
│   ├── context/
│   │   ├── CartContext.tsx      # Carrinho (localStorage persistence)
│   │   └── AuthContext.tsx      # Auth wrapper (NextAuth session)
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config (Credentials provider)
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── shopify.ts          # Apollo Client + Storefront API queries
│   │   ├── shopify-admin.ts    # Admin API (orders, products, customers)
│   │   ├── shopify-customer.ts # Customer sync logic
│   │   ├── melhorenvio.ts      # Melhor Envio wrapper
│   │   ├── yampi.ts            # Yampi payment integration
│   │   ├── image-loader.ts     # Cloudflare image loader
│   │   ├── ag-grid-config.ts   # AG Grid configuration
│   │   ├── init-db.ts          # Database initialization
│   │   └── utils.ts            # Utility functions (cn, formatters)
│   ├── types/                  # TypeScript type definitions
│   └── assets/fonts/           # MiSans font files (.woff2)
├── prisma/
│   └── schema.prisma           # 10 models (User, Order, Customer, Address, etc.)
├── workers/                    # Cloudflare Workers (Hono framework)
│   ├── src/                    # Worker source code
│   ├── wrangler.toml           # Config (KV, D1, Workers AI)
│   └── package.json            # Hono, Wrangler, Vitest
├── public/                     # Static assets (images, SVGs)
├── scripts/                    # Admin creation, seed, product creation
├── netlify/                    # Netlify serverless functions
├── docs/                       # Documentation
└── drafts/                     # Draft/experimental files
```

---

## Modelos do Banco (Prisma)

| Model | Descricao |
|-------|-----------|
| User | Usuarios com roles CLIENT/ADMIN, hash bcrypt |
| Account | OAuth accounts (NextAuth adapter) |
| Session | Sessoes NextAuth |
| VerificationToken | Tokens de verificacao de email |
| CustomerProfile | Perfil estendido (phone, CPF, birthDate) |
| Address | Enderecos SHIPPING/BILLING |
| ShopifyCustomer | Cache de clientes Shopify sincronizados |
| ShopifyOrder | Cache de pedidos Shopify sincronizados |
| CustomerSyncLog | Log de sincronizacoes |
| NewsletterSubscription | Inscritos na newsletter |

---

## Comandos

```bash
# Desenvolvimento
npm run dev              # Servidor dev (Turbopack)
npm run build            # Build (prisma generate + next build)
npm run start            # Servidor producao
npm run lint             # ESLint

# Banco de dados
npm run db:migrate       # Aplicar migrations
npm run db:generate      # Gerar Prisma Client
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Seed (criar admin)
npm run db:reset         # Reset banco
npm run db:push          # Push schema changes

# Workers (Cloudflare)
cd workers && npm run dev          # Dev local
cd workers && npm run deploy       # Deploy dev
cd workers && npm run deploy:production  # Deploy prod
```

---

## Variaveis de Ambiente Necessarias

```
# Database
DATABASE_URL              # Prisma Accelerate connection string
DIRECT_DATABASE_URL       # Conexao direta para migrations

# Auth
NEXTAUTH_SECRET           # JWT signing key
NEXTAUTH_URL              # Base URL (http://localhost:3000)

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN          # uxh1te-1d.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT  # Token publico
SHOPIFY_ADMIN_API_TOKEN                   # Token admin (shpat_)
SHOPIFY_WEBHOOK_SECRET                    # Verificacao de webhooks

# Pagamento - AppMax (gateway principal)
APPMAX_APP_ID                       # def92660-5d7e-4941-a40b-0bec31b3c283
APPMAX_API_URL                      # https://api.appmax.com.br
APPMAX_AUTH_URL                     # https://auth.appmax.com.br

# Pagamento - Yampi (legado)
YAMPI_SHOP_DOMAIN                   # shop.mibrasil.com
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN       # shop.mibrasil.com
DOOKI_PUBLIC_ENDPOINT               # API Dooki cart

# Frete
MELHOR_ENVIO_TOKEN                  # JWT token
MELHOR_ENVIO_CLIENT_ID              # 18446
MELHOR_ENVIO_CLIENT_SECRET          # Secret
MELHOR_ENVIO_FROM_POSTAL_CODE       # 13800-511 (CEP origem)
```

---

## Convencoes de Codigo

- **Linguagem:** TypeScript strict mode
- **Path alias:** `@/*` mapeia para `./src/*`
- **Estilizacao:** Tailwind CSS com classes utilitarias; cor principal `#FF6700` (brand-orange)
- **Componentes UI:** shadcn/ui (estilo New York) com Radix UI primitives
- **Fonte:** MiSans (local, custom font via CSS variable `--font-misans`)
- **Formatacao:** ESLint com next/core-web-vitals (sem Prettier)
- **State management:** React Context (CartContext + AuthContext), sem Redux/Zustand
- **Data fetching:** Apollo Client (GraphQL) para Shopify Storefront, Axios/fetch para REST APIs
- **Breakpoints:** xs(375px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- **Imagens:** WebP/AVIF via Cloudflare image loader

---

## Features Implementadas

- [x] Catalogo de produtos com variantes, galeria de imagens, ISR
- [x] Carrinho com persistencia localStorage e drawer lateral
- [x] Checkout em 4 etapas (dados pessoais, endereco via ViaCEP, pagamento, revisao)
- [x] Autenticacao com roles CLIENT/ADMIN (bcrypt + JWT)
- [x] Painel Admin completo (dashboard, produtos, pedidos, clientes)
- [x] Busca full-text via Shopify Storefront API
- [x] Filtros por categoria, preco, tags e ordenacao
- [x] Mega Menu dinamico com preview de produtos
- [x] Calculo de frete via Melhor Envio (multiplas transportadoras)
- [x] Geracao de etiquetas de frete
- [x] Webhooks Shopify (sync pedidos e clientes)
- [x] Newsletter subscription
- [x] Analytics no admin (vendas, receita, clientes)
- [x] Integracao Yampi para pagamentos (PIX, Boleto, Cartao) — legado
- [x] Integracao AppMax (lib, health check, webhooks, modelos Prisma) — em construcao
- [x] Cloudflare Workers para edge computing

## Features Pendentes

- [ ] Sistema de avaliacoes/reviews de produtos
- [ ] Wishlist/Favoritos
- [ ] Emails transacionais (confirmacao de pedido, envio, etc.)
- [ ] Sistema de cupons dinamicos (apenas desconto PIX fixo existe)
- [ ] Devolucoes/Reembolsos (RMA)
- [ ] Notificacoes push/SMS para clientes
- [ ] Recomendacoes de produtos (AI)
- [ ] CI/CD via GitHub Actions
- [ ] Programa de fidelidade

---

## Integracoes Externas

| Servico | Uso | Tipo |
|---------|-----|------|
| **AppMax** | **Gateway de pagamentos (Cartao, PIX, Boleto)** | **Server-side** |
| Shopify Storefront API | Consulta produtos/colecoes (GraphQL) | Client-side |
| Shopify Admin API | Gestao de pedidos/clientes/produtos | Server-side |
| Yampi | Processamento de pagamentos (legado) | Server-side |
| Melhor Envio | Calculo de frete e etiquetas | Server-side |
| Dooki | Cart management (legado) | Client-side |
| ViaCEP | Auto-preenchimento de endereco | Client-side |
| Cloudflare Workers | Edge computing, image optimization, AI | Edge |
| Prisma Accelerate | Connection pooling PostgreSQL | Server-side |
| Google Ads | Tracking (AW-17409426525) | Client-side |

### AppMax — Fluxo de Checkout Nativo

```
App ID: def92660-5d7e-4941-a40b-0bec31b3c283
API: https://api.appmax.com.br
Auth: https://auth.appmax.com.br
Health: /api/appmax/health
Webhooks: /api/appmax/webhooks
Lib: src/lib/appmax.ts
Docs: D:\Xiaomi\knowledge\appmax-api\

Fluxo por pedido:
1. Appmax JS coleta IP do cliente (script no layout)
2. POST /v1/customers → customer_id
3. POST /v1/orders → order_id (valores em centavos)
4. POST /v1/payments/{method} → processar pagamento
5. Webhooks atualizam status automaticamente
```

---

## Deploy

- **Plataforma:** Netlify com @netlify/plugin-nextjs
- **Node:** 18, NPM: 9
- **Build:** `npm run build` (ignora erros ESLint e TypeScript)
- **Security headers:** X-Frame-Options DENY, X-Content-Type-Options nosniff
- **CORS:** Habilitado para API routes
- **Workers:** Deploy separado via Wrangler (dev/staging/production)

---

## Notas Importantes

1. O build ignora erros de ESLint e TypeScript (`eslint.ignoreDuringBuilds` e `typescript.ignoreBuildErrors` no next.config.mjs)
2. O middleware atual e passthrough (apenas `NextResponse.next()`)
3. O carrinho persiste no localStorage, nao no servidor
4. Dados de produtos vem do Shopify Storefront API em tempo real (com ISR)
5. Pedidos e clientes sao sincronizados via webhooks Shopify para o PostgreSQL local
6. A fonte MiSans e carregada localmente em todos os pesos (100-900)
7. Admin padrao criado via `npm run db:seed` (usa `scripts/create-admin.js`)
