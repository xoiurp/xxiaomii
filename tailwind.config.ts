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
      colors: {
        'brand-orange': '#FF6700',
        'brand-orange-dark': '#E05A00',
        'brand-orange-light': '#FF8533',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      fontSize: {
        // Tipografia padronizada por hierarquia
        'hero': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],        // 24px - Títulos principais mobile
        'hero-sm': ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],   // 30px - Títulos tablet
        'hero-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],     // 36px - Títulos desktop
        'hero-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],        // 48px - Títulos grandes
        
        'section': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],    // 18px - Títulos de seção mobile
        'section-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],  // 20px - Seção tablet
        'section-md': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],   // 24px - Seção desktop
        
        'card-title': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }], // 14px - Cards mobile
        'card-title-sm': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],  // 16px - Cards tablet
        'card-title-md': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }], // 18px - Cards desktop
        
        'price': ['1rem', { lineHeight: '1.2', fontWeight: '600' }],          // 16px - Preço mobile
        'price-sm': ['1.125rem', { lineHeight: '1.2', fontWeight: '600' }],   // 18px - Preço tablet
        'price-md': ['1.25rem', { lineHeight: '1.2', fontWeight: '600' }],    // 20px - Preço desktop
        
        'body': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],        // 12px - Corpo mobile
        'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],    // 14px - Corpo tablet/desktop
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],        // 16px - Corpo desktop large
        
        'caption': ['0.625rem', { lineHeight: '1.4', fontWeight: '400' }],    // 10px - Legendas mobile
        'caption-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],  // 12px - Legendas tablet/desktop
        
        'button': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],      // 12px - Botões mobile
        'button-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],  // 14px - Botões tablet/desktop
        
        'nav': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],         // 12px - Navegação mobile
        'nav-sm': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],     // 14px - Navegação tablet
        'nav-md': ['1rem', { lineHeight: '1.4', fontWeight: '500' }],         // 16px - Navegação desktop
      },
      screens: {
        'xs': '375px',  // iPhone SE e similares
        // Mantém os padrões do Tailwind: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      },
    },
  },
  plugins: [],
}
export default config
