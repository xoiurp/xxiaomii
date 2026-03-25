# 📱 Roadmap de Otimização Mobile - Mi Brasil

## 🎯 Objetivo

Este documento apresenta um plano de ação detalhado para otimizar a experiência mobile do e-commerce Mi Brasil, focando em **performance**, **usabilidade** e **conversão**.

---

## 📊 Diagnóstico Atual

### ✅ Pontos Positivos
- Abordagem Mobile-First implementada
- Tailwind CSS com breakpoints responsivos
- Menu hambúrguer funcional
- Carrinho lateral (Sheet) responsivo
- Grids adaptativos para produtos

### ⚠️ Pontos de Melhoria Identificados

| Área | Problema | Impacto |
|------|----------|---------|
| **Performance** | Imagens não otimizadas para mobile | Alto |
| **UX** | Botão "Adicionar ao carrinho" só aparece no hover | Alto |
| **UX** | CategorySlider com largura fixa (360px) | Médio |
| **Performance** | Carregamento de fontes não otimizado | Médio |
| **UX** | Checkout sem indicador de progresso mobile-friendly | Médio |
| **SEO** | Falta de meta viewport otimizado | Baixo |
| **Acessibilidade** | Touch targets pequenos em alguns botões | Médio |

---

## 🚀 Plano de Ação

### Fase 1: Performance (Prioridade Alta) ⏱️ 2-3 dias

#### 1.1 Otimização de Imagens

**Problema:** Imagens carregam em tamanho desktop mesmo em mobile.

**Solução:**

```tsx
// src/components/product/ProductCard.tsx
<Image
  src={image.transformedSrc}
  alt={image.altText || title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
  className="object-scale-down"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDAAQRBQYSIRMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAECAAMRIf/aAAwDAQACEQMRAD8AzLb+3tPvNuW11cSXAuJELOUkAXkTnA4+qKKKlsYlmJPZ/9k="
/>
```

**Ações:**
- [ ] Adicionar `loading="lazy"` em todas as imagens abaixo do fold
- [ ] Implementar `placeholder="blur"` com blurDataURL
- [ ] Ajustar `sizes` para cada contexto de uso
- [ ] Usar formato WebP/AVIF via Cloudflare Workers (já configurado)

#### 1.2 Lazy Loading de Componentes

**Problema:** Todos os componentes carregam no bundle inicial.

**Solução:**

```tsx
// src/app/page.tsx
import dynamic from 'next/dynamic';

// Carregar componentes pesados apenas quando necessário
const ExclusiveOffersSlider = dynamic(
  () => import('../components/ExclusiveOffersSlider'),
  { 
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false 
  }
);

const CategorySlider = dynamic(
  () => import('../components/layout/CategorySlider'),
  { 
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false 
  }
);
```

**Ações:**
- [ ] Implementar lazy loading para ExclusiveOffersSlider
- [ ] Implementar lazy loading para CategorySlider
- [ ] Adicionar skeleton loaders durante carregamento

#### 1.3 Otimização de Fontes

**Problema:** Fonte MiSans pode causar FOUT (Flash of Unstyled Text).

**Solução:**

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

const misans = localFont({
  src: [
    { path: '../assets/fonts/MiSans-Regular.woff2', weight: '400' },
    { path: '../assets/fonts/MiSans-Medium.woff2', weight: '500' },
    { path: '../assets/fonts/MiSans-Bold.woff2', weight: '700' },
  ],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});
