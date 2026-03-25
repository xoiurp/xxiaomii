# Teste de Domínio Yampi - Diagnóstico

## Problema Atual

A API Dooki está retornando:
```json
{
  "active": false,
  "message": "Merchant not found",
  "exception": true
}
```

Isso significa que o domínio `shop.mibrasil.com` não está configurado na sua conta Yampi.

## Domínios Possíveis para Testar

Baseado no seu script do Webflow, você tem:
- Script do Webflow usa: `shop.iwowatch.com.br`
- Configuração atual: `shop.mibrasil.com`

### Teste 1: Usar domínio do Webflow temporariamente

Para verificar se o problema é apenas o domínio, faça o seguinte teste:

1. **Abra o arquivo `.env`** e altere:
   ```bash
   YAMPI_SHOP_DOMAIN=shop.iwowatch.com.br
   NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=shop.iwowatch.com.br
   ```

2. **Reinicie o servidor:**
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

3. **Teste o checkout novamente**

Se funcionar com `shop.iwowatch.com.br`, isso confirma que:
- ✅ A integração está correta
- ❌ O domínio `shop.mibrasil.com` não está configurado na Yampi

### Teste 2: Verificar na conta Yampi

Entre na sua conta Yampi e procure por:
- Configurações de Loja
- Domínios Cadastrados
- Configurações de Checkout

Copie o domínio exato que aparece lá.

## Domínios para Testar (em ordem de prioridade)

Tente cada um destes no arquivo `.env`:

```bash
# 1. Domínio do Webflow (mais provável de funcionar)
YAMPI_SHOP_DOMAIN=shop.iwowatch.com.br

# 2. Domínio sem o "shop."
YAMPI_SHOP_DOMAIN=mibrasil.com

# 3. Domínio com "seguro."
YAMPI_SHOP_DOMAIN=seguro.mibrasil.com

# 4. Domínio com "www."
YAMPI_SHOP_DOMAIN=www.mibrasil.com

# 5. Domínio do iWo sem o "shop."
YAMPI_SHOP_DOMAIN=iwowatch.com.br
```

## Como Identificar o Domínio Correto

### Método 1: Pelo Painel da Yampi
1. Faça login na Yampi
2. Vá em Configurações → Loja ou similar
3. Procure por "Domínio da Loja" ou "URL da Loja"

### Método 2: Testando pela API Dooki
Execute este comando no terminal (substitua `SEU_DOMINIO` pelo domínio que quer testar):

```bash
curl -X POST https://api.dooki.com.br/v2/public/shopify/cart \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "SEU_DOMINIO",
    "cart_payload": {
      "token": "test",
      "items": []
    }
  }'
```

Se retornar algo diferente de "Merchant not found", o domínio está correto.

## Próximos Passos

1. **TESTE PRIMEIRO com `shop.iwowatch.com.br`** (domínio do Webflow)
   - Isso vai confirmar se a integração funciona

2. **Se funcionar com iWowatch:**
   - Você tem duas opções:
     - **Opção A:** Continuar usando o mesmo domínio Yampi do Webflow
     - **Opção B:** Criar/configurar uma nova loja Yampi para `mibrasil.com`

3. **Se não funcionar nem com iWowatch:**
   - Verifique se as credenciais da Shopify estão corretas
   - Confirme que a conta Yampi está ativa

## Diferença Entre as Lojas

### iWowatch (Webflow)
- Domínio Shopify: `1bdd45-30.myshopify.com`
- Domínio Yampi: `shop.iwowatch.com.br`
- Status: ✅ Funcionando no Webflow

### MiBrasil (Next.js - Atual)
- Domínio Shopify: `uxh1te-1d.myshopify.com`
- Domínio Yampi: `shop.mibrasil.com` ❓ (não confirmado)
- Status: ❌ "Merchant not found"

## Observação Importante

Você está usando **lojas Shopify diferentes**:
- Webflow: `1bdd45-30.myshopify.com`
- Next.js: `uxh1te-1d.myshopify.com`

Isso significa que são **projetos separados**. Você precisa:
1. Ter uma conta Yampi configurada para a loja `uxh1te-1d.myshopify.com`
2. Ou usar a mesma conta Yampi, mas com domínio diferente configurado

## Solução Rápida (Temporária)

Se você quer apenas testar e fazer funcionar rapidamente, pode usar o domínio do Webflow:

**No arquivo `.env`:**
```bash
YAMPI_SHOP_DOMAIN=shop.iwowatch.com.br
NEXT_PUBLIC_YAMPI_SHOP_DOMAIN=shop.iwowatch.com.br
```

**MAS ATENÇÃO:** Isso vai misturar os checkouts das duas lojas. Use apenas para teste.

## Solução Definitiva

1. Entre em contato com o suporte da Yampi
2. Informe que tem uma nova loja Shopify: `uxh1te-1d.myshopify.com`
3. Solicite a configuração do domínio: `shop.mibrasil.com` ou `mibrasil.com`
4. Aguarde a configuração ser ativada
5. Teste novamente

---

**Me informe qual domínio funcionou para que eu possa atualizar a configuração permanentemente!**
