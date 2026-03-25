# Guia de Setup - ShopMi Edge Workers

Guia passo a passo para configurar e fazer deploy dos Cloudflare Workers.

## 📋 Pré-requisitos

- [ ] Conta Cloudflare (gratuita)
- [ ] Node.js 18+ instalado
- [ ] npm ou yarn
- [ ] Domínio configurado no Cloudflare (opcional para produção)

## 🚀 Setup Passo a Passo

### Passo 1: Instalar Dependências

```bash
cd workers
npm install
```

### Passo 2: Autenticar no Cloudflare

```bash
npx wrangler login
```

Isso abrirá o navegador para autenticar. Autorize o acesso.

### Passo 3: Obter Account ID

```bash
# Listar contas
npx wrangler whoami
```

Copie o `Account ID` exibido.

**Ou** acesse: Cloudflare Dashboard → Workers → Overview → copie o Account ID

### Passo 4: Atualizar wrangler.toml

Edite `wrangler.toml` e descomente/atualize:

```toml
account_id = "SEU_ACCOUNT_ID_AQUI"

[vars]
ORIGIN_URL = "http://localhost:3000"  # Para dev local
SHOPIFY_DOMAIN = "uxh1te-1d.myshopify.com"
```

### Passo 5: Criar KV Namespace (Cache)

```bash
# Criar namespace de produção
npx wrangler kv:namespace create CACHE

# Criar namespace de preview/dev
npx wrangler kv:namespace create CACHE --preview
```

**Exemplo de output:**
```
⛅️ wrangler 3.80.0
---
🌀 Creating namespace with title "shopmi-edge-CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CACHE", id = "abc123..." }
```

Copie o `id` gerado e atualize em `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "abc123..."  # ID de produção
preview_id = "xyz789..."  # ID de preview
```

### Passo 6: Criar D1 Database (Analytics)

```bash
npx wrangler d1 create shopmi-analytics
```

**Output exemplo:**
```
✅ Successfully created DB 'shopmi-analytics'

[[d1_databases]]
binding = "DB"
database_name = "shopmi-analytics"
database_id = "def456..."
```

Copie e atualize em `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shopmi-analytics"
database_id = "def456..."
```

### Passo 7: Executar Schema SQL

```bash
# Aplicar schema no D1
npx wrangler d1 execute shopmi-analytics --file=./schema.sql --remote
```

Verificar:
```bash
npx wrangler d1 execute shopmi-analytics --command="SELECT name FROM sqlite_master WHERE type='table'" --remote
```

### Passo 8: Configurar Secrets (Opcional)

Se for usar Cloudflare Images API:

```bash
# Account Hash (encontre em: Cloudflare Dashboard > Images > Overview)
npx wrangler secret put CF_ACCOUNT_HASH

# API Token (crie em: Cloudflare Dashboard > Images > API Keys)
npx wrangler secret put CF_IMAGES_TOKEN
```

### Passo 9: Testar Localmente

```bash
npm run dev
```

Worker rodará em `http://localhost:8787`

**Testes:**

```bash
# Health check
curl http://localhost:8787/health

# Test com bot
curl -H "User-Agent: Googlebot/2.1" http://localhost:8787/health

# Analytics
curl http://localhost:8787/_analytics
```

### Passo 10: Deploy para Development

```bash
npm run deploy:staging
```

**Output exemplo:**
```
⛅️ wrangler 3.80.0
---
Your worker has been deployed to:
https://shopmi-edge-dev.SEU-USUARIO.workers.dev
```

Copie a URL e teste:

```bash
curl https://shopmi-edge-dev.SEU-USUARIO.workers.dev/health
```

### Passo 11: Configurar Next.js Integration

#### 11.1: Adicionar variáveis de ambiente

Crie/edite `shopmi/.env.local`:

```env
NEXT_PUBLIC_WORKER_URL=https://shopmi-edge-dev.SEU-USUARIO.workers.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 11.2: Ativar Custom Image Loader

Edite `shopmi/next.config.mjs` e descomente:

```javascript
images: {
  loader: 'custom',
  loaderFile: './src/lib/image-loader.ts',
  // ...
}
```

#### 11.3: Testar integração

```bash
cd ../  # Voltar para pasta shopmi
npm run dev
```

Abra `http://localhost:3000` e verifique se as imagens estão carregando.

### Passo 12: Deploy para Production

#### 12.1: Atualizar wrangler.toml

```toml
[env.production]
name = "shopmi-edge-production"
vars = {
  ORIGIN_URL = "https://seu-site.netlify.app",
  ENVIRONMENT = "production"
}

# Se tiver domínio próprio
route = { pattern = "suaoja.com/*", zone_name = "suaoja.com" }
```

#### 12.2: Deploy

```bash
npm run deploy:production
```

