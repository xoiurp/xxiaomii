# 📘 Guia de Padronização de Tipografia - Mi Brasil

## 🎯 Objetivo
Este guia estabelece padrões consistentes de tipografia para toda a plataforma Mi Brasil, garantindo uma experiência visual unificada e profissional.

---

## 🔤 Fonte Principal

**MiSans** - Fonte oficial do ecossistema Xiaomi
- **Carregamento**: Via `next/font/local` no `layout.tsx`
- **Variável CSS**: `--font-misans`
- **Pesos disponíveis**: 100 (Thin) a 900 (Heavy)

### Configuração no Tailwind

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-misans)', 'sans-serif'],
}
```

### Uso no CSS Global

```css
/* globals.css */
--font-sans: 'MiSans', sans-serif;
```

---

## 📏 Escala Tipográfica

### Tokens Personalizados do Tailwind

Use os tokens personalizados definidos no `tailwind.config.ts` para manter consistência:

```tsx
// Exemplo de uso com tokens personalizados
<h1 className="text-hero md:text-hero-md lg:text-hero-lg">
  Título Principal
</h1>
<p className="text-body md:text-body-md">
  Texto de corpo responsivo
</p>
```

### Tokens Disponíveis

| Token | Tamanho | Line Height | Weight | Uso |
|-------|---------|-------------|--------|-----|
| `text-hero` | 24px (1.5rem) | 1.2 | 700 | Títulos principais mobile |
| `text-hero-sm` | 30px (1.875rem) | 1.25 | 700 | Títulos tablet |
| `text-hero-md` | 36px (2.25rem) | 1.2 | 700 | Títulos desktop |
| `text-hero-lg` | 48px (3rem) | 1.1 | 700 | Títulos grandes |
| `text-section` | 18px (1.125rem) | 1.4 | 600 | Títulos de seção mobile |
| `text-section-sm` | 20px (1.25rem) | 1.4 | 600 | Seção tablet |
| `text-section-md` | 24px (1.5rem) | 1.3 | 600 | Seção desktop |
| `text-card-title` | 14px (0.875rem) | 1.4 | 500 | Cards mobile |
| `text-card-title-sm` | 16px (1rem) | 1.5 | 500 | Cards tablet |
| `text-card-title-md` | 18px (1.125rem) | 1.5 | 500 | Cards desktop |
| `text-price` | 16px (1rem) | 1.2 | 600 | Preço mobile |
| `text-price-sm` | 18px (1.125rem) | 1.2 | 600 | Preço tablet |
| `text-price-md` | 20px (1.25rem) | 1.2 | 600 | Preço desktop |
| `text-body` | 12px (0.75rem) | 1.5 | 400 | Corpo mobile |
| `text-body-sm` | 14px (0.875rem) | 1.6 | 400 | Corpo tablet/desktop |
| `text-body-md` | 16px (1rem) | 1.6 | 400 | Corpo desktop large |
| `text-caption` | 10px (0.625rem) | 1.4 | 400 | Legendas mobile |
| `text-caption-sm` | 12px (0.75rem) | 1.4 | 400 | Legendas tablet/desktop |
| `text-button` | 12px (0.75rem) | 1.5 | 500 | Botões mobile |
| `text-button-sm` | 14px (0.875rem) | 1.5 | 500 | Botões tablet/desktop |
| `text-nav` | 12px (0.75rem) | 1.4 | 500 | Navegação mobile |
| `text-nav-sm` | 14px (0.875rem) | 1.4 | 500 | Navegação tablet |
| `text-nav-md` | 16px (1rem) | 1.4 | 500 | Navegação desktop |

### Uso Responsivo com Tokens

```tsx
// Título de página responsivo
<h1 className="text-hero md:text-hero-md lg:text-hero-lg">
  Título Principal
</h1>

// Preço de produto responsivo
<span className="text-price md:text-price-md">
  R$ 2.999,00
</span>

// Texto de corpo responsivo
<p className="text-body md:text-body-sm">
  Descrição do produto
</p>

// Navegação responsiva
<nav className="text-nav md:text-nav-sm lg:text-nav-md">
  <a href="#">Link</a>
</nav>
```

---

## 🎨 Cores de Texto

### Hierarquia de Cores

| Uso | Classe Tailwind | Hex | Exemplo |
|-----|----------------|-----|---------|
| **Texto primário** | `text-gray-900` | `#111827` | Títulos principais |
| **Texto secundário** | `text-gray-700` | `#374151` | Subtítulos |
| **Texto terciário** | `text-gray-600` | `#4B5563` | Descrições |
| **Texto quaternário** | `text-gray-500` | `#6B7280` | Informações auxiliares |
| **Texto desabilitado** | `text-gray-400` | `#9CA3AF` | Estados desabilitados |
| **Texto de marca** | `text-[#FF6700]` | `#FF6700` | Preços, CTAs, links |
| **Texto de sucesso** | `text-green-700` | `#15803D` | Em estoque, confirmações |
| **Texto de alerta** | `text-orange-700` | `#C2410C` | Poucas unidades |
| **Texto de erro** | `text-red-700` | `#B91C1C` | Esgotado, erros |

### Cores de Fundo para Texto

| Uso | Classe Tailwind | Hex |
|-----|----------------|-----|
| **Tag sucesso** | `bg-green-100` | `#DCFCE7` |
| **Tag alerta** | `bg-orange-100` | `#FFEDD5` |
| **Tag erro** | `bg-red-100` | `#FEE2E2` |

---

## ⚖️ Pesos de Fonte (Font Weight)

