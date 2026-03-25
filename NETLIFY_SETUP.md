# 🚀 Configuração do Netlify para Shopmi com Prisma

## Pré-requisitos

1. Conta no Netlify
2. Repositório do projeto no GitHub
3. Prisma configurado com SQLite (já incluído no projeto)

## Passo 1: Configurar Site no Netlify

### 1.1 Criar Site
1. Acesse o [Netlify](https://app.netlify.com)
2. Clique em "New site from Git"
3. Conecte seu repositório GitHub
4. Configure as seguintes opções:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`

### 1.2 Plugins Necessários
No painel do Netlify, vá em "Plugins" e instale:
- `@netlify/plugin-nextjs` (obrigatório)

## Passo 2: Configurar Variáveis de Ambiente

No painel do Netlify, vá em "Site settings" > "Environment variables" e adicione:

### 🔐 Autenticação
```
NEXTAUTH_SECRET=sua-chave-secreta-super-segura
NEXTAUTH_URL=https://seu-site.netlify.app
```

### 🗄️ Banco de Dados (Opcional)
O sistema usa SQLite por padrão. Se você quiser usar PostgreSQL:
```
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

### 🛍️ Shopify
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=sua-loja.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT=seu-token-storefront
SHOPIFY_ADMIN_API_TOKEN=seu-token-admin
```

### 📦 Melhor Envio
```
MELHOR_ENVIO_CLIENT_ID=seu-client-id
MELHOR_ENVIO_CLIENT_SECRET=seu-client-secret
MELHOR_ENVIO_TOKEN=seu-token-melhor-envio
MELHOR_ENVIO_ENVIRONMENT=sandbox
```

### 🔧 Configurações Adicionais
```
NODE_ENV=production
NETLIFY=true
```

## Passo 3: Como Funciona o Banco de Dados

### 3.1 SQLite Automático
- O sistema usa SQLite por padrão
- O banco é criado automaticamente na primeira execução
- As migrações são executadas automaticamente no build
- O usuário admin é criado automaticamente

### 3.2 Inicialização Automática
O sistema inclui:
- ✅ Criação automática do banco SQLite
- ✅ Execução automática das migrações
- ✅ Seed automático com usuário admin
- ✅ Verificação de integridade do banco

### 3.3 Credenciais Automáticas
Após o deploy, o sistema gerará automaticamente:
- **Admin**: `admin@mibrasil.com` / `senha gerada automaticamente`
- **Cliente**: `cliente@teste.com` / `senha gerada automaticamente`

As senhas serão exibidas nos logs do primeiro deploy. Para definir senhas específicas, configure as variáveis de ambiente:
```
ADMIN_PASSWORD=sua-senha-admin
CLIENT_PASSWORD=sua-senha-cliente
```

## Passo 4: Deploy e Teste

### 4.1 Primeiro Deploy
1. Faça push para o repositório
2. O Netlify fará o deploy automaticamente
3. Aguarde a conclusão (pode levar alguns minutos)
4. O banco será criado automaticamente

### 4.2 Verificar Logs
Se houver erros:
1. Vá em "Site overview" > "Production deploys"
2. Clique no deploy mais recente
3. Verifique os logs de build e função

### 4.3 Testar Funcionalidades
1. **Página inicial**: Deve carregar normalmente
2. **Health Check**: Acesse `/api/health` para verificar status
3. **Autenticação**: Teste login em `/admin/signin`
4. **Admin Dashboard**: Acesse `/admin/dashboard`
5. **Mega Menu**: Verificar se carrega produtos

## Passo 5: Verificar Saúde do Sistema

### 5.1 API de Health Check
Acesse `https://seu-site.netlify.app/api/health` para verificar:
- Status do banco de dados
- Conexão com Shopify
- Variáveis de ambiente
- Tempo de resposta

### 5.2 Exemplo de Resposta Saudável
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "netlify",
  "baseUrl": "https://seu-site.netlify.app",
  "responseTime": "150ms",
  "checks": {
    "database": {
      "status": "healthy",
      "type": "SQLite"
    },
    "shopify": {
      "status": "healthy"
    },
    "environment": {
      "status": "healthy"
    }
  }
}
```

## Troubleshooting

### ❌ Erro: "Page not found"
**Causa**: Problemas com NextAuth ou redirects
**Solução**: 
1. Verificar `NEXTAUTH_URL` = URL exata do site
2. Verificar `NEXTAUTH_SECRET` está definido
3. Verificar logs de função no Netlify

### ❌ Erro: "Database connection failed"
**Causa**: Problemas com SQLite ou Prisma
**Solução**:
1. Verificar logs de build no Netlify
2. Confirmar que migrações foram executadas
3. Verificar se `/tmp` é acessível

### ❌ Erro: "Admin user not found"
**Causa**: Seed não foi executado
**Solução**:
1. Verificar logs de inicialização
2. Acessar `/api/health` para verificar banco
3. Redeploy se necessário

### ❌ Erro: "Shopify API failed"
**Causa**: Tokens Shopify incorretos
**Solução**:
1. Verificar tokens nas variáveis de ambiente
2. Confirmar que loja está ativa
3. Verificar permissões dos tokens

## Comandos Úteis (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Fazer seed do banco
npm run db:seed

# Resetar banco (cuidado!)
npm run db:reset

# Visualizar banco
npm run db:studio

# Build local
npm run build

# Testar localmente
npm run dev
```

## Variáveis de Ambiente Mínimas

Para funcionar básico, configure apenas:

```
NEXTAUTH_SECRET=sua-chave-secreta-super-segura
NEXTAUTH_URL=https://seu-site.netlify.app
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=sua-loja.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT=seu-token-storefront
SHOPIFY_ADMIN_API_TOKEN=seu-token-admin
NODE_ENV=production
NETLIFY=true
```

## Vantagens da Configuração com SQLite

✅ **Simplicidade**: Não precisa configurar banco externo
✅ **Rapidez**: Deploy mais rápido
✅ **Custo**: Sem custos adicionais de banco
✅ **Automação**: Tudo configurado automaticamente
✅ **Portabilidade**: Funciona em qualquer ambiente

## Migração para PostgreSQL (Opcional)

Se no futuro quiser migrar para PostgreSQL:

1. Configure `DATABASE_URL` com PostgreSQL
2. Atualize `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Execute `npx prisma migrate dev`
4. Redeploy

## Contatos de Suporte

- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **NextAuth**: [next-auth.js.org](https://next-auth.js.org)
- **Shopify**: [shopify.dev](https://shopify.dev)

---

✅ **Configuração concluída!** Seu site deve estar funcionando em produção com SQLite e Prisma. 