```

**Ações:**
- [ ] Converter fontes para WOFF2
- [ ] Implementar font-display: swap
- [ ] Adicionar fallback fonts
- [ ] Preload apenas fontes críticas

---

### Fase 2: UX Mobile (Prioridade Alta) ⏱️ 3-4 dias

#### 2.1 Botão "Adicionar ao Carrinho" Sempre Visível

**Problema:** O botão só aparece no hover, impossível em touch devices.

**Solução:**

```tsx
// src/components/product/ProductCard.tsx
<button
  onClick={handleAddToCart}
  className="
    mt-4 w-full bg-white text-[#FF6700] py-2 px-4 rounded-md 
    border border-[#FF6700] transition-all text-sm font-medium
    /* Mobile: sempre visível */
    opacity-100
    /* Desktop: aparece no hover */
    md:opacity-0 md:group-hover:opacity-100
    /* Posicionamento */
    md:absolute md:bottom-4 md:left-4 md:w-[calc(100%-2rem)]
  "
>
  Adicionar ao carrinho
</button>
```

**Ações:**
- [ ] Tornar botão sempre visível em mobile
- [ ] Manter comportamento hover em desktop
- [ ] Ajustar espaçamento do card para acomodar botão

#### 2.2 CategorySlider Responsivo

**Problema:** Cards com largura fixa de 360px quebram em telas menores.

**Solução:**

```tsx
// src/components/layout/CategorySlider.tsx
<SwiperSlide key={category.id}>
  <Link href={`/shop/${category.handle}`} className="block">
    {/* Largura responsiva em vez de fixa */}
    <div className="relative w-full max-w-[360px] mx-auto">
      <div className="rounded-lg overflow-hidden relative aspect-[3/4]">
        {/* aspect-ratio em vez de altura fixa */}
        {category.image && category.image.transformedSrc ? (
          <Image
            src={category.image.transformedSrc}
            alt={category.image.altText || category.title}
            fill
            className="object-cover"
          />
        ) : (
          // Placeholder
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 ...">
        <h3 className="text-white text-lg md:text-xl font-bold uppercase truncate">
          {category.title}
        </h3>
      </div>
    </div>
  </Link>
</SwiperSlide>
```

**Ações:**
- [ ] Remover largura fixa de 360px
- [ ] Usar aspect-ratio em vez de altura fixa
- [ ] Ajustar tamanho de fonte responsivo

#### 2.3 Touch Targets Adequados

**Problema:** Alguns botões e links são muito pequenos para toque.

**Solução (mínimo 44x44px):**

```tsx
// Ícones de navegação
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <svg className="h-5 w-5" />
</button>

// Links de navegação
<Link className="py-3 px-4 min-h-[44px] flex items-center">
  Categoria
</Link>
```

**Ações:**
- [ ] Auditar todos os touch targets
- [ ] Aumentar padding em botões pequenos
- [ ] Garantir mínimo de 44x44px em elementos clicáveis

#### 2.4 Checkout Mobile-Friendly

**Problema:** Indicador de progresso pode ser confuso em mobile.

**Solução:**

```tsx
// src/app/checkout/page.tsx
{/* Progress - Mobile Optimized */}
<div className="bg-white border-b">
  <div className="max-w-3xl mx-auto px-4 py-4">
    {/* Mobile: Mostrar apenas step atual e total */}
    <div className="flex md:hidden items-center justify-between">
      <span className="text-sm text-gray-500">
        Passo {currentStepIndex + 1} de {steps.length}
      </span>
      <span className="text-sm font-medium text-[#FF6700]">
        {steps[currentStepIndex].label}
      </span>
    </div>
    
    {/* Desktop: Mostrar todos os steps */}
    <div className="hidden md:flex items-center justify-between">
      {steps.map((step, index) => (
        // ... código existente
      ))}
    </div>
    
    {/* Progress bar mobile */}
    <div className="mt-2 md:hidden h-1 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-[#FF6700] transition-all duration-300"
        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
      />
    </div>
  </div>
</div>
```

**Ações:**
- [ ] Simplificar indicador de progresso em mobile
- [ ] Adicionar barra de progresso visual
- [ ] Melhorar feedback de navegação entre steps

---

### Fase 3: Performance Avançada (Prioridade Média) ⏱️ 2-3 dias

#### 3.1 Prefetch de Rotas Críticas

```tsx
// src/components/layout/Header.tsx
import { useRouter } from 'next/navigation';

// Prefetch de rotas mais acessadas
useEffect(() => {
  router.prefetch('/shop');
  router.prefetch('/checkout');
  router.prefetch('/cart');
}, [router]);
```

#### 3.2 Service Worker para Cache

```tsx
// next.config.mjs
const nextConfig = {
  // ... outras configs
  
  // PWA config (usando next-pwa)
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/cdn\.shopify\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'shopify-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
          },
        },
      },
    ],
  },
};
```

**Ações:**
- [ ] Instalar e configurar next-pwa
- [ ] Definir estratégias de cache
- [ ] Implementar offline fallback

#### 3.3 Otimização de Bundle

```bash
# Analisar bundle
npm install @next/bundle-analyzer

# next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Ações:**
- [ ] Analisar tamanho do bundle
- [ ] Identificar dependências pesadas
- [ ] Implementar code splitting onde necessário

---

### Fase 4: Acessibilidade Mobile (Prioridade Média) ⏱️ 1-2 dias

