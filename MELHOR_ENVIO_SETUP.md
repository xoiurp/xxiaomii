# Configuração do Melhor Envio

## Variáveis de Ambiente Necessárias

Para que o sistema de etiquetas funcione corretamente, você precisa configurar as seguintes variáveis de ambiente:

### 1. Variáveis do Melhor Envio
```bash
# Client ID do aplicativo (obtido no painel do Melhor Envio)
MELHOR_ENVIO_CLIENT_ID=seu-client-id

# Client Secret do aplicativo (obtido no painel do Melhor Envio)
MELHOR_ENVIO_CLIENT_SECRET=seu-client-secret

# Token de acesso (obtido após autenticação OAuth)
MELHOR_ENVIO_TOKEN=seu-token-de-acesso

# Ambiente (sandbox para testes, production para produção)
MELHOR_ENVIO_ENVIRONMENT=sandbox
```

### 2. URLs Configuradas no Aplicativo
Baseado na imagem fornecida, o aplicativo deve ser configurado com:

- **Nome da plataforma**: mibrasil5gb
- **Site da plataforma**: https://mibrasil.com
- **E-mail de contato**: contato@mibrasil.com
- **E-mail de suporte técnico**: contato@mibrasil.com
- **URL do seu ambiente para testes**: https://mibrasil.com/admin/orders
- **URL de redirecionamento após autorização**: https://mibrasil.com/admin/orders/thankyou

## Processo de Configuração

### Passo 1: Criar Aplicativo no Melhor Envio
1. Acesse o painel do Melhor Envio
2. Vá em "Aplicativos" > "Criar novo aplicativo"
3. Preencha os dados conforme mostrado na imagem
4. Anote o Client ID e Client Secret gerados

### Passo 2: Configurar OAuth
1. Implemente a rota de callback: `/admin/orders/thankyou`
2. Configure o fluxo OAuth para obter o token de acesso
3. Armazene o token nas variáveis de ambiente

### Passo 3: Atualizar Código
1. Descomente o código real em `/api/admin/shipping/labels/route.ts`
2. Comente a versão simulada
3. Atualize as configurações de ambiente

## Estrutura de Arquivos

```
shopmi/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── admin/
│   │           └── shipping/
│   │               ├── labels/route.ts       # API principal
│   │               ├── convert/route.ts      # Conversão de dados
│   │               └── test/route.ts         # Teste de autenticação
│   ├── lib/
│   │   └── melhorenvio.ts                    # Cliente da API
│   └── components/
│       └── admin/
│           └── LabelGenerationModal.tsx      # Modal de geração
```

## Testando a Configuração

Após configurar as variáveis de ambiente, teste a autenticação:

```bash
curl https://yourdomain.com/api/admin/shipping/test
```

Se retornar dados da empresa e saldo, a autenticação está funcionando.

## Problemas Comuns

### 1. Erro 401 (Unauthenticated)
- Verifique se o token está correto
- Confirme se as URLs do aplicativo estão corretas
- Verifique se o ambiente (sandbox/production) está correto

### 2. Erro de CORS
- Certifique-se de que o domínio está registrado no aplicativo
- Verifique se as URLs de callback estão corretas

### 3. Token Expirado
- Tokens do Melhor Envio têm validade
- Implemente renovação automática ou manual do token

## Próximos Passos

1. **Deploy no Netlify**: Configure as variáveis de ambiente no painel do Netlify
2. **Teste em Produção**: Use o ambiente sandbox primeiro
3. **Implementar OAuth**: Crie o fluxo completo de autenticação
4. **Monitoramento**: Implemente logs para acompanhar o uso da API 