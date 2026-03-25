# 🔄 Guia de Migração de Tipografia - Mi Brasil

Este guia mostra como migrar do uso de classes Tailwind padrão para os tokens personalizados de tipografia.

---

## 📋 Antes vs Depois

### 1. Título de Página

**Antes (classes padrão):**
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Produtos Xiaomi
</h1>
```

**Depois (tokens personalizados):**
```tsx
<h1 className="text-hero md:text-hero-md lg:text-hero-lg">
  Produtos Xiaomi
</h1>
```

---

### 2. Título de Seção

**Antes:**
```tsx
<h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
  Produtos em Destaque
</h2>
```

**Depois:**
```tsx
<h2 className="text-section md:text-section-md">
  Produtos em Destaque
</h2>
```

---

### 3. Título de Card (ProductCard)

**Antes:**
```tsx
<h3 className="text-sm sm:text-base md:text-lg font-medium">
  Smartphone Redmi Note 13
</h3>
```

**Depois:**
```tsx
<h3 className="text-card-title md:text-card-title-md">
  Smartphone Redmi Note 13
</h3>
```

---

### 4. Preço de Produto

**Antes:**
```tsx
<span className="text-base sm:text-lg font-semibold text-[#FF6700]">
  R$ 2.999,00
</span>
```

**Depois:**
```tsx
<span className="text-price md:text-price-md text-[#FF6700]">
  R$ 2.999,00
</span>
```

---

### 5. Texto de Corpo

**Antes:**
```tsx
<p className="text-xs sm:text-sm md:text-base text-gray-600">
  Descrição do produto com detalhes técnicos e especificações.
</p>
```

**Depois:**
```tsx
<p className="text-body md:text-body-md text-gray-600">
  Descrição do produto com detalhes técnicos e especificações.
</p>
```

---

### 6. Legendas e Tags

**Antes:**
```tsx
<span className="text-[10px] sm:text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
  Em estoque
</span>
```

**Depois:**
```tsx
<span className="text-caption md:text-caption-sm font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
  Em estoque
</span>
```

---

### 7. Botões

**Antes:**
```tsx
<button className="text-xs sm:text-sm font-medium">
  Adicionar ao carrinho
</button>
```

**Depois:**
```tsx
<button className="text-button md:text-button-sm">
  Adicionar ao carrinho
</button>
```

---

### 8. Navegação

**Antes:**
```tsx
<nav className="text-xs sm:text-sm md:text-base font-medium">
  <a href="#">Link</a>
</nav>
```

**Depois:**
```tsx
<nav className="text-nav md:text-nav-md">
  <a href="#">Link</a>
</nav>
```

---

## 🛠️ Componentes para Migrar

### ProductCard.tsx

**Localização:** `src/components/product/ProductCard.tsx`

**Migrações necessárias:**
```tsx
// Linha 53 - Título do produto
// Antes: text-sm sm:text-base md:text-lg font-bold text-gray-900
// Depois: text-card-title md:text-card-title-md font-medium text-gray-900

// Linha 62 - Texto de estoque
// Antes: text-[10px] sm:text-xs font-medium
// Depois: text-caption md:text-caption-sm font-medium

// Linha 82 - Cores de variante
// Antes: text-[10px] sm:text-xs text-gray-500
// Depois: text-caption md:text-caption-sm text-gray-500

// Linha 88 - Preço riscado
// Antes: text-gray-500 line-through text-xs sm:text-sm
// Depois: text-body-sm text-gray-500 line-through

// Linha 91 - Preço principal
// Antes: text-[#FF6700] font-semibold text-base sm:text-lg
// Depois: text-price md:text-price-md text-[#FF6700]

// Linha 95 - Desconto
// Antes: text-[10px] sm:text-xs text-green-600
// Depois: text-caption md:text-caption-sm text-green-600

// Linha 105 - Botão
// Antes: text-xs sm:text-sm font-medium
// Depois: text-button md:text-button-sm font-medium
```

### page.tsx (Home)

**Localização:** `src/app/page.tsx`

**Migrações necessárias:**
```tsx
// Linha 87 - Título de benefício
// Antes: font-semibold text-xs sm:text-sm md:text-base
// Depois: text-section-sm md:text-section

// Linha 88 - Descrição de benefício
// Antes: text-gray-600 text-[10px] sm:text-xs md:text-sm
// Depois: text-caption md:text-body text-gray-600

// Linha 115 - Título de produtos
// Antes: text-lg sm:text-xl md:text-2xl font-bold
// Depois: text-section md:text-section-md font-semibold

// Linha 117 - Link "Ver todos"
// Antes: text-sm sm:text-base font-medium
// Depois: text-nav md:text-nav-md

// Linha 138 - Título "Por que escolher"
// Antes: text-lg sm:text-xl md:text-2xl font-bold
// Depois: text-section md:text-section-md font-semibold

// Linha 167 - Título de benefício
// Antes: text-sm sm:text-base md:text-lg font-semibold
// Depois: text-section-sm md:text-section

