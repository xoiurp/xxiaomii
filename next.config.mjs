// import type { NextConfig } from "next"; // Removido para .mjs

const nextConfig = { // Removida a anotação de tipo ': NextConfig'
  images: {
    // Cloudflare Workers Image Loader (ATIVADO!)
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',

    domains: [
      'i01.appmifile.com',
      'placehold.co',
      'cdn.shopify.com',
      'uxh1te-1d.myshopify.com',
      'shopmi-edge-dev.gustavobressanin6.workers.dev'
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Configurações de otimização
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de TypeScript durante o build
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fallbacks para variáveis globais do browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
