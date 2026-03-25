# 🔐 Configuração do Sistema de Autenticação

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shopmi_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Shopify (existentes)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT="your-storefront-token"
SHOPIFY_ADMIN_API_TOKEN="your-admin-token"

# Melhor Envio (existentes)
MELHOR_ENVIO_TOKEN="your-melhor-envio-token"
MELHOR_ENVIO_CLIENT_ID="your-melhor-envio-client-id"
```

## Configuração do Banco de Dados

### 1. Instalar PostgreSQL
```bash
# No Windows (usando Chocolatey)
choco install postgresql

# Ou baixar do site oficial: https://www.postgresql.org/download/
```

### 2. Criar Banco de Dados
```sql
CREATE DATABASE shopmi_db;
CREATE USER shopmi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE shopmi_db TO shopmi_user;
```

### 3. Executar Migrações
```bash
npx prisma migrate dev --name init
```

### 4. Gerar Cliente Prisma
```bash
npx prisma generate
```

## Configuração do Google OAuth (Opcional)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Configure as URIs de redirecionamento:
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
   - `https://yourdomain.com/api/auth/callback/google` (produção)

## Criando Usuário Admin

Execute o seguinte script para criar um usuário administrador:

```bash
# Conectar ao banco via psql
psql -d shopmi_db -U shopmi_user

# Inserir usuário admin
INSERT INTO users (id, email, name, password_hash, role, email_verified, created_at, updated_at) 
VALUES (
  'admin-' || gen_random_uuid(),
  'admin@mibrasil.com',
  'Administrador',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmVgMk.xONjG/Sy', -- senha: admin123
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
);
```

## Rotas Implementadas

### Autenticação
- `/auth/signin` - Login de clientes
- `/auth/signup` - Registro de clientes
- `/admin/signin` - Login de administradores

### Cliente
- `/dashboard` - Dashboard do cliente
- `/dashboard/profile` - Perfil do cliente (a implementar)
- `/dashboard/orders` - Pedidos do cliente (a implementar)
- `/dashboard/addresses` - Endereços do cliente (a implementar)

### Admin
- `/admin/dashboard` - Dashboard administrativo (expandir)
- `/admin/cadastro` - Gestão de produtos (existente)

## Próximos Passos

1. **Implementar páginas do dashboard do cliente**:
   - Perfil
   - Histórico de pedidos
   - Gestão de endereços

2. **Expandir dashboard admin**:
   - Gestão de usuários
   - Analytics
   - Relatórios

3. **Integração com Shopify Customer API**:
   - Sincronizar clientes
   - Histórico de pedidos
   - Dados de perfil

4. **Funcionalidades avançadas**:
   - Reset de senha
   - Verificação de email
   - Two-factor authentication

## Comandos Úteis

```bash
# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio

# Aplicar mudanças no schema
npx prisma db push

# Gerar nova migração
npx prisma migrate dev --name nome_da_migracao
``` 