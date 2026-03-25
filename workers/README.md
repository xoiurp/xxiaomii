# ShopMi Edge Workers

Cloudflare Workers para otimização de imagens e conteúdo com AI para a loja ShopMi.

## 🎯 Funcionalidades

- **Image Transformation**: Otimização automática de imagens via Cloudflare Images/Resizing
- **AI Enhancement**: Melhoria de SEO com Workers AI para crawlers de busca
- **Bot Detection**: Detecção inteligente de bots vs usuários reais
- **Edge Caching**: Cache distribuído globalmente para performance máxima
- **Analytics**: Métricas detalhadas de transformações e performance

## 📁 Estrutura

```
workers/
├── src/
│   ├── index.ts              # Worker principal (entry point)
│   ├── types.ts              # TypeScript type definitions
│   ├── bot-detection.ts      # Bot detection & classification
│   ├── image-transform.ts    # Image optimization
│   ├── ai-transform.ts       # AI-powered SEO enhancement
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── wrangler.toml             # Wrangler configuration
├── schema.sql                # D1 database schema
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd workers
npm install
```

### 2. Autenticar no Cloudflare

```bash
npx wrangler login
```

### 3. Configurar Recursos

#### Criar KV Namespace (Cache)

```bash
npm run kv:create
# Copiar o ID gerado e adicionar em wrangler.toml
```

#### Criar D1 Database (Analytics)

```bash
npm run d1:create
# Copiar o ID gerado e adicionar em wrangler.toml

# Executar schema
npm run d1:migrate
```

### 4. Configurar Secrets

```bash
# Se usar Cloudflare Images API
npx wrangler secret put CF_ACCOUNT_HASH
npx wrangler secret put CF_IMAGES_TOKEN
```

### 5. Atualizar wrangler.toml

Edite `wrangler.toml` e configure:

1. `account_id`: Seu Account ID do Cloudflare
2. `ORIGIN_URL`: URL do seu site Next.js (Netlify)
3. Descomente as seções de KV e D1 com os IDs gerados

### 6. Desenvolvimento Local

```bash
npm run dev
```

O worker rodará em `http://localhost:8787`

Teste:
```bash
# Health check
curl http://localhost:8787/health

# Test image transform
curl "http://localhost:8787/_img?url=https://cdn.shopify.com/test.jpg&w=800"
```

### 7. Deploy

```bash
# Deploy para development
npm run deploy:staging

# Deploy para production
npm run deploy:production
```

## ⚙️ Configuração

### Environment Variables

Configure em `wrangler.toml`:

```toml
[vars]
ORIGIN_URL = "https://seu-site.netlify.app"
SHOPIFY_DOMAIN = "sua-loja.myshopify.com"
ENVIRONMENT = "production"
```

### Secrets

Configure via CLI (não versione):

```bash
# Cloudflare Images (opcional)
npx wrangler secret put CF_ACCOUNT_HASH --env production
npx wrangler secret put CF_IMAGES_TOKEN --env production
```

### Routes

Configure rotas no Cloudflare Dashboard ou via `wrangler.toml`:

```toml
[env.production]
route = { pattern = "suaoja.com/*", zone_name = "suaoja.com" }
```

## 🧪 Testing

### Testar Localmente

```bash
npm run dev

# Em outro terminal
curl -H "User-Agent: Mozilla/5.0 Chrome/120.0" http://localhost:8787/products/teste
curl -H "User-Agent: Googlebot/2.1" http://localhost:8787/products/teste
```

### Testar Bot Detection

```bash
# Usuário normal
curl -H "User-Agent: Mozilla/5.0" http://localhost:8787/health

# Google Bot
curl -H "User-Agent: Googlebot/2.1" http://localhost:8787/products/redmi-note-12

# Bing Bot
curl -H "User-Agent: bingbot/2.0" http://localhost:8787/products/redmi-note-12
```

### Logs em Tempo Real

```bash
npm run tail:production
```

## 📊 Analytics

### Acessar Dashboard

