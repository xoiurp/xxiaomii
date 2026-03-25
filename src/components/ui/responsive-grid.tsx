import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  /** Configuração de colunas por breakpoint */
  cols?: {
    default: 1 | 2 | 3 | 4 | 5 | 6
    xs?: 1 | 2 | 3 | 4 | 5 | 6
    sm?: 1 | 2 | 3 | 4 | 5 | 6
    md?: 1 | 2 | 3 | 4 | 5 | 6
    lg?: 1 | 2 | 3 | 4 | 5 | 6
    xl?: 1 | 2 | 3 | 4 | 5 | 6
  }
  /** Gap entre itens */
  gap?: 'none' | 'sm' | 'default' | 'lg'
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3',
  default: 'gap-3 sm:gap-4 md:gap-6',
  lg: 'gap-4 sm:gap-6 md:gap-8',
}

/**
 * Grid responsivo padronizado para o projeto
 * Ideal para listagem de produtos, cards, etc.
 */
export const ResponsiveGrid = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default',
}: ResponsiveGridProps) => {
  // Monta as classes de colunas dinamicamente
  const colClasses = [
    `grid-cols-${cols.default}`,
    cols.xs && `xs:grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', gapClasses[gap], colClasses, className)}>
      {children}
    </div>
  )
}

/**
 * Grid pré-configurado para produtos
 * Mobile: 2 colunas, Tablet: 3 colunas, Desktop: 4 colunas
 */
export const ProductGrid = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        'gap-3 sm:gap-4 md:gap-6',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Grid pré-configurado para categorias
 * Mobile: 2 colunas, Tablet: 3 colunas, Desktop: 4-6 colunas
 */
export const CategoryGrid = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        'gap-2 sm:gap-3 md:gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export default ResponsiveGrid
