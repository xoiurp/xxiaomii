# 🔄 Guia de Generalização de Marcas para Bots

## 📋 O Que Foi Implementado

Sistema que **generaliza** alt text de imagens removendo marcas específicas (Xiaomi, Redmi, Mi, etc) quando detectado **Googlebot**, mantendo especificações técnicas.

## 🎯 Exemplos de Transformação

### Exemplo 1: Smartphone
```
ORIGINAL (usuários):
Alt text: "Xiaomi Redmi A5 64GB 4G - Imagem principal"

PARA GOOGLEBOT:
Alt text: "Smartphone 64GB 4G - Foto principal do produto"
```

### Exemplo 2: Fone de Ouvido
```
ORIGINAL:
Alt text: "Xiaomi Mi True Wireless Earbuds 2 - Imagem principal"

PARA GOOGLEBOT:
Alt text: "Fone de ouvido Bluetooth - Foto principal do produto"
```

### Exemplo 3: Carregador
```
ORIGINAL:
Alt text: "Carregador Xiaomi 67W Turbo - Imagem principal"

PARA GOOGLEBOT:
Alt text: "Carregador 67W - Foto principal do produto"
```

## 🔧 Como Funciona

### 1. Detecção de Bot
```typescript
// Automaticamente detecta Googlebot
User-Agent: Googlebot/2.1
↓
bot.type === 'googlebot'
```

### 2. Categorização Inteligente
```typescript
// Detecta categoria do produto baseado em keywords
"Redmi Note 12" → Categoria: "Smartphone"
"Mi Band 7" → Categoria: "Smartwatch"
"AirDots 3" → Categoria: "Fone de ouvido"
```

### 3. Extração de Specs
```typescript
// Extrai especificações técnicas:
- Armazenamento: 64GB, 128GB, 256GB
- RAM: 4GB RAM, 8GB RAM
- Câmera: 50MP, 108MP
- Conectividade: 4G, 5G, WiFi, Bluetooth
- Potência: 67W, 120W
```

### 4. Remoção de Marcas
```typescript
// Remove estas marcas:
- Xiaomi
- Redmi
- Mi
- Poco
- Black Shark
```

### 5. Construção do Alt Text Genérico
```typescript
Categoria + Especificações
↓
"Smartphone 64GB 4G"
"Fone de ouvido Bluetooth"
"Carregador 67W"
```

## ⚙️ Configuração

### Adicionar/Remover Marcas

Edite `workers/src/ai-transform.ts` linha 485:

```typescript
const brandsToRemove = [
  'Xiaomi',
  'Redmi',
  'Mi',
  'Poco',
  'Black Shark',
  'SuaNovaMarca', // Adicione aqui
];
```

### Adicionar Categorias

Edite linha 495:

```typescript
const categories: Record<string, RegExp[]> = {
  'Smartphone': [...],
  'Sua Nova Categoria': [
    /\b(palavra1|palavra2)\b/i,
  ],
};
```

### Controlar Nível de Generalização

#### Opção 1: Generalização Completa (Atual)
```typescript
// Linha 459
altText = generalizeBrandText(pageData.title, pageData.description);
// Resultado: "Smartphone 64GB 4G"
```

#### Opção 2: Generalização Moderada
```typescript
// Linha 459 - trocar para:
altText = generalizeBrandTextModerate(pageData.title);
// Resultado: "A5 64GB 4G" (remove só a marca, mantém modelo)
```

#### Opção 3: Desativar Generalização
```typescript
// Linha 458 - mudar condição para:
if (false) { // Desativa
```

## 🧪 Como Testar

### Teste 1: Localmente (Desenvolvimento)

```bash
# Terminal 1: Iniciar worker
cd workers
npm run dev

# Terminal 2: Simular Googlebot
curl -H "User-Agent: Googlebot/2.1" http://localhost:8787/products/xiaomi-redmi-a5-64gb
```

Procure no HTML retornado por tags `<img>` e verifique os atributos `alt`.