```bash
# Via API
curl https://seu-worker.workers.dev/_analytics

# Via D1 CLI
npx wrangler d1 execute shopmi-analytics --command="SELECT * FROM analytics_by_bot" --remote
```

### Queries Úteis

```sql
-- Requisições por bot (últimos 7 dias)
SELECT * FROM analytics_by_bot;

-- Requisições diárias
SELECT * FROM analytics_daily
ORDER BY date DESC
LIMIT 30;

-- Páginas mais populares
SELECT * FROM popular_pages
LIMIT 20;

-- Cache hit rate
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits,
  CAST(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as hit_rate
FROM transformations
WHERE timestamp > strftime('%s', 'now', '-7 days') * 1000;
```

## 🔧 Integração com Next.js

### 1. Atualizar next.config.mjs

```javascript
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    domains: [
      'cdn.shopify.com',
      'uxh1te-1d.myshopify.com',
      'suaoja.com' // Seu domínio
    ],
  },
};
```

### 2. Configurar Variables de Ambiente

Adicione em `.env.local` (Next.js):

```env
NEXT_PUBLIC_WORKER_URL=https://seu-worker.workers.dev
NEXT_PUBLIC_SITE_URL=https://suaoja.com
NEXT_PUBLIC_CF_ACCOUNT_HASH=seu_hash (opcional)
```

### 3. Usar Image Component

```tsx
import Image from 'next/image';

// Imagem do Shopify - será otimizada pelo Worker
<Image
  src="https://cdn.shopify.com/s/files/1/xxx/produto.jpg"
  alt="Produto"
  width={800}
  height={600}
/>
```

## 🚨 Troubleshooting

### Worker não está interceptando requests

1. Verificar se route está configurada corretamente no Cloudflare
2. Verificar DNS (deve estar proxied - nuvem laranja)
3. Testar diretamente: `curl https://seu-worker.workers.dev/health`

### Imagens não otimizadas

1. Verificar logs: `npm run tail`
2. Testar URL direta: `curl "https://seu-worker.workers.dev/_img?url=..."`
3. Verificar se ORIGIN_URL está correto em wrangler.toml

### AI Transform não funciona

1. Verificar se Workers AI está habilitado na sua conta
2. Verificar binding `AI` em wrangler.toml
3. Verificar logs para erros

### Cache não funcionando

1. Verificar se KV namespace está criado e configurado
2. Verificar TTL values em types.ts
3. Limpar cache: Use Cloudflare Dashboard → Caching → Purge Everything

## 💰 Custos Estimados

### Free Tier
- Workers: 100k requests/dia GRÁTIS
- KV: 1GB + 10M reads/mês GRÁTIS
- D1: 5M reads + 100k writes/mês GRÁTIS
- Workers AI: 10k neurons/dia GRÁTIS

### Paid (se exceder free tier)
- Workers: $0.50 por milhão de requests
- Workers AI: $0.011 por 1k neurons
- Cloudflare Images (opcional): $5/mês (100k imagens)

**Estimativa mensal**: $0-35/mês dependendo do tráfego

## 📚 Recursos

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Images](https://developers.cloudflare.com/images/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 🛡️ Segurança

### Secrets Management

NUNCA faça commit de secrets. Use:

```bash
npx wrangler secret put SECRET_NAME
```

### Rate Limiting

Implementar se necessário via Cloudflare Dashboard → Firewall Rules.

### CORS

Headers CORS estão configurados em `index.ts`. Ajuste conforme necessário.

## 📝 Changelog

### v1.0.0 (2024-10-20)
- ✅ Setup inicial
- ✅ Bot detection
- ✅ Image transformation
- ✅ AI SEO enhancement
- ✅ Analytics tracking
- ✅ Cache strategy

## 🤝 Suporte

Para issues ou dúvidas:
1. Verificar logs: `npm run tail`
2. Consultar documentação Cloudflare
3. Verificar GitHub Issues do projeto

## 📄 Licença

UNLICENSED - Uso interno ShopMi