// Linha 170 - Descrição de benefício
// Antes: text-gray-600 text-xs sm:text-sm
// Depois: text-body md:text-body-sm text-gray-600

// Linha 181 - Título da newsletter
// Antes: text-xl sm:text-2xl md:text-3xl font-bold
// Depois: text-hero-sm md:text-hero-md

// Linha 184 - Descrição da newsletter
// Antes: text-sm sm:text-base
// Depois: text-body-sm md:text-body-md

// Linha 191 - Input
// Antes: text-sm sm:text-base
// Depois: text-body-sm md:text-body-md

// Linha 198 - Botão
// Antes: text-sm sm:text-base font-medium
// Depois: text-button md:text-button-sm

// Linha 202 - Mensagem
// Antes: text-xs sm:text-sm
// Depois: text-caption md:text-caption-sm
```

### SortSelect.tsx

**Localização:** `src/components/shop/SortSelect.tsx`

**Migrações necessárias:**
```tsx
// Label
// Antes: text-sm font-medium
// Depois: text-nav-sm font-medium

// Trigger
// Antes: text-sm
// Depois: text-nav-sm

// Items
// Antes: text-sm
// Depois: text-nav-sm
```

### shop/page.tsx

**Localização:** `src/app/shop/page.tsx`

**Migrações necessárias:**
```tsx
// Título da página
// Antes: text-2xl font-bold
// Depois: text-hero font-bold

// Contador de produtos
// Antes: text-sm text-gray-500
// Depois: text-nav-sm text-gray-500

// Botão "Filtros"
// Antes: text-sm font-medium
// Depois: text-nav-sm font-medium

// Título do Sheet de filtros
// Antes: text-lg font-semibold
// Depois: text-section font-semibold
```

### shop/[category]/page.tsx

**Localização:** `src/app/shop/[category]/page.tsx`

**Migrações necessárias:**
```tsx
// Breadcrumb
// Antes: text-sm text-gray-500
// Depois: text-nav-sm text-gray-500

// Título da categoria
// Antes: text-2xl font-bold
// Depois: text-hero font-bold

// Descrição da categoria
// Antes: text-sm text-gray-600
// Depois: text-nav-sm text-gray-600
```

### CartDrawer.tsx

**Localização:** `src/components/cart/CartDrawer.tsx`

**Migrações necessárias:**
```tsx
// Título "Carrinho"
// Antes: text-lg font-semibold
// Depois: text-section font-semibold

// Nome do produto
// Antes: text-sm font-medium
// Depois: text-card-title font-medium

// Preço
// Antes: text-sm font-semibold text-[#FF6700]
// Depois: text-price font-semibold text-[#FF6700]

// Quantidade
// Antes: text-xs text-gray-500
// Depois: text-caption text-gray-500

// Subtotal
// Antes: text-sm font-semibold
// Depois: text-price font-semibold

// Total
// Antes: text-lg font-bold
// Depois: text-section font-bold

// Botão "Finalizar compra"
// Antes: text-base font-semibold
// Depois: text-button-sm font-semibold
```

### Header.tsx

**Localização:** `src/components/layout/Header.tsx`

**Migrações necessárias:**
```tsx
// Logo (texto)
// Antes: text-xl sm:text-2xl font-bold
// Depois: text-section-sm md:text-section font-bold

// Links de navegação
// Antes: text-sm font-medium
// Depois: text-nav-sm font-medium

// Label do carrinho (mobile)
// Antes: text-[10px] font-medium
// Depois: text-caption font-medium
```

### CategorySlider.tsx

**Localização:** `src/components/layout/CategorySlider.tsx`

**Migrações necessárias:**
```tsx
// Título da categoria
// Antes: text-base sm:text-lg font-semibold
// Depois: text-card-title-sm md:text-card-title-md font-semibold
```

---

## ✅ Checklist de Migração

Para cada componente:

- [ ] Identificar todos os usos de tamanhos de fonte
- [ ] Mapear para tokens personalizados equivalentes
- [ ] Verificar se os pesos de fonte estão corretos nos tokens
- [ ] Testar em todos os breakpoints (xs, sm, md, lg, xl)
- [ ] Verificar contraste e acessibilidade
- [ ] Revisar espaçamentos relacionados (line-height, margins)

---

## 🎯 Benefícios da Migração

1. **Consistência**: Toda a plataforma usa a mesma escala tipográfica
2. **Manutenibilidade**: Mudanças globais podem ser feitas em um único lugar
3. **Performance**: Menos código CSS gerado (tokens reutilizados)
4. **Documentação**: Tokens servem como documentação viva
5. **Acessibilidade**: Line-heights e pesos otimizados para legibilidade

---

## 🚀 Próximos Passos

1. Migrar componentes existentes gradualmente
2. Atualizar storybook/component library se existir
3. Documentar novos padrões para novos desenvolvedores
4. Criar snippets de código para VS Code
5. Estabelecer linting rules para preferir tokens personalizados

---

**Nota**: A migração pode ser feita gradualmente. Novos componentes devem usar os tokens, e componentes legados podem ser atualizados conforme necessário.