import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Padding horizontal responsivo */
  padding?: 'none' | 'sm' | 'default' | 'lg'
  /** Tag HTML a ser usada */
  as?: 'div' | 'section' | 'main' | 'article'
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
}

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-4',
  default: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-4 sm:px-8 lg:px-12',
}

/**
 * Container responsivo padronizado para o projeto
 * Centraliza o conteúdo e aplica padding horizontal responsivo
 */
export const ResponsiveContainer = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'default',
  as: Component = 'div',
}: ResponsiveContainerProps) => {
  return (
    <Component
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  )
}

export default ResponsiveContainer
