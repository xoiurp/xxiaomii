# 📱 Guia de Responsividade - Mi Brasil E-commerce

## 📋 Visão Geral

Este documento descreve a estratégia de responsividade implementada no projeto Mi Brasil, uma loja virtual construída com **Next.js 14** e **Tailwind CSS 4**. O projeto segue a abordagem **Mobile-First** e utiliza os breakpoints padrão do Tailwind CSS.

---

## 🎯 Estratégia de Responsividade

### Abordagem: Mobile-First

O projeto adota a filosofia **Mobile-First**, onde:
1. Os estilos base são escritos para dispositivos móveis
2. Media queries progressivas adicionam estilos para telas maiores
3. Componentes são projetados para funcionar bem em telas pequenas primeiro

### Framework CSS: Tailwind CSS 4

O Tailwind CSS é utilizado como framework principal, oferecendo:
- Classes utilitárias responsivas com prefixos (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Sistema de grid flexível
- Componentes facilmente adaptáveis

---

## 📐 Breakpoints Utilizados

O projeto utiliza os breakpoints padrão do Tailwind CSS:

| Prefixo | Largura Mínima | Dispositivos Típicos |
|---------|----------------|---------------------|
| (base)  | 0px            | Smartphones pequenos |
| `sm:`   | 640px          | Smartphones grandes |
| `md:`   | 768px          | Tablets |
| `lg:`   | 1024px         | Laptops |
| `xl:`   | 1280px         | Desktops |
| `2xl:`  | 1536px         | Monitores grandes |

### Breakpoint Customizado

Além dos padrões, o projeto utiliza um breakpoint customizado:

```css
min-[990px]:  /* Usado para ajustes específicos no header */
```

---

## 🧩 Componentes e Suas Estratégias Responsivas

### 1. Header (`src/components/layout/Header.tsx`)

O Header é um dos componentes mais complexos em termos de responsividade.

#### Estrutura Responsiva:

**Barra de Promoções:**
```tsx
{/* Mobile: Slider horizontal animado */}
<div className="block md:hidden overflow-hidden relative whitespace-nowrap">
  <div className="flex animate-slide gap-8 px-4">
    {/* Itens de promoção */}
  </div>
</div>

{/* Desktop: Layout flexbox centralizado */}
<div className="hidden md:flex flex-wrap justify-center gap-4 text-sm font-medium">
  {/* Itens de promoção */}
</div>
```

**Menu de Navegação:**
- **Mobile (< 768px):** Menu hambúrguer com Sheet lateral (Radix UI)
- **Desktop (≥ 768px):** NavigationMenu horizontal com mega menus

```tsx
{/* Desktop Navigation */}
<nav className="hidden md:flex">
  <NavigationMenu>
    {/* Menu items com mega menus */}
  </NavigationMenu>
</nav>

{/* Mobile Menu Button */}
<div className="md:hidden">
  <Sheet>
    {/* Menu lateral com Accordion */}
  </Sheet>
</div>
```

**Barra de Busca:**
```tsx
{/* Desktop: Visível com largura máxima */}
<div className="hidden md:flex flex-1 max-w-md mx-8">
  <form>
    <input className="... min-[990px]:p-0 min-[990px]:pl-5 min-[990px]:pr-[50px] min-[990px]:h-[35px] ..." />
  </form>
</div>

{/* Mobile: Dentro do Sheet lateral */}
```

**Carrinho (Sheet):**
```tsx
<SheetContent className="w-full md:max-w-md p-0 flex flex-col" side="right">
  {/* Mobile: Largura total */}
  {/* Desktop: Máximo 448px (md:max-w-md) */}
</SheetContent>
```

---

### 2. Página Home (`src/app/page.tsx`)

#### Seção de Benefícios:
```tsx
<section className="w-full py-8 md:py-12">
  <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {/* 
      Mobile: 1 coluna
      Tablet pequeno (640px+): 2 colunas
      Tablet/Desktop (768px+): 4 colunas
    */}
  </div>
</section>
```

#### Grid de Produtos:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {/* 
    Mobile: 1 coluna
    sm (640px+): 2 colunas
    md (768px+): 3 colunas
    lg (1024px+): 4 colunas
  */}
