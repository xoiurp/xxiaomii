"use client";

import React, { useRef, useEffect, useState } from 'react';

interface IsolatedHtmlContentProps {
  htmlContent: string;
  mobileHtmlContent?: string; // Conteúdo HTML específico para mobile
  desktopCss?: string;
  mobileCss?: string;
  mobileFooterHeight?: number; // Altura do footer em dispositivos móveis
  desktopFooterHeight?: number; // Altura do footer em dispositivos desktop
  preserveOriginalStyles?: boolean; // Nova prop para preservar os estilos originais
  fontSizeMetafield?: string; // Nova prop para o metafield do tamanho da fonte
  mobileFontSizeMetafield?: string; // Nova prop para o metafield do tamanho da fonte mobile
}

const IsolatedHtmlContentTest: React.FC<IsolatedHtmlContentProps> = ({
  htmlContent,
  mobileHtmlContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  desktopCss,
  mobileCss,
  mobileFooterHeight = 400, // Valor padrão para a altura do footer mobile
  desktopFooterHeight = 700, // Valor padrão para a altura do footer desktop
  preserveOriginalStyles = false, // Por padrão, não preserva estilos originais
  fontSizeMetafield, // Adicionado fontSizeMetafield
  mobileFontSizeMetafield, // Adicionado mobileFontSizeMetafield
}) => {
  console.log("IsolatedHtmlContentTest - preserveOriginalStyles recebido:", preserveOriginalStyles);
  console.log("IsolatedHtmlContentTest - fontSizeMetafield recebido:", fontSizeMetafield);
  console.log("IsolatedHtmlContentTest - mobileFontSizeMetafield recebido:", mobileFontSizeMetafield);

  // Estado para detectar se estamos em um dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300); // Altura inicial maior para mobile

  // Efeito para detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Determinar qual conteúdo HTML usar com base no dispositivo
  const contentToUse = isMobile && mobileHtmlContent ? mobileHtmlContent : htmlContent;
  
  // Armazenar a última altura e o timestamp da última atualização
  const lastHeightRef = useRef<number>(300);
  const lastUpdateTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow) {
        const data = event.data;
        if (data && typeof data === 'object' && 'height' in data) {
          const newHeight = Number(data.height);
          const now = Date.now();
          
          if (
            !isNaN(newHeight) &&
            newHeight > 0 &&
            Math.abs(newHeight - lastHeightRef.current) > 10 &&
            (now - lastUpdateTimeRef.current) > 200
          ) {
            lastHeightRef.current = newHeight;
            lastUpdateTimeRef.current = now;
            
            setIframeHeight(newHeight);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Criar o conteúdo do iframe incluindo a fonte MiSans, CSS do produto e estilos base
    const combinedStyles = `
      <style>
        /* Importação da fonte MiSans */
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 300;
          src: url('/fonts/MiSans-Normal.ttf') format('truetype'),
               url('/fonts/MiSans-Normal.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 400;
          src: url('/fonts/MiSans-Regular.ttf') format('truetype'),
               url('/fonts/MiSans-Regular.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 500;
          src: url('/fonts/MiSans-Medium.ttf') format('truetype'),
               url('/fonts/MiSans-Medium.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 600;
          src: url('/fonts/MiSans-SemiBold.ttf') format('truetype'),
               url('/fonts/MiSans-SemiBold.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 700;
          src: url('/fonts/MiSans-Bold.ttf') format('truetype'),
               url('/fonts/MiSans-Bold.woff2') format('woff2');
          font-display: swap;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden; /* Remove barras de rolagem no conteúdo */
          width: 100%;
          ${!preserveOriginalStyles ? `
          font-family: 'MiSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          /* Aplicar ao html para que rem seja calculado com base neste valor */
          ` : ''}
        }

        ${!preserveOriginalStyles ? (
          isMobile
          ? `
        html {
          font-size: ${mobileFontSizeMetafield ? mobileFontSizeMetafield : '16px'}; /* Base para REM em mobile */
        }
          `
          : `
        html {
          font-size: ${fontSizeMetafield ? fontSizeMetafield : '192px'}; /* Base para REM em desktop */
        }
          `
        ) : `
        /* Se preserveOriginalStyles for true, e o conteúdo HTML injetado tiver seu próprio 
           estilo de font-size no seu elemento <html> ou <body>, ele será usado.
           Caso contrário, o padrão do navegador para o iframe será usado. */
        `}
        
        /* CSS do produto - Desktop */
        ${desktopCss || ''}

        /* CSS do produto - Mobile */
        @media (max-width: 768px) {
          ${mobileCss || ''}
        }

        /* Estilos para o botão Adicionar ao Carrinho específico */
        a.xm-link.split_text5451[data-id="1n64fmctaq"],
        a.xm-link[data-id="1n64fmctaq"] /* Fallback se a classe split_text mudar */ {
          background-color: #FF6700 !important;
          color: #FFFFFF !important;
          padding: 10px 20px !important; /* Ajuste o padding conforme necessário */
          border-radius: 25px !important; /* Bordas suaves */
          text-decoration: none !important;
          display: inline-block !important; /* Para padding e border-radius funcionarem bem */
          text-align: center;
          /* Removendo transform e font-size inline para melhor controle, se necessário */
          /* font-size: 1rem !important; /* Exemplo para sobrescrever o font-size inline se preciso */
          /* transform: none !important; /* Exemplo para resetar transform */
        }

        /* Se houver um ícone ou imagem dentro do link, pode precisar de estilos adicionais */
        a.xm-link.split_text5451[data-id="1n64fmctaq"] img {
          /* Estilos para imagem dentro do botão, se houver */
        }

      </style>
    `;
    
    const heightScript = `
      <script>
        const mobileFooterHeight = ${mobileFooterHeight};
        const desktopFooterHeight = ${desktopFooterHeight};

        (function() {
          let lastHeight = 0;
          let updateTimeout = null;
          const debounceDelay = 100;
          let consecutiveUpdates = 0;
          const maxConsecutiveUpdates = 50;

          function postHeight() {
            const bodyScrollHeight = document.body.scrollHeight;
            const docScrollHeight = document.documentElement.scrollHeight;
            const calculatedHeight = Math.max(bodyScrollHeight, docScrollHeight);
            const finalHeight = calculatedHeight;

            if (Math.abs(finalHeight - lastHeight) < 20) {
              return;
            }

            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }

            updateTimeout = setTimeout(() => {
              lastHeight = finalHeight;
              window.parent.postMessage({ height: finalHeight }, '*');
            }, debounceDelay);
          }

          const resizeObserver = new ResizeObserver((entries) => {
            postHeight();
          });

          resizeObserver.observe(document.body);

          document.addEventListener('DOMContentLoaded', () => {
            postHeight();

            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (!img.complete) {
                img.addEventListener('load', () => {
                  postHeight();
                }, { once: true });
                img.addEventListener('error', () => {
                  postHeight();
                }, { once: true });
              }
            });
          });

          window.addEventListener('load', () => {
            postHeight();
          });

          window.addEventListener('orientationchange', () => {
            setTimeout(postHeight, 300);
          });

          window.addEventListener('resize', () => {
            postHeight();
          });

          const mutationObserver = new MutationObserver((mutations) => {
            postHeight();
          });

          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });

          // Adicionar listeners para botões "Adicionar ao Carrinho"
          const setupAddToCartListeners = () => {
            // 1. Botões com classe customizada
            const customClassButtons = document.querySelectorAll('.custom-add-to-cart-btn');
            customClassButtons.forEach(button => {
              if (button && !button.dataset.customListenerAttached) {
                button.addEventListener('click', (event) => {
                  event.preventDefault(); // Previne navegação para links <a>
                  window.parent.postMessage({ type: 'customAddToCartClicked', source: 'customClassButtonInIframe' }, '*');
                  console.log('Botão com classe .custom-add-to-cart-btn (iframe) clicado:', button);
                });
                button.dataset.customListenerAttached = 'true';
              }
            });

            // 2. Links específicos por data-id (mantendo lógica existente)
            const specificLinks = [
              document.querySelector('a.split_text5451[data-id="1n64fmctaq"]'),
              document.querySelector('a.image529[data-id="lmb15nw8jh"]')
            ].filter(Boolean); // Filtra nulos

            specificLinks.forEach(link => {
              if (link && !link.dataset.customListenerAttached) {
                link.addEventListener('click', (event) => {
                  event.preventDefault();
                  window.parent.postMessage({ type: 'customAddToCartClicked', source: 'specificButtonInIframe', dataId: link.dataset.id }, '*');
                  console.log('Botão específico "Adicionar ao Carrinho" (iframe) clicado:', link);
                });
                link.dataset.customListenerAttached = 'true'; // Marcar que o listener foi adicionado
              }
            });

            // Fallback para outros botões genéricos "Adicionar ao Carrinho"
            const allPotentialButtons = document.querySelectorAll('a[data-type="button"], button');
            allPotentialButtons.forEach(button => {
              if (button.dataset.customListenerAttached) return; // Já tratado pelos seletores específicos

              const buttonText = (button.textContent || button.innerText || "").trim().toLowerCase();
              const hasAddToCartText = buttonText.includes('adicionar ao carrinho') || buttonText.includes('comprar');

              if (hasAddToCartText) {
                 // Evitar adicionar listener se for um dos botões específicos já tratados
                const isSpecificHandled = specificLinks.some(sl => sl === button);
                if (isSpecificHandled) return;

                button.addEventListener('click', (event) => {
                  event.preventDefault();
                  window.parent.postMessage({ type: 'customAddToCartClicked', source: 'genericButtonInIframe', text: buttonText }, '*');
                  console.log('Botão genérico "Adicionar ao Carrinho" (iframe) clicado:', button);
                });
                button.dataset.customListenerAttached = 'true';
              }
            });
          };

          // Chamar setupAddToCartListeners no DOMContentLoaded e após mutações
          document.addEventListener('DOMContentLoaded', () => {
            postHeight(); // Manter a lógica de altura
            setupAddToCartListeners();

            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (!img.complete) {
                img.addEventListener('load', () => {
                  postHeight();
                }, { once: true });
                img.addEventListener('error', () => {
                  postHeight();
                }, { once: true });
              }
            });
          });
          
          // Re-executar setupListeners em mutações no DOM, pois o conteúdo pode mudar
          const contentMutationObserver = new MutationObserver((mutations) => {
            postHeight(); // Manter a lógica de altura
            setupAddToCartListeners(); // Reaplicar listeners se o DOM mudar
          });
          contentMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true // Observar atributos também, caso classes/data-ids mudem
          });


          window.addEventListener('beforeunload', () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            contentMutationObserver.disconnect();
          });

        })();
      </script>
    `;

    // Montar o documento completo
    const fullContent = `
      <!DOCTYPE html>
      <html ${!preserveOriginalStyles && fontSizeMetafield ? '' : ''}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          ${combinedStyles}
        </head>
        <body>
          ${contentToUse}
          ${heightScript}
        </body>
      </html>
    `;

    iframe.srcdoc = fullContent;
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent, mobileHtmlContent, isMobile, desktopCss, mobileCss, mobileFooterHeight, desktopFooterHeight, preserveOriginalStyles, iframeRef, contentToUse, fontSizeMetafield, mobileFontSizeMetafield]);

  return (
    <iframe
    ref={iframeRef}
    sandbox="allow-scripts allow-same-origin"
    scrolling="no"
    style={{
    width: '100%',
    height: `${iframeHeight}px`,
    border: 'none',
    display: 'block',
    transition: 'height 0.3s ease-in-out',
    overflow: 'hidden',           
  }}
  className="isolated-content-iframe-test w-full"
  title="Conteúdo Isolado do Produto Teste"
/>
  );
};

export default IsolatedHtmlContentTest;
