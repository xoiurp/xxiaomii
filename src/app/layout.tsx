import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import ConditionalHeader from "../components/layout/ConditionalHeader";
import GlobalCheckoutInterceptor from "@/components/checkout/GlobalCheckoutInterceptor";
import Link from 'next/link';

// Configuração da fonte local MiSans
const miSans = localFont({
  src: [
    { path: '../assets/fonts/MiSans-Thin.woff2', weight: '100', style: 'normal' },
    { path: '../assets/fonts/MiSans-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: '../assets/fonts/MiSans-Light.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/MiSans-Normal.woff2', weight: '400', style: 'normal' }, // Usando Normal para 400
    { path: '../assets/fonts/MiSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/MiSans-Semibold.woff2', weight: '600', style: 'normal' }, // Usando Semibold para 600
    { path: '../assets/fonts/MiSans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/MiSans-Heavy.woff2', weight: '900', style: 'normal' }, // Heavy geralmente é 900
  ],
  variable: '--font-misans', // Variável CSS para a fonte
  display: 'swap', // Estratégia de carregamento
});

export const metadata: Metadata = {
  title: "Mibrasil",
  description: "Revendedores de produtos Xiaomi no Brasil. Smartphones, acessórios e casa inteligente.",
  icons: {
    icon: "/mibrasil2svg.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${miSans.variable} antialiased`}
      >
        {/* MercadoPago.js v2 - Tokenização de cartão PCI DSS */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />

        {/* Google tag (gtag.js) */}
        <Script
          src=""
          strategy="afterInteractive"
        />
        <Script id="google-ads-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17409426525');
          `}
        </Script>

        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <ConditionalHeader />
              {/* Mount global interceptor to capture checkout clicks across the app */}
              <GlobalCheckoutInterceptor />
              <main className="flex-grow">{children}</main>
            <footer className="bg-gray-100 py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quem Somos</h3>
                    <p className="text-gray-600">
                      Somos revendedores de produtos Xiaomi no Brasil, oferecendo os melhores smartphones, acessórios e produtos para casa inteligente.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Categorias</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/shop/smartwatches" className="text-gray-600 hover:text-[#FF6700]">
                          Smartwatches
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop/audio" className="text-gray-600 hover:text-[#FF6700]">
                          Áudio
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop/casa-inteligente" className="text-gray-600 hover:text-[#FF6700]">
                          Casa Inteligente
                        </Link>
                      </li>
                      <li>
                        <Link href="/shop/ofertas" className="text-gray-600 hover:text-[#FF6700]">
                          Ofertas
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ajuda</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/faq" className="text-gray-600 hover:text-[#FF6700]">
                          Perguntas Frequentes
                        </Link>
                      </li>
                      <li>
                        <Link href="/envio" className="text-gray-600 hover:text-[#FF6700]">
                          Envio e Entrega
                        </Link>
                      </li>
                      <li>
                        <Link href="/politica-de-devolucao" className="text-gray-600 hover:text-[#FF6700]">
                          Política de Devolução
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contato</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-[#FF6700]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        contato@mibrasil.com.br
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-[#FF6700]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        (11) 1234-5678
                      </li>
                    </ul>
                    <div className="mt-4 flex space-x-4">
                      <a href="#" className="text-gray-600 hover:text-[#FF6700]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                        </svg>
                      </a>
                      <a href="#" className="text-gray-600 hover:text-[#FF6700]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                      <a href="#" className="text-gray-600 hover:text-[#FF6700]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                  <p>&copy; {new Date().getFullYear()} Mi Brasil. Todos os direitos reservados.</p>
                </div>
              </div>
            </footer>
          </div>
          
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