</div>
```

#### Newsletter:
```tsx
<section className="bg-[#FF6700] text-white rounded-lg p-8 md:p-12">
  {/* Padding responsivo: 32px mobile, 48px desktop */}
  
  <h2 className="text-2xl md:text-3xl font-bold mb-4">
    {/* Tamanho de fonte responsivo */}
  </h2>
  
  <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
    {/* 
      Mobile: Campos empilhados verticalmente
      sm (640px+): Campos lado a lado
    */}
  </form>
</section>
```

---

### 3. BannerSlider (`src/components/layout/BannerSlider.tsx`)

```tsx
<div className="w-full aspect-[2.2] relative mb-12 group">
  {/* 
    - Largura total (100%)
    - Aspect ratio fixo de 2.2:1 para manter proporção
    - Margem inferior de 48px
  */}
  <Swiper>
    <Image fill className="object-cover" />
    {/* Imagem cobre todo o container mantendo proporção */}
  </Swiper>
</div>
```

---

### 4. CategorySlider (`src/components/layout/CategorySlider.tsx`)

```tsx
<Swiper
  slidesPerView={1}
  spaceBetween={20}
  breakpoints={{
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 20,
    },
  }}
>
  {/* 
    Mobile: 1 slide visível
    sm (640px+): 2 slides visíveis
    md (768px+): 3 slides visíveis
  */}
</Swiper>
```

**Cards de Categoria:**
```tsx
<div className="relative" style={{ width: '360px' }}>
  <div className="rounded-lg overflow-hidden relative h-[480px]">
    {/* Altura fixa de 480px para consistência */}
  </div>
</div>
```

---

### 5. ProductCard (`src/components/product/ProductCard.tsx`)

```tsx
<div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
  {/* Container do card */}
  
  <Link className="block relative h-64 overflow-hidden">
    {/* Altura fixa de 256px para imagem */}
    <Image
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-scale-down group-hover:scale-105 transition-transform duration-300"
    />
    {/* 
      sizes: Otimização de carregamento de imagem
      - Mobile: 100% da viewport
      - Tablet: 50% da viewport
      - Desktop: 33% da viewport
    */}
  </Link>
  
  <button className="... opacity-0 group-hover:opacity-100 ...">
    {/* Botão aparece apenas no hover (desktop) */}
  </button>
</div>
```

---

### 6. Checkout Page (`src/app/checkout/page.tsx`)

#### Layout Principal:
```tsx
<main className="max-w-7xl mx-auto px-4 py-8">
  <div className="grid lg:grid-cols-3 gap-8">
    {/* Formulário */}
    <div className="lg:col-span-2">
      {/* 
        Mobile/Tablet: Largura total
        Desktop (1024px+): 2/3 da largura
      */}
    </div>
    
    {/* Resumo do Pedido */}
    <div className="lg:col-span-1">
      {/* 
        Mobile/Tablet: Largura total (abaixo do formulário)
        Desktop (1024px+): 1/3 da largura (sidebar)
      */}
      <div className="... sticky top-24">
        {/* Sticky no desktop para acompanhar scroll */}
      </div>
    </div>
  </div>
</main>
```

#### Formulários:
```tsx
{/* Campos de dados pessoais */}
<div className="grid sm:grid-cols-2 gap-4">
  <div className="sm:col-span-2">
    {/* Nome e Email: Largura total */}
  </div>
  <div>
    {/* CPF: Metade da largura em sm+ */}
  </div>
  <div>
    {/* Telefone: Metade da largura em sm+ */}
  </div>
</div>