#### 4.1 Focus States para Touch

```css
/* globals.css */
@media (hover: none) {
  /* Estilos para dispositivos touch */
  .touch-highlight {
    -webkit-tap-highlight-color: rgba(255, 103, 0, 0.2);
  }
  
  button:active,
  a:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
```

#### 4.2 Skip Links

```tsx
// src/app/layout.tsx
<body>
  <a 
    href="#main-content" 
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
               bg-[#FF6700] text-white px-4 py-2 rounded-md z-50"
  >
    Pular para conteúdo principal
  </a>
  <Header />
  <main id="main-content">
    {children}
  </main>
</body>
```

#### 4.3 Reduced Motion

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Ações:**
- [ ] Implementar tap highlight
- [ ] Adicionar skip links
- [ ] Respeitar prefers-reduced-motion
- [ ] Testar com VoiceOver/TalkBack

---

### Fase 5: Testes e Monitoramento (Contínuo) ⏱️ Ongoing

#### 5.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://mibrasil.com/
            https://mibrasil.com/shop
            https://mibrasil.com/checkout
          budgetPath: ./lighthouse-budget.json
```

#### 5.2 Real User Monitoring (RUM)

```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### 5.3 Métricas a Monitorar

| Métrica | Meta Mobile | Atual | Status |
|---------|-------------|-------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ? | 🔍 |
| FID (First Input Delay) | < 100ms | ? | 🔍 |
| CLS (Cumulative Layout Shift) | < 0.1 | ? | 🔍 |
| TTI (Time to Interactive) | < 3.8s | ? | 🔍 |
| Speed Index | < 3.4s | ? | 🔍 |

**Ações:**
- [ ] Configurar Lighthouse CI
- [ ] Implementar Vercel Analytics
- [ ] Definir budgets de performance
- [ ] Criar alertas para regressões

---

## 📋 Checklist de Implementação

### Semana 1: Performance Básica
- [ ] Otimizar imagens com sizes corretos
- [ ] Implementar lazy loading de componentes
- [ ] Otimizar carregamento de fontes
- [ ] Analisar bundle size

### Semana 2: UX Mobile
- [ ] Botão "Adicionar ao carrinho" sempre visível
- [ ] CategorySlider responsivo
- [ ] Touch targets adequados (44x44px)
- [ ] Checkout mobile-friendly

### Semana 3: Performance Avançada
- [ ] Prefetch de rotas críticas
- [ ] Service Worker / PWA
- [ ] Code splitting adicional

### Semana 4: Acessibilidade e Testes
- [ ] Focus states para touch
- [ ] Skip links
- [ ] Reduced motion
- [ ] Configurar Lighthouse CI
- [ ] Implementar RUM

---

## 🎯 Métricas de Sucesso

### KPIs de Performance
- **LCP < 2.5s** em conexão 4G
- **FID < 100ms** em dispositivos mid-range
- **CLS < 0.1** durante carregamento
- **Bundle size < 200KB** (gzipped)

### KPIs de Conversão
- **Taxa de bounce mobile** reduzida em 15%
- **Tempo médio na página** aumentado em 20%
- **Taxa de conversão mobile** aumentada em 10%
- **Abandono de carrinho** reduzido em 10%

### KPIs de Usabilidade
- **Lighthouse Performance Score > 90**
- **Lighthouse Accessibility Score > 95**
- **Core Web Vitals** todos "Good"

---

## 🛠️ Ferramentas Recomendadas

### Desenvolvimento
- **Chrome DevTools** - Device Mode, Performance tab
- **Lighthouse** - Auditorias de performance
- **WebPageTest** - Testes em dispositivos reais
- **BrowserStack** - Testes cross-browser

### Monitoramento
- **Vercel Analytics** - RUM integrado
- **Google Search Console** - Core Web Vitals
- **Sentry** - Error tracking
- **LogRocket** - Session replay

### Testes
- **Playwright** - Testes E2E responsivos
- **Percy** - Visual regression testing
- **axe DevTools** - Acessibilidade

---

## 📚 Recursos Adicionais

- [Web.dev - Mobile Performance](https://web.dev/mobile/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Core Web Vitals](https://web.dev/vitals/)
- [Mobile-First Design](https://www.uxpin.com/studio/blog/a-hands-on-guide-to-mobile-first-design/)

---

**Última atualização:** Janeiro 2026
**Versão:** 1.0.0
**Responsável:** Equipe de Desenvolvimento
