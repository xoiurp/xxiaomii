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
}

const IsolatedHtmlContent: React.FC<IsolatedHtmlContentProps> = ({
  htmlContent,
  mobileHtmlContent,
  desktopCss,
  mobileCss,
  mobileFooterHeight = 400, // Valor padrão para a altura do footer mobile
  desktopFooterHeight = 700, // Valor padrão para a altura do footer desktop
  preserveOriginalStyles = false, // Por padrão, não preserva estilos originais
  fontSizeMetafield, // Adicionado fontSizeMetafield
}) => {
  // Estado para detectar se estamos em um dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300); // Altura inicial maior para mobile

  // Efeito para detectar dispositivo móvel
  // Efeito para detectar dispositivo móvel
  useEffect(() => {
    // Função para verificar se a tela é de dispositivo móvel (< 768px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkMobile);
    
    // Limpar listener ao desmontar
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
    
    // Handler para receber mensagens do iframe com a altura
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem é do nosso iframe
      if (event.source === iframe.contentWindow) {
        const data = event.data;
        if (data && typeof data === 'object' && 'height' in data) {
          const newHeight = Number(data.height);
          const now = Date.now();
          
          // Verificar se a altura é válida, se houve mudança significativa
          // e se passou tempo suficiente desde a última atualização
          if (
            !isNaN(newHeight) &&
            newHeight > 0 &&
            Math.abs(newHeight - lastHeightRef.current) > 10 &&
            (now - lastUpdateTimeRef.current) > 200 // limita atualizações a cada 200ms
          ) {
            // Atualizar as referências
            lastHeightRef.current = newHeight;
            lastUpdateTimeRef.current = now;
            
            // Atualizar a altura do iframe sem limite máximo
            setIframeHeight(newHeight);
          }
        }
      }
    };
    
    // Adicionar listener para receber mensagens
    window.addEventListener('message', handleMessage);
    
    // Criar o conteúdo do iframe incluindo a fonte MiSans e os estilos
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
        
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden; /* Remove barras de rolagem no conteúdo */
          ${!preserveOriginalStyles ? `
          font-family: 'MiSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: ${fontSizeMetafield ? fontSizeMetafield : '16px'};
          ` : ''}
          width: 100%;
        }
        
        ${desktopCss || ''}
        
        @media (max-width: 768px) {
          ${mobileCss || ''}
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
          const debounceDelay = 100; // Reduzir o debounce para reagir mais rápido a mudanças
          let consecutiveUpdates = 0; // Contador para detectar loop
          const maxConsecutiveUpdates = 50; // Limite de atualizações consecutivas

          function postHeight() {
            console.log('postHeight: Iniciando cálculo...'); // Log de início
            // Calcular a altura usando o maior valor entre body.scrollHeight e documentElement.scrollHeight
            // Isso ajuda a capturar a altura total mesmo com margens ou paddings
            const bodyScrollHeight = document.body.scrollHeight;
            const docScrollHeight = document.documentElement.scrollHeight;
            // Calcular a altura usando o maior valor entre body.scrollHeight e documentElement.scrollHeight
            // Isso ajuda a capturar a altura total mesmo com margens ou paddings
            const calculatedHeight = Math.max(bodyScrollHeight, docScrollHeight);

            // A altura do iframe deve ser apenas a altura do seu conteúdo.
            // A página pai deve gerenciar o layout do footer separadamente.
            const finalHeight = calculatedHeight;

            console.log('postHeight: Valores calculados:', {
              bodyScrollHeight,
              docScrollHeight,
              calculatedHeight,
              finalHeight,
              lastHeight
            }); // Log de valores

            // Evitar enviar a mesma altura repetidamente com uma pequena tolerância
            // Manter a tolerância para 20px para evitar oscilações mínimas
            if (Math.abs(finalHeight - lastHeight) < 20) { // Tolerância de 20px
              console.log('postHeight: Altura não mudou significativamente (< 20px), ignorando postMessage.');
              return;
            }

            // Debounce para evitar múltiplos posts em rápida sucessão
            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }

            updateTimeout = setTimeout(() => {
              lastHeight = finalHeight;
              window.parent.postMessage({ height: finalHeight }, '*');
              console.log('postHeight: Enviando altura:', finalHeight, 'Calculada:', calculatedHeight); // Log de cálculo e envio
            }, debounceDelay); // Manter o debounce para estabilidade
          }

          // Usar ResizeObserver para detectar mudanças no conteúdo do body
          const resizeObserver = new ResizeObserver((entries) => {
            console.log('ResizeObserver disparado:', entries); // Log do observer
            postHeight();
          });

          // Observar o body para mudanças de tamanho
          resizeObserver.observe(document.body);

          // Enviar altura inicial após o DOM estar completamente carregado
          document.addEventListener('DOMContentLoaded', () => {
            console.log('Evento DOMContentLoaded disparado.'); // Log do DOMContentLoaded
            postHeight();

            // Configurar para recalcular altura quando imagens carregarem
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (!img.complete) {
                img.addEventListener('load', () => {
                  console.log('Imagem carregada:', img.src); // Log de imagem carregada
                  postHeight();
                }, { once: true });
                img.addEventListener('error', () => {
                  console.log('Erro ao carregar imagem:', img.src); // Log de erro de imagem
                  postHeight();
                }, { once: true });
              } else {
                console.log('Imagem já carregada:', img.src); // Log de imagem já carregada
              }
            });
          });

          // Enviar altura após o carregamento completo da página (incluindo assets)
          window.addEventListener('load', () => {
            console.log('Evento load disparado.'); // Log do load
            postHeight();
          });

          // Atualizar altura em mudanças de orientação (útil para mobile)
          window.addEventListener('orientationchange', () => {
            console.log('Evento orientationchange disparado.'); // Log do orientationchange
            setTimeout(postHeight, 300); // Pequeno delay para a orientação se ajustar
          });

          // Atualizar altura em redimensionamento da janela (com debounce)
          window.addEventListener('resize', () => {
            console.log('Evento resize disparado.'); // Log do resize
            postHeight(); // postHeight já tem debounce interno
          });

          // Adicionar um MutationObserver para capturar mudanças no DOM que ResizeObserver pode perder
          const mutationObserver = new MutationObserver((mutations) => {
            console.log('MutationObserver disparado:', mutations); // Log do MutationObserver
            postHeight();
          });

          // Observar o body e seus descendentes para mudanças
          mutationObserver.observe(document.body, {
            childList: true, // Observa adição/remoção de nós
            subtree: true,   // Observa todos os descendentes
            attributes: true // Observa mudanças em atributos (como style, class)
          });

          // Limpar observers e listeners ao desmontar (embora em um iframe srcdoc isso seja menos crítico)
          window.addEventListener('beforeunload', () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            // Não é necessário remover outros listeners aqui, pois o iframe será destruído
          });

        })();
      </script>
    `;

    // Montar o documento completo
    const fullContent = `
      <!DOCTYPE html>
      <html>
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
    
    // Limpar ao desmontar
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent, mobileHtmlContent, isMobile, desktopCss, mobileCss, mobileFooterHeight, desktopFooterHeight, preserveOriginalStyles, fontSizeMetafield, iframeRef, contentToUse]); // Adicionado fontSizeMetafield e contentToUse

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      scrolling="no" // Adiciona atributo scrolling="no" para remover barras de rolagem
      style={{
        width: '100%',
        height: `${iframeHeight}px`,
        border: 'none',
        display: 'block',
        transition: 'height 0.3s ease-in-out',
        overflow: 'hidden', // Remove barras de rolagem
      }}
      className="isolated-content-iframe w-full"
      title="Conteúdo Isolado do Produto"
    />
  );
};

export default IsolatedHtmlContent;