{/* Campos de endereço */}
<div className="grid sm:grid-cols-3 gap-4">
  {/* 
    Mobile: 1 coluna
    sm (640px+): 3 colunas
  */}
</div>
```

#### Métodos de Pagamento:
```tsx
<div className="grid sm:grid-cols-3 gap-3">
  {/* 
    Mobile: 1 coluna (botões empilhados)
    sm (640px+): 3 colunas (botões lado a lado)
  */}
</div>
```

---

### 7. CartDrawer (`src/components/cart/CartDrawer.tsx`)

```tsx
<SheetContent className="w-full md:max-w-md p-0 flex flex-col" side="right">
  {/* 
    Mobile: Largura total da tela
    Desktop (768px+): Máximo 448px
  */}
  
  <div className="flex-grow overflow-y-auto p-4">
    {/* Área scrollável para itens do carrinho */}
  </div>
  
  <div className="border-t p-4 bg-gray-50">
    {/* Footer fixo com totais e botão de checkout */}
  </div>
</SheetContent>
```

---

## 🎨 Padrões de Design Responsivo

### 1. Containers

```tsx
{/* Container padrão com largura máxima */}
<div className="container mx-auto px-4">
  {/* Centralizado com padding lateral */}
</div>

{/* Container com largura máxima específica */}
<div className="max-w-7xl mx-auto px-4">
  {/* Máximo 1280px */}
</div>

<div className="max-w-3xl mx-auto">
  {/* Máximo 768px - usado para formulários */}