| Peso | Valor | Uso |
|------|-------|-----|
| `font-thin` | 100 | Não recomendado para texto |
| `font-extralight` | 200 | Não recomendado para texto |
| `font-light` | 300 | Descrições longas, textos secundários |
| `font-normal` | 400 | Textos de corpo padrão |
| `font-medium` | 500 | Títulos de cards, botões, navegação |
| `font-semibold` | 600 | Títulos de seção, preços |
| `font-bold` | 700 | Títulos de página, destaques |
| `font-extrabold` | 800 | Não recomendado (não existe na MiSans) |
| `font-black` | 900 | Apenas para grandes destaques |

---

## 📐 Line Height (Altura de Linha)

| Token | Valor | Uso |
|-------|-------|-----|
| `leading-none` | 1 | Números grandes, preços |
| `leading-tight` | 1.25 | Títulos compactos |
| `leading-snug` | 1.375 | Títulos padrão |
| `leading-normal` | 1.5 | Textos de corpo |
| `leading-relaxed` | 1.625 | Descrições longas |
| `leading-loose` | 2 | Não recomendado |

---

## 📝 Exemplos de Uso por Componente

### Header/Navbar

```tsx
// Logo
<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
  Mi Brasil
</h1>

// Links de navegação
<a className="text-sm sm:text-base font-medium text-gray-700 hover:text-[#FF6700]">
  Categorias
</a>

// Ícones com label (mobile)
<span className="text-[10px] font-medium text-gray-600">
  Carrinho
</span>
```

### ProductCard

```tsx
// Título do produto
<h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 line-clamp-2">
  {title}
</h3>

// Preço atual
<span className="text-base sm:text-lg font-semibold text-[#FF6700]">
  R$ 2.999,00
</span>

// Preço antigo (riscado)
<span className="text-xs sm:text-sm font-normal text-gray-500 line-through">
  R$ 3.499,00
</span>

// Desconto
<span className="text-[10px] sm:text-xs font-medium text-green-700">
  15% OFF
</span>

// Status de estoque
<span className="text-[10px] sm:text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
  Em estoque
</span>

// Botão
<button className="text-xs sm:text-sm font-medium text-white">
  Adicionar
</button>
```

### Seção de Benefícios (Home)

```tsx
// Título do benefício
<h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">
  Produtos Oficiais
</h3>

// Descrição
<p className="hidden sm:block text-xs sm:text-sm text-gray-600">
  Loja Oficial Xiaomi Brasil.
</p>
```

### Página de Shop/Filtros

```tsx
// Título da página
<h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
  Smartphones
</h1>

// Label de filtro
<label className="text-sm font-medium text-gray-700">
  Ordenar por:
</label>

// Opção de filtro
<option className="text-sm text-gray-900">
  Menor preço
</option>

// Contador de resultados
<span className="text-xs sm:text-sm text-gray-500">
  42 produtos encontrados
</span>
```

### Footer

```tsx
// Título da coluna
<h3 className="text-base sm:text-lg font-semibold text-gray-900">
  Sobre Nós
</h3>

// Links
<a className="text-sm text-gray-600 hover:text-[#FF6700]">
  Categorias
</a>

// Copyright
<p className="text-xs text-gray-500">
  © 2024 Mi Brasil. Todos os direitos reservados.
</p>
```

### Formulários (Newsletter)

```tsx
// Título
<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
  Inscreva-se em nossa newsletter
</h2>

// Descrição
<p className="text-sm sm:text-base text-white/90">
  Receba as últimas novidades...
</p>

// Input placeholder
<input 
  placeholder="Seu e-mail"
  className="text-sm sm:text-base placeholder-white/80"
/>

// Botão
<button className="text-sm sm:text-base font-medium">
  Inscrever-se
</button>

// Mensagem de feedback
<p className="text-xs sm:text-sm text-center">
  Obrigado por se inscrever!
</p>
```

---

## 🎭 Estados de Texto

### Hover States

```tsx
// Links
className="text-gray-600 hover:text-[#FF6700] transition-colors"

// Botões secundários
className="text-gray-700 hover:text-gray-900 transition-colors"
```

### Focus States

```tsx
// Inputs
className="focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:text-gray-900"
```

### Disabled States

```tsx
// Botões desabilitados
className="text-gray-400 cursor-not-allowed"
```

---

## 🧩 Classes Utilitárias Recomendadas

### Truncamento de Texto

```tsx
// Limitar a 1 linha
className="truncate"

// Limitar a 2 linhas
className="line-clamp-2"

// Limitar a 3 linhas
className="line-clamp-3"
```

### Transformação de Texto

```tsx
// Maiúsculas (usar com moderação)
className="uppercase text-xs tracking-wider"

// Capitalizado
className="capitalize"
```

### Espaçamento entre Letras

```tsx
// Labels, tags
className="text-xs tracking-wider uppercase"

// Títulos grandes
className="text-2xl tracking-tight"
```

---

## ✅ Checklist de Revisão

Antes de finalizar um componente, verifique:

- [ ] Todos os tamanhos de fonte usam tokens responsivos (`sm:text-*`, `md:text-*`)
- [ ] O peso da fonte é apropriado para a hierarquia visual
- [ ] As cores de texto seguem a paleta definida
- [ ] O line-height está adequado para o tamanho da fonte
- [ ] Estados de hover/focus/disabled estão definidos
- [ ] O contraste entre texto e fundo é adequado (acessibilidade)
- [ ] Textos longos têm truncamento adequado (line-clamp)

---

## 📱 Breakpoints

Lembre-se de sempre testar em todos os breakpoints:

- **xs**: 375px (iPhone SE)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

---

## 🔄 Manutenção

Este guia deve ser atualizado quando:
- Novos componentes forem criados
- A fonte principal for alterada
- Novas cores forem adicionadas ao tema
- Padrões de acessibilidade forem atualizados

---

**Última atualização**: Janeiro 2025
**Responsável**: Equipe de Design Mi Brasil