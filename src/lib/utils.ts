import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para detectar o ambiente de execução
export function getEnvironment() {
  if (process.env.NETLIFY === 'true') return 'netlify'
  if (process.env.VERCEL === '1') return 'vercel'
  if (process.env.NODE_ENV === 'production') return 'production'
  if (process.env.NODE_ENV === 'development') return 'development'
  return 'unknown'
}

// Função para obter a URL base da aplicação
export function getBaseUrl() {
  // Prioridade 1: NEXTAUTH_URL explícito
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  
  // Prioridade 2: Netlify (várias variáveis possíveis)
  if (process.env.NETLIFY === 'true') {
    // Netlify define várias variáveis, vamos tentar em ordem de prioridade
    if (process.env.URL) return process.env.URL
    if (process.env.DEPLOY_URL) return process.env.DEPLOY_URL
    if (process.env.NETLIFY_URL) return process.env.NETLIFY_URL
  }
  
  // Prioridade 3: Vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  
  // Prioridade 4: Produção genérica
  if (process.env.NODE_ENV === 'production') return 'https://mibrasil.com'
  
  // Fallback: desenvolvimento
  return 'http://localhost:3000'
}

// Função para verificar se estamos em produção
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

// Função para verificar se estamos no Netlify
export function isNetlify() {
  return process.env.NETLIFY === 'true'
}

// Função para verificar se estamos no Vercel
export function isVercel() {
  return process.env.VERCEL === '1'
}

// Função para log de debug do ambiente
export function logEnvironmentInfo() {
  console.log('Environment Info:', {
    environment: getEnvironment(),
    baseUrl: getBaseUrl(),
    isProduction: isProduction(),
    isNetlify: isNetlify(),
    isVercel: isVercel(),
    nodeEnv: process.env.NODE_ENV,
    netlifyVar: process.env.NETLIFY,
    vercelVar: process.env.VERCEL,
    url: process.env.URL,
    deployUrl: process.env.DEPLOY_URL,
    netlifyUrl: process.env.NETLIFY_URL
  })
}