</div>
```

### 2. Grids Responsivos

```tsx
{/* Grid de produtos */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

{/* Grid de benefícios */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

{/* Grid de formulário */}
<div className="grid sm:grid-cols-2 gap-4">

{/* Grid de checkout */}
<div className="grid lg:grid-cols-3 gap-8">
```

### 3. Visibilidade Condicional

```tsx
{/* Apenas mobile */}
<div className="block md:hidden">

{/* Apenas desktop */}
<div className="hidden md:flex">

{/* Texto oculto em mobile */}
<span className="hidden sm:inline">Texto completo</span>
```

### 4. Espaçamento Responsivo

```tsx
{/* Padding responsivo */}
<section className="py-8 md:py-12">

{/* Margin responsivo */}
<div className="mb-6 md:mb-8">

{/* Gap responsivo */}
<div className="gap-4 md:gap-6 lg:gap-8">
```

### 5. Tipografia Responsiva

```tsx
{/* Títulos */}
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

<h2 className="text-xl md:text-2xl font-bold">

{/* Texto */}
<p className="text-sm md:text-base">
```

---

## 📱 Componentes Mobile-Specific

### Menu Mobile (Sheet)

```tsx
<Sheet>
  <SheetTrigger asChild>
    <button className="md:hidden">
      {/* Ícone hambúrguer */}
    </button>
  </SheetTrigger>
  <SheetContent side="left" className="w-4/5 max-w-sm p-0">
    {/* 
      - Abre da esquerda
      - 80% da largura da tela
      - Máximo 384px
    */}
    <Accordion type="multiple">
      {/* Categorias expansíveis */}
    </Accordion>
  </SheetContent>
</Sheet>
```

### Barra de Promoções Animada (Mobile)

```tsx
<div className="block md:hidden overflow-hidden relative whitespace-nowrap">
  <div className="flex animate-slide gap-8 px-4">
    {/* Animação CSS de slide horizontal */}
  </div>
</div>
```

---

## 🖼️ Otimização de Imagens

### Next.js Image com sizes

```tsx
<Image
  src={src}
  alt={alt}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

**Explicação do `sizes`:**
- `(max-width: 768px) 100vw`: Em mobile, imagem ocupa 100% da viewport
- `(max-width: 1200px) 50vw`: Em tablet, imagem ocupa 50% da viewport
- `33vw`: Em desktop, imagem ocupa 33% da viewport

### Object-fit Strategies

```tsx
{/* Cobrir todo o container */}
<Image className="object-cover" />

{/* Manter proporção dentro do container */}
<Image className="object-contain" />

{/* Escalar para baixo mantendo proporção */}
<Image className="object-scale-down" />
```

---

## 🔧 Configuração do Tailwind

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-misans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

### globals.css - Variáveis CSS

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --font-sans: 'MiSans', sans-serif;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  /* Cores e outras variáveis */
}
```

---

## ✅ Checklist de Responsividade

### Header
- [x] Barra de promoções: Slider no mobile, flex no desktop
- [x] Logo: Visível em todos os tamanhos
- [x] Menu: Hambúrguer no mobile, horizontal no desktop
- [x] Busca: Dentro do menu no mobile, visível no desktop
- [x] Carrinho: Sheet lateral responsivo
- [x] Ícones: Tamanho consistente

### Home
- [x] Banner: Aspect ratio responsivo
- [x] Benefícios: Grid 1→2→4 colunas
- [x] Categorias: Slider com breakpoints
- [x] Produtos: Grid 1→2→3→4 colunas
- [x] Newsletter: Form empilhado→horizontal

### Checkout
- [x] Layout: Coluna única→sidebar
- [x] Formulários: Campos responsivos
- [x] Resumo: Sticky no desktop
- [x] Botões de pagamento: Grid responsivo

### Componentes
- [x] ProductCard: Imagem com sizes otimizado
- [x] CartDrawer: Largura total→máxima
- [x] Sliders: Breakpoints configurados

---

## 🚀 Melhorias Futuras Sugeridas

### 1. Imagens Responsivas por Dispositivo
```tsx
{/* Implementar diferentes imagens para mobile/desktop */}
<picture>
  <source media="(max-width: 768px)" srcSet="/mobile-banner.webp" />
  <source media="(min-width: 769px)" srcSet="/desktop-banner.webp" />
  <img src="/desktop-banner.webp" alt="Banner" />
</picture>
```

### 2. Lazy Loading de Componentes
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### 3. Container Queries (CSS)
```css
@container (min-width: 400px) {
  .card {
    /* Estilos baseados no container, não na viewport */
  }
}
```

### 4. Testes de Responsividade
- Implementar testes visuais com Playwright
- Testar em dispositivos reais
- Usar Chrome DevTools Device Mode

---

## 📊 Resumo de Breakpoints por Componente

| Componente | Mobile | sm (640px) | md (768px) | lg (1024px) | xl (1280px) |
|------------|--------|------------|------------|-------------|-------------|
| Header Menu | Hambúrguer | Hambúrguer | Horizontal | Horizontal | Horizontal |
| Promo Bar | Slider | Slider | Flex | Flex | Flex |
| Product Grid | 1 col | 2 cols | 3 cols | 4 cols | 4 cols |
| Benefits | 1 col | 2 cols | 4 cols | 4 cols | 4 cols |
| Category Slider | 1 slide | 2 slides | 3 slides | 3 slides | 3 slides |
| Checkout | 1 col | 1 col | 1 col | 2 cols + sidebar | 2 cols + sidebar |
| Cart Drawer | 100% | 100% | max 448px | max 448px | max 448px |
| Newsletter Form | Stack | Inline | Inline | Inline | Inline |

---

## 📝 Conclusão

O projeto Mi Brasil implementa uma estratégia de responsividade robusta utilizando:

1. **Tailwind CSS** para classes utilitárias responsivas
2. **Abordagem Mobile-First** para garantir boa experiência em dispositivos móveis
3. **Componentes Radix UI** (Sheet, Accordion) para interações mobile-friendly
4. **Swiper.js** com breakpoints para sliders responsivos
5. **Next.js Image** com otimização automática de imagens

A arquitetura permite fácil manutenção e extensão, seguindo padrões consistentes em todo o projeto.

---

**Última atualização:** Janeiro 2026
**Versão:** 1.0.0