#### 12.3: Configurar DNS (se usando domínio próprio)

1. Acesse Cloudflare Dashboard
2. Selecione seu domínio
3. Vá em **Workers Routes**
4. Adicione route: `suaoja.com/*` → `shopmi-edge-production`
5. Certifique-se que DNS está **proxied** (nuvem laranja)

## ✅ Verificação Final

### Checklist de Production

- [ ] Worker deployed e acessível
- [ ] KV namespace criado e configurado
- [ ] D1 database criado com schema aplicado
- [ ] Secrets configurados (se necessário)
- [ ] Next.js apontando para worker
- [ ] DNS configurado (se usando domínio próprio)
- [ ] Health check funcionando: `curl https://seu-worker/health`
- [ ] Analytics funcionando: `curl https://seu-worker/_analytics`

### Testes de Funcionalidade

```bash
WORKER_URL="https://seu-worker.workers.dev"

# 1. Health check
curl $WORKER_URL/health

# 2. Image transform
curl "$WORKER_URL/_img?url=https://cdn.shopify.com/test.jpg&w=800"

# 3. Bot detection (Google)
curl -H "User-Agent: Googlebot/2.1" $WORKER_URL/products/test

# 4. Bot detection (Bing)
curl -H "User-Agent: bingbot/2.0" $WORKER_URL/products/test

# 5. User normal
curl -H "User-Agent: Mozilla/5.0 Chrome" $WORKER_URL/products/test

# 6. Analytics
curl $WORKER_URL/_analytics
```

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
npm run tail:production
```

### Queries Analytics

```bash
# Estatísticas gerais
npx wrangler d1 execute shopmi-analytics \
  --command="SELECT * FROM analytics_by_bot" \
  --remote

# Últimas transformações
npx wrangler d1 execute shopmi-analytics \
  --command="SELECT * FROM transformations ORDER BY timestamp DESC LIMIT 10" \
  --remote

# Cache hit rate
npx wrangler d1 execute shopmi-analytics \
  --command="SELECT
    COUNT(*) as total,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits,
    CAST(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as hit_rate
  FROM transformations" \
  --remote
```

## 🔧 Troubleshooting

### Worker não está interceptando requests

**Problema**: Site continua carregando direto do Netlify

**Solução**:
1. Verificar route no Cloudflare Dashboard
2. Garantir DNS está proxied (nuvem laranja)
3. Aguardar propagação (pode levar alguns minutos)
4. Testar direto: `curl https://seu-worker.workers.dev/health`

### Erro: "KV namespace not found"

**Problema**: Worker não consegue acessar KV

**Solução**:
1. Verificar binding em `wrangler.toml`
2. Executar `npx wrangler kv:namespace create CACHE`
3. Copiar ID correto para `wrangler.toml`
4. Re-deploy: `npm run deploy`

### Erro: "D1 database not found"

**Problema**: Worker não consegue acessar D1

**Solução**:
1. Verificar binding em `wrangler.toml`
2. Executar `npx wrangler d1 create shopmi-analytics`
3. Copiar ID correto
4. Aplicar schema: `npm run d1:migrate`
5. Re-deploy

### Imagens não otimizadas

**Problema**: Imagens carregam mas não passam pelo worker

**Solução**:
1. Verificar `NEXT_PUBLIC_WORKER_URL` em `.env.local`
2. Verificar custom loader está ativado em `next.config.mjs`
3. Verificar logs do worker: `npm run tail`
4. Testar URL direta: `curl "https://worker/_img?url=..."`

### AI Transform não funciona

**Problema**: Páginas de produto não são otimizadas para bots

**Solução**:
1. Verificar se Workers AI está habilitado na conta
2. Verificar binding `AI` em `wrangler.toml`
3. Verificar plan da conta (Workers AI pode requerer plan pago)
4. Verificar logs para erros específicos

## 🎓 Próximos Passos

Após setup completo:

1. **Monitorar Performance**
   - Acompanhar logs
   - Verificar cache hit rate
   - Analisar response times

2. **Otimizar Configurações**
   - Ajustar TTL de cache
   - Refinar bot detection
   - Customizar AI prompts

3. **Escalar**
   - Adicionar rate limiting se necessário
   - Implementar custom error pages
   - Configurar alertas

4. **Medir Resultados**
   - SEO rankings
   - Core Web Vitals
   - Custo vs benefício

## 📚 Recursos Úteis

- [Documentação Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [Cloudflare Community](https://community.cloudflare.com/)

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs: `npm run tail`
2. Consultar [troubleshooting](#troubleshooting)
3. Verificar [Cloudflare Status](https://www.cloudflarestatus.com/)
4. Postar no [Community Forum](https://community.cloudflare.com/)

---

**Última atualização**: 20 de Outubro de 2024
**Versão do guia**: 1.0