### Teste 2: Worker Deployed

```bash
# Simular Googlebot
curl -H "User-Agent: Googlebot/2.1" https://shopmi-edge-dev.gustavobressanin6.workers.dev/products/seu-produto

# Simular usuário normal (para comparar)
curl -H "User-Agent: Mozilla/5.0 Chrome/120.0" https://shopmi-edge-dev.gustavobressanin6.workers.dev/products/seu-produto
```

Compare os alt texts nas duas respostas!

### Teste 3: Verificar no Navegador

1. Abra DevTools (F12)
2. Console, execute:
```javascript
// Ver todos alt texts da página
document.querySelectorAll('img').forEach(img => {
  console.log(img.alt);
});
```

3. Use extensão "User-Agent Switcher" para simular Googlebot

## 📊 Monitoramento

### Ver Transformações no Analytics

```bash
# Analytics geral
curl https://shopmi-edge-dev.gustavobressanin6.workers.dev/_analytics

# Queries D1 específicas
npx wrangler d1 execute shopmi-analytics \
  --command="SELECT url, bot_type, COUNT(*) as hits
             FROM transformations
             WHERE bot_type = 'googlebot'
             GROUP BY url
             ORDER BY hits DESC
             LIMIT 20" \
  --remote
```

## ⚠️ Avisos Importantes

### Riscos
1. **Risco Médio de Penalização**: Google pode detectar se muito genérico
2. **Monitoramento Recomendado**: Acompanhe rankings no Google Search Console
3. **Reversível**: Pode desativar a qualquer momento

### Boas Práticas
✅ **FAZER:**
- Manter especificações técnicas (64GB, 4G, etc)
- Manter categoria clara (Smartphone, Fone, etc)
- Generalizar apenas para bots verificados
- Monitorar impacto no SEO

❌ **NÃO FAZER:**
- Generalizar demais ("produto eletrônico" genérico)
- Remover todas informações úteis
- Aplicar para usuários reais
- Criar conteúdo completamente diferente

## 🔄 Deploy das Mudanças

```bash
cd workers

# Re-deploy
npm run deploy:staging

# Ou para produção (quando pronto)
npm run deploy:production
```

## 🐛 Troubleshooting

### Alt text não está sendo modificado

1. Verifique se é realmente Googlebot:
```bash
curl -v -H "User-Agent: Googlebot/2.1" https://seu-worker/_analytics
```

2. Verifique logs do worker:
```bash
npx wrangler tail --env development
```

3. Verifique se página é `/products/*`:
```typescript
// O AI transform só roda em páginas de produto
if (isProductPage(url)) { ... }
```

### Categoria não detectada

Adicione mais patterns em `categories` (linha 495):
```typescript
'Smartphone': [
  /\b(celular|smartphone)\b/i,
  /\b(seu-modelo-aqui)\b/i, // Adicione
],
```

### Specs não sendo extraídas

Adicione mais regex patterns (linhas 550-567):
```typescript
// Exemplo: adicionar "Pro" como spec
const proMatch = title.match(/\b(Pro|Plus|Lite)\b/gi);
if (proMatch) specs.push(...proMatch);
```

## 📈 Próximos Passos Sugeridos

1. **Monitorar por 2-4 semanas** rankings no Google Search Console
2. **A/B Test**: Testar com 50% dos produtos primeiro
3. **Ajustar nível** de generalização baseado em resultados
4. **Expandir para outros bots** (Bing, Yandex) se funcionar bem
5. **Adicionar logging detalhado** de transformações

## 📚 Arquivos Relacionados

- `workers/src/ai-transform.ts` - Lógica de generalização
- `workers/src/bot-detection.ts` - Detecção de bots
- `workers/src/index.ts` - Routing principal
- `CLOUDFLARE_INTEGRATION_PLAN.md` - Plano completo

---

**Versão**: 1.0
**Última atualização**: 20 de Outubro de 2024
**Status**: ✅ Implementado e pronto para deploy
