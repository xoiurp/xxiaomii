"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import AddToCartButton from '@/components/product/AddToCartButton';
import ShippingCalculator from '@/components/shipping/ShippingCalculator'; // Importar o novo componente
import IsolatedHtmlContentTest from '@/components/product/IsolatedHtmlContentTest';
import ProductGallery from '@/components/product/ProductGallery';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Importar como nomeado e adicionar subcomponentes
import { Button } from "@/components/ui/button"; // Importar Button do Shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importar DropdownMenu do Shadcn
import { Product } from '@/lib/shopify'; // Importar a interface Product atualizada
import { ChevronDown, ChevronUp, HomeIcon } from 'lucide-react'; // Importar ícones
import { useCart, CartItem } from '@/context/CartContext'; // Importar useCart e CartItem

// Mapa para traduzir chaves de metafields para nomes amigáveis
// As chaves aqui são a versão em minúsculas e com espaços das chaves originais dos metafields.
const metafieldKeyToFriendlyNameMap: Record<string, string> = {
  "sw conectividade bluetooth": "Bluetooth",
  "sw conectividade gps": "GPS",
  "sw conectividade wifi": "Wi-Fi",
  "sw others app": "Aplicativos Compatíveis",
  "sw others bateria": "Bateria",
  "sw others camera": "Câmera",
  "sw others chamada": "Chamadas Telefônicas",
  "sw others diferenciais": "Diferenciais",
  "sw others embalagem": "Conteúdo da Embalagem",
  "sw others memoria local": "Armazenamento Interno",
  "sw others musica": "Reprodução de Música",
  "sw others pulseira": "Pulseira",
  "sw others saude": "Monitoramento de Saúde",
  "sw others sensores": "Sensores",
  "sw others sports": "Modos Esportivos",
  "sw others watter": "Resistência à Água", // Mantendo "watter" se essa for a chave real
  "sw protecao tela": "Proteção da Tela",
  "sw recursos tela": "Recursos da Tela",
  "sw resolucao": "Resolução da Tela",
  "sw tamanho tela": "Tamanho da Tela",
  "sw tela sensivel ao toque": "Tela Sensível ao Toque",
  "sw tipo tela": "Tipo de Tela",

  // Chaves gerais (não "sw") - convertidas para minúsculas com espaços se aplicável
  "tela": "Tela",
  "sistema operacional": "Sistema Operacional", // Exemplo: se a chave for "Sistema Operacional"
  "sensores": "Sensores (Geral)",
  "rede bandas": "Bandas de Rede",
  "processador": "Processador",
  "memoria": "Memória",
  "garantia": "Garantia",
  "dimensoes": "Dimensões",
  "conteudo embalagem": "Conteúdo da Embalagem (Geral)",
  "conectividade": "Conectividade (Geral)",
  "camera": "Câmera (Geral)",
  "bateria": "Bateria (Geral)",
  "audio video": "Áudio e Vídeo", // Exemplo: se a chave for "Audio Video"
  "html mobile": "Detalhes Adicionais" // Para "html_mobile"
};

// Função para formatar a chave do metafield para um nome amigável
function formatMetafieldKey(key: string): string {
  // Normaliza a chave: minúsculas, substitui '.', '_', '-' por espaço, remove espaços duplicados e nas extremidades.
  const normalizedKey = key.toLowerCase()
                           .replace(/[\._-]/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
  
  if (metafieldKeyToFriendlyNameMap.hasOwnProperty(normalizedKey)) {
    return metafieldKeyToFriendlyNameMap[normalizedKey];
  }

  // Fallback para chaves não mapeadas: capitaliza cada palavra da chave normalizada.
  // Remove prefixos comuns como "sw " ou "others " apenas para a exibição de fallback.
  let fallbackDisplay = normalizedKey;
  if (fallbackDisplay.startsWith('sw ')) {
    fallbackDisplay = fallbackDisplay.substring(3).trim();
  }
  if (fallbackDisplay.startsWith('others ')) {
    fallbackDisplay = fallbackDisplay.substring(7).trim();
  }
  
  return fallbackDisplay
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Definir a interface para as props que o componente receberá
// Certifique-se que VariantNode reflete a estrutura passada de page.tsx
// (incluindo price, compareAtPrice como objetos, e quantityAvailable)
type VariantNode = NonNullable<Product['variants']>['edges'][number]['node'];

interface ProductClientDetailsProps {
  product: Product;
  variants: VariantNode[];
  images: { transformedSrc: string; altText: string | null }[]; // Atualizado
  uniqueColors: { name: string; hex: string }[];
  price: string; // Preço formatado inicial
  mainImage: { transformedSrc: string; altText: string | null }; // Atualizado
  desktopCss?: string;
  mobileCss?: string;
  showFreeShippingBag?: boolean;
}

// Interface para o metafield (usado em getMobileHtmlContent e Accordion)
interface Metafield {
  namespace: string;
  key: string;
  value: string;
}

// Função para formatar preço (pode ser movida para utils se usada em outros lugares)
const formatPrice = (amount: string | number, currencyCode: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};


export default function ProductClientDetails({
  product,
  variants = [], // Garante que variants seja sempre um array
  images,
  uniqueColors,
  price: initialPrice, // Renomeia prop para evitar conflito
  mainImage,
  desktopCss,
  mobileCss,
}: ProductClientDetailsProps) {

  console.log("ProductClientDetails - product.metafields recebido:", JSON.stringify(product.metafields, null, 2)); // Log para depurar a lista de metafields

  // Lógica para determinar preserveOriginalStyles e fontSizeMetafield
  let passPreserveOriginalStyles = true; // Padrão: preservar estilos originais, deixar o conteúdo HTML definir a base rem
  let passFontSizeMetafield: string | undefined = undefined;

  // NOTA: A lógica original para buscar metafields específicos por nome foi substituída por uma mais genérica
  // que parece estar no arquivo (product.metafield?.value). Se os metafields específicos
  // (use_custom_rem_base, rem_base_font_size) são parte de um array product.metafields,
  // a lógica anterior (com .find()) seria mais apropriada.
  // Por agora, vou manter a lógica que está no arquivo fornecido e adicionar logs em volta dela.

  const useCustomRemBaseMetafieldValue = product.metafields?.find(mf => mf && mf.namespace === 'custom' && mf.key === 'use_custom_rem_base')?.value;
  const remBaseFontSizeMetafieldValue = product.metafields?.find(mf => mf && mf.namespace === 'custom' && mf.key === 'rem_base_font_size')?.value;
  const mobileFontSizeValue = product.metafields?.find(mf => mf && mf.namespace === 'custom' && mf.key === 'mobile_font_size')?.value;

  console.log("ProductClientDetails - useCustomRemBaseMetafieldValue:", useCustomRemBaseMetafieldValue);
  console.log("ProductClientDetails - remBaseFontSizeMetafieldValue:", remBaseFontSizeMetafieldValue);
  console.log("ProductClientDetails - mobileFontSizeValue:", mobileFontSizeValue);

  // Se o metafield 'use_custom_rem_base' for true
  if (useCustomRemBaseMetafieldValue === 'true') { // Comparar com a string 'true'
    console.log("ProductClientDetails - Condição useCustomRemBaseMetafieldValue === 'true' é VERDADEIRA");
    passPreserveOriginalStyles = false;
    if (remBaseFontSizeMetafieldValue) {
      passFontSizeMetafield = remBaseFontSizeMetafieldValue;
    }
    // Se remBaseFontSizeMetafieldValue não for fornecido, 
    // IsolatedHtmlContentTest usará seu fallback interno (ex: "192px")
    // quando passPreserveOriginalStyles for false e passFontSizeMetafield for undefined.
  } else {
    console.log("ProductClientDetails - Condição useCustomRemBaseMetafieldValue === 'true' é FALSA ou metafield ausente");
  }

  console.log("ProductClientDetails - passPreserveOriginalStyles final:", passPreserveOriginalStyles);
  console.log("ProductClientDetails - passFontSizeMetafield final:", passFontSizeMetafield);

  // Estados para o HTML móvel carregado da URL e estado de carregamento
  const [fetchedMobileHtml, setFetchedMobileHtml] = useState<string | undefined>(undefined);
  const [isLoadingMobileHtml, setIsLoadingMobileHtml] = useState<boolean>(false);

  useEffect(() => {
    const mobileHtmlUrlMetafield = product.metafields?.find(
      (mf) => mf && mf.namespace === 'custom' && mf.key === 'mobile_html_url'
    );

    if (mobileHtmlUrlMetafield && mobileHtmlUrlMetafield.value) {
      const url = mobileHtmlUrlMetafield.value;
      setIsLoadingMobileHtml(true);
      setFetchedMobileHtml(undefined); // Limpa o HTML anterior
      console.log(`ProductClientDetails: Fetching mobile HTML from R2 URL: ${url}`);
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error fetching mobile HTML! status: ${response.status}`);
          }
          return response.text();
        })
        .then(html => {
          setFetchedMobileHtml(html);
          console.log("ProductClientDetails: Mobile HTML fetched successfully from R2.");
        })
        .catch(error => {
          console.error("ProductClientDetails: Error fetching mobile HTML from R2:", error);
          setFetchedMobileHtml(""); // Define como string vazia em caso de erro para evitar usar o HTML desktop
        })
        .finally(() => {
          setIsLoadingMobileHtml(false);
        });
    } else {
      console.log("ProductClientDetails: No mobile_html_url metafield found.");
      setFetchedMobileHtml(undefined); // Garante que o HTML desktop seja usado se não houver URL
      setIsLoadingMobileHtml(false);
    }
  }, [product.metafields]);


  const firstCollection = product.collections?.edges?.[0]?.node;
  const categoryName = firstCollection?.title || product.productType || "Produtos";
  const categoryHandle = firstCollection?.handle || product.productType?.toLowerCase().replace(/\s+/g, '-') || "produtos";

  // --- Extração de Opções (excluindo Cor) ---
  const productOptions = useMemo(() => {
    const optionsMap: { [key: string]: Set<string> } = {};
    if (!variants) return []; // Retorna array vazio se variants for undefined
    variants.forEach(variant => {
      variant.selectedOptions?.forEach(option => { // Adiciona verificação para selectedOptions
        const nameLower = option.name.toLowerCase();
        const valueLower = option.value.toLowerCase();
        if (nameLower !== 'cor' && nameLower !== 'color' && nameLower !== 'title' && valueLower !== 'default title') {
          if (!optionsMap[option.name]) {
            optionsMap[option.name] = new Set();
          }
          optionsMap[option.name].add(option.value);
        }
      });
    });
    return Object.entries(optionsMap).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet)
    }));
  }, [variants]);

  // --- Estados para Opções Selecionadas ---
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [dropdownOpenStates, setDropdownOpenStates] = useState<{ [key: string]: boolean }>({}); // Estado para controlar dropdowns
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Estado para a imagem selecionada na galeria
  const { addToCart } = useCart(); // Obter a função addToCart do contexto


  // Inicializa os estados
  useEffect(() => {
    // ✅ CORREÇÃO BUG #1: Busca a primeira COMBINAÇÃO completa (cor + opções) que tenha estoque

    // 1. Busca primeira variante disponível em estoque
    const firstAvailableVariant = variants.find(
      variant => (variant.quantityAvailable ?? 0) > 0
    );

    if (firstAvailableVariant && firstAvailableVariant.selectedOptions) {
      // 2. Extrai a cor dessa variante
      const colorOption = firstAvailableVariant.selectedOptions.find(
        opt => opt.name.toLowerCase() === 'cor' || opt.name.toLowerCase() === 'color'
      );

      if (colorOption) {
        setSelectedColor(colorOption.value);
      } else {
        // Fallback: primeira cor da lista se não encontrar
        setSelectedColor(uniqueColors[0]?.name || null);
      }

      // 3. Extrai as outras opções (tudo exceto cor e "Title"/"Default Title" do Shopify)
      const initialSelections: { [key: string]: string } = {};
      firstAvailableVariant.selectedOptions.forEach(opt => {
        const nameLower = opt.name.toLowerCase();
        const valueLower = opt.value.toLowerCase();
        if (nameLower !== 'cor' && nameLower !== 'color' && nameLower !== 'title' && valueLower !== 'default title') {
          initialSelections[opt.name] = opt.value;
        }
      });

      setSelectedOptions(initialSelections);

      console.log('✅ Inicialização com primeira variante disponível:', {
        variantId: firstAvailableVariant.id,
        color: colorOption?.value,
        options: initialSelections,
        stock: firstAvailableVariant.quantityAvailable
      });
    } else {
      // Fallback: nenhuma variante em estoque - usar primeira de cada
      console.warn('⚠️ Nenhuma variante em estoque. Usando fallback para primeira de cada opção.');

      const initialSelections: { [key: string]: string } = {};
      productOptions.forEach(option => {
        if (option.values.length > 0) {
          initialSelections[option.name] = option.values[0];
        }
      });

      setSelectedOptions(initialSelections);
      setSelectedColor(uniqueColors[0]?.name || null);
    }
  }, [productOptions, uniqueColors, variants]); // Depende das opções, cores e variantes

  // --- Encontrar Variante Selecionada ---
  const selectedVariant = useMemo(() => {
    const hasColors = uniqueColors.length > 0;
    const hasOptions = productOptions.length > 0;

    // Produto sem cor E sem opções → selecionar primeira variante disponível
    if (!hasColors && !hasOptions) {
      return variants?.find(v => (v.quantityAvailable ?? 0) > 0) || variants?.[0] || null;
    }

    // Produto com cor: precisa ter cor selecionada
    if (hasColors && !selectedColor) return null;

    // Produto com opções: precisa ter todas selecionadas
    if (hasOptions && productOptions.some(opt => !selectedOptions[opt.name])) return null;

    return variants?.find(variant => {
      if (hasColors) {
        const colorMatch = variant.selectedOptions?.some(
          opt => (opt.name.toLowerCase() === 'cor' || opt.name.toLowerCase() === 'color') && opt.value === selectedColor
        );
        if (!colorMatch) return false;
      }

      return productOptions.every(optionInfo => {
        const selectedValue = selectedOptions[optionInfo.name];
        return variant.selectedOptions?.some(
          opt => opt.name === optionInfo.name && opt.value === selectedValue
        );
      });
    });
  }, [variants, selectedColor, selectedOptions, productOptions, uniqueColors]);

  console.log('selectedVariant atualizado:', selectedVariant); // Log para depuração

  // --- ID da Variante Selecionada ---
  const selectedVariantId = selectedVariant?.id || null;

  // --- Estado da Quantidade ---
  const [quantity, setQuantity] = useState(1);

  // --- Imagens da Galeria ---
  const galleryImages = useMemo(() => {
    // Acessa as imagens da variante através de mediavariant.references.nodes
    const variantMediaNodes = selectedVariant?.mediavariant?.references?.nodes;
    console.log('Conteúdo de variantMediaNodes dentro de galleryImages useMemo:', variantMediaNodes); // Log para depuração
    console.log('Número de imagens em variantMediaNodes:', variantMediaNodes?.length); // Log para depuração do tamanho
    if (variantMediaNodes && variantMediaNodes.length > 0) {
      // Mapeia os nós para extrair transformedSrc e altText da imagem
      return variantMediaNodes.map(node => ({
        transformedSrc: node.image.transformedSrc, // Atualizado
        altText: node.image.altText || product.title || "", 
      }));
    }
    // Se não houver imagens específicas da variante, usa as imagens gerais do produto
    return images.map(img => ({
      transformedSrc: img.transformedSrc, // Atualizado
      altText: img.altText || product.title || "", 
    }));
  }, [selectedVariant, images, product.title]);


  // --- Lógica para Desabilitar Opções Indisponíveis ---
  const getAvailableVariants = useCallback((optionName: string, optionValue: string): VariantNode[] => {
    // ✅ CORREÇÃO BUG #3: Simplifica lógica para consistência com isColorDisabled
    // Quando testamos uma opção específica, IGNORAMOS outras opções selecionadas
    // Retornamos TODAS as variantes que têm aquele valor de opção

    return variants?.filter(variant => {
      // Verifica se a variante tem a opção testada com o valor testado
      const hasTestedOption = variant.selectedOptions?.some(
        opt => opt.name === optionName && opt.value === optionValue
      );

      return hasTestedOption;
    }) || []; // Retorna array vazio se variants for undefined
  }, [variants]);

  // Verifica se um valor de opção (dropdown) deve ser desabilitado
  const isOptionValueDisabled = useCallback((optionName: string, optionValue: string): boolean => {
    const potentialVariants = getAvailableVariants(optionName, optionValue);
    // Desabilita se não houver variantes potenciais OU se todas elas tiverem quantidade <= 0
    return potentialVariants.length === 0 || potentialVariants.every(v => (v.quantityAvailable ?? 0) <= 0);
  }, [getAvailableVariants]);

  // Verifica se um botão de cor deve ser desabilitado
  const isColorDisabled = useCallback((colorName: string): boolean => {
    // ✅ CORREÇÃO BUG #2: Verifica se EXISTE PELO MENOS UMA variante disponível com essa cor
    // INDEPENDENTE de outras opções selecionadas

    // Filtra TODAS as variantes que têm essa cor
    const variantsWithColor = variants?.filter(variant => {
      const colorMatch = variant.selectedOptions?.some(
        opt => (opt.name.toLowerCase() === 'cor' || opt.name.toLowerCase() === 'color') && opt.value === colorName
      );
      return colorMatch;
    }) || [];

    // Verifica se PELO MENOS UMA dessas variantes tem estoque
    const hasStockAvailable = variantsWithColor.some(v => (v.quantityAvailable ?? 0) > 0);

    // Desabilita apenas se NÃO houver NENHUMA variante com estoque para essa cor
    const isDisabled = !hasStockAvailable;

    if (isDisabled) {
      console.log(`🔴 Cor "${colorName}" desabilitada: nenhuma variante em estoque`);
    }

    return isDisabled;
  }, [variants]);


  // --- Funções de Callback ---
  const handleOptionChange = useCallback((optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  }, []);

  const handleColorChange = useCallback((colorName: string) => {
    setSelectedColor(colorName);
  }, []);

  const handleIncreaseQuantity = useCallback(() => {
    setQuantity(prevQuantity => prevQuantity + 1);
  }, []);

  const handleDecreaseQuantity = useCallback(() => {
    setQuantity(prevQuantity => Math.max(1, prevQuantity - 1));
  }, []);

  // --- Preço Atualizado ---
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      return formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode);
    }
    return initialPrice; // Retorna o preço inicial se nenhuma variante for selecionada
  }, [selectedVariant, initialPrice]);

  const currentCompareAtPrice = useMemo(() => {
    if (selectedVariant?.compareAtPrice && parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount)) {
       return formatPrice(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode);
    }
    return null;
  }, [selectedVariant]);

  // Efeito para lidar com mensagens do iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Adicionar verificação de origem se necessário:
      // if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'customAddToCartClicked') {
        console.log('Mensagem "customAddToCartClicked" recebida do iframe. Dados:', event.data);
        if (selectedVariant && selectedVariant.id && selectedVariant.availableForSale) {
          const itemToAdd: CartItem = {
            id: selectedVariant.id,
            title: product.title,
            price: parseFloat(selectedVariant.price.amount),
            currencyCode: selectedVariant.price.currencyCode,
            quantity: quantity, // Usar a quantidade selecionada na página principal
            image: galleryImages[selectedImageIndex]?.transformedSrc || mainImage.transformedSrc || "", // Atualizado
            variantId: selectedVariant.id,
            productId: product.id,
            category: product.productType,
            variantOptions: selectedVariant.selectedOptions?.map(opt => ({ name: opt.name, value: opt.value })),
            compareAtPrice: selectedVariant.compareAtPrice,
            tags: product.tags,
            handle: product.handle, // Adicionado o handle do produto
            // Campos adicionais que seu CartItem pode esperar
          };
          addToCart(itemToAdd);
          // O CartContext já define isCartOpen = true, o que deve abrir o drawer.
          // O alert foi removido conforme solicitado.
          console.log('Produto adicionado ao carrinho a partir do clique no iframe:', itemToAdd);
        } else {
          let warningMessage = 'Não foi possível adicionar o produto ao carrinho. ';
          if (!selectedVariant) {
            warningMessage += 'Nenhuma variante de produto está selecionada.';
          } else if (!selectedVariant.id) {
            warningMessage += 'A variante selecionada não possui um ID válido.';
          } else if (!selectedVariant.availableForSale) {
            warningMessage += 'A variante selecionada não está disponível para venda.';
          }
          console.warn(warningMessage, 'SelectedVariant:', selectedVariant);
          // Removido o alert de aviso também, para consistência.
          // Considerar adicionar um sistema de notificação (toast) para esses casos.
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [
    selectedVariant, 
    product, 
    quantity, 
    addToCart, 
    galleryImages, 
    selectedImageIndex, 
    mainImage
  ]);


  return (
    <>
      {/* Container principal com largura máxima para galeria e especificações */}
      <div className="w-full lg:max-w-[1200px] mx-auto px-4 py-8">
        {/* Breadcrumbs e Frete Grátis no mobile, acima da galeria */}
        <div className="block md:hidden mb-4">
          <div className="flex items-center text-sm flex-nowrap overflow-hidden"> {/* Adicionado flex-nowrap e overflow-hidden */}
            {parseFloat(selectedVariant?.price.amount ?? product.priceRange.minVariantPrice.amount) > 800 && (
              <div className="bg-[#00E676] text-white px-3 py-1 rounded-full text-sm font-medium mr-4 flex-shrink-0"> {/* Alterado text-xs para text-sm e adicionado flex-shrink-0 */}
                Frete Grátis
              </div>
            )}
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap"> {/* Adicionado flex-nowrap aqui também para a lista do breadcrumb */}
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" aria-label="Home"> {/* Adicionado aria-label para acessibilidade */}
                      <HomeIcon className="h-4 w-4" /> {/* Ícone de casa */}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shop/${categoryHandle}`}>{categoryName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {product.title.length > 10 ? `${product.title.substring(0, 10)}...` : product.title} {/* Truncar título */}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Conteúdo do produto */}
        {/* Alterado para md:items-start para alinhar galeria ao topo */}
        <div className="flex flex-col md:flex-row md:items-start gap-8 mb-16">
          {/* Galeria de imagens com miniaturas verticais */}
          <ProductGallery
            images={galleryImages}
            selectedImageIndex={selectedImageIndex}
            setSelectedImageIndex={setSelectedImageIndex}
          />

          {/* Detalhes do produto */}
          <div className="w-full md:w-1/2">
            {/* Breadcrumbs e Frete Grátis no desktop */}
            <div className="hidden md:block mb-6">
              <div className="flex items-center text-sm">
                {parseFloat(selectedVariant?.price.amount ?? product.priceRange.minVariantPrice.amount) > 800 && (
                  <div className="bg-[#00E676] text-white px-3 py-1 rounded-full text-xs font-medium mr-4">
                    Frete Grátis
                  </div>
                )}
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href="/">Home</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={`/shop/${categoryHandle}`}>{categoryName}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{product.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            {/* Código do produto e favoritar */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500">
                Cód.: {product.id.split('/').pop()?.substring(0, 6)}
              </div>
              <button className="flex items-center text-gray-500 hover:text-[#FF6700]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Favoritar</span>
              </button>
            </div>

            {/* Seleção de cores dinâmica */}
            {uniqueColors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-medium mb-3">
                  Selecione uma cor: <span className="font-semibold">{selectedColor || 'Nenhuma'}</span>
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {uniqueColors.map((color) => {
                    const disabled = isColorDisabled(color.name);
                    return (
                      <button
                        key={color.name}
                        onClick={() => !disabled && handleColorChange(color.name)}
                        disabled={disabled}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6700] ${
                          selectedColor === color.name ? 'border-[#FF6700] ring-2 ring-[#FF6700] ring-offset-1' : 'border-gray-300'
                        } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={`Selecionar cor ${color.name}${disabled ? ' (Indisponível com opções atuais)' : ''}`}
                        title={disabled ? 'Indisponível com opções atuais' : color.name} // Adiciona title para acessibilidade
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seletores Dropdown (Shadcn/UI) para outras opções */}
            <div className="space-y-4 mb-8"> {/* Adiciona espaço entre os dropdowns */}
              {productOptions.map((option) => {
                 const currentSelectionText = selectedOptions[option.name] || 'Selecione'; // Usar texto padrão mais curto se nada selecionado
                 const isOpen = dropdownOpenStates[option.name] || false; // Pega o estado de aberto/fechado
                 return (
                   <div key={option.name}>
                     {/* Label removido */}
                      <DropdownMenu onOpenChange={(open) => setDropdownOpenStates(prev => ({ ...prev, [option.name]: open }))}>
                        <DropdownMenuTrigger asChild disabled={uniqueColors.length > 0 && !selectedColor}>
                          <Button variant="outline" className="w-64 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"> {/* Largura fixa e flex para ícone */}
                            <span>{option.name}</span> {/* Nome da opção à esquerda */}
                            <div className="flex items-center"> {/* Grupo para valor e ícone */}
                              <span className="mr-2">{currentSelectionText}</span> {/* Valor selecionado */}
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {/* Ícone condicional */}
                            </div>
                           </Button>
                        </DropdownMenuTrigger>
                       <DropdownMenuContent align="start" className="w-64"> {/* Força a largura igual ao trigger */}
                         <DropdownMenuLabel>Selecione uma opção</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        {option.values.map((value) => {
                          const disabled = isOptionValueDisabled(option.name, value);
                          return (
                            <DropdownMenuItem
                              key={value}
                              disabled={disabled}
                              onSelect={() => !disabled && handleOptionChange(option.name, value)}
                              className={`${disabled ? 'text-gray-400 italic cursor-not-allowed' : 'cursor-pointer'} whitespace-normal`}
                            >
                              {value} {disabled ? '(Indisponível)' : ''}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>

            {/* Preço Dinâmico */}
            <div className="mb-6">
              {currentCompareAtPrice && (
                 <div className="text-gray-500 line-through text-sm">
                   De {currentCompareAtPrice}
                 </div>
              )}
              <div className="text-3xl text-[#FF6700] font-bold">
                {currentPrice}
              </div>
              <div className="text-sm text-gray-700">Com 8% de desconto à vista</div>
            </div>

            {/* Parcelamento */}
            <div className="mb-8 bg-gray-50 p-4 rounded-md">
               <div className="text-gray-700">
                 Ou {currentPrice}
               </div>
               <div className="text-gray-700">
                 12 x {selectedVariant
                   ? formatPrice(parseFloat(selectedVariant.price.amount) / 12, selectedVariant.price.currencyCode)
                   : formatPrice(parseFloat(product.priceRange.minVariantPrice.amount) / 12, product.priceRange.minVariantPrice.currencyCode)
                 } sem juros
               </div>
            </div>

            {/* Quantidade e botão de adicionar ao carrinho */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="flex border rounded-md">
                  <button
                    onClick={handleDecreaseQuantity}
                    className="px-3 py-2 border-r hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-12 text-center py-2"
                    aria-label="Quantidade"
                  />
                  <button
                    onClick={handleIncreaseQuantity}
                    className="px-3 py-2 border-l hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <AddToCartButton
                  product={{
                    // Dados básicos já existentes
                    id: selectedVariantId || product.id, // Usar variantId como ID principal se disponível
                    title: product.title, // Usar título principal do produto
                    price: selectedVariant ? parseFloat(selectedVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount),
                    currencyCode: selectedVariant ? selectedVariant.price.currencyCode : product.priceRange.minVariantPrice.currencyCode,
                    image: galleryImages[selectedImageIndex]?.transformedSrc || mainImage.transformedSrc || "", // Atualizado
                    variantId: selectedVariantId,
                    productId: product.id,
                    handle: product.handle, // Adicionado o handle do produto
                    // Novos dados adicionais
                    category: product.productType, // Usar productType como categoria
                    variantOptions: selectedVariant?.selectedOptions?.map(opt => ({ name: opt.name, value: opt.value })), // Mapear para o formato esperado
                    compareAtPrice: selectedVariant?.compareAtPrice, // Passar o objeto completo ou null
                    tags: product.tags, // Passar as tags do produto
                  }}
                  quantity={quantity}
                  className="flex-grow text-center"
                  // Desabilita se variante não encontrada ou sem estoque
                  disabled={!selectedVariant || (selectedVariant.quantityAvailable ?? 0) <= 0}
                />
              </div>
              {/* Mensagem se combinação inválida */}
              {!selectedVariant && selectedColor && productOptions.every(opt => selectedOptions[opt.name]) && (
                 <p className="text-red-600 text-sm mt-2">Combinação de opções indisponível.</p>
              )}
               {/* Mensagem se a variante existe mas não tem estoque */}
               {selectedVariant && (selectedVariant.quantityAvailable ?? 0) <= 0 && (
                 <p className="text-red-600 text-sm mt-2">Esta variante está indisponível no momento.</p>
               )}
            </div>

            {/* Calculadora de Frete */}
            <div className="border-t border-gray-200 pt-6">
              <ShippingCalculator />
            </div>

            {/* Devolução Grátis (mantido abaixo ou integrado se necessário) */}
            <div className="mt-4 flex items-center text-gray-600 text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#FF6700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
               </svg>
               <span>Devolução Grátis</span>
            </div>
          </div>
        </div>

        {/* Novo Acordeon para Múltiplas Especificações Técnicas de product.metafields */}
        {product.metafields && product.metafields.length > 0 && (
          <div className="w-full mb-12"> {/* Aumentado o mb para separar do próximo conteúdo */}
            <Accordion type="single" collapsible className="w-full" defaultValue="technical-specifications">
              <AccordionItem value="technical-specifications">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                  Especificações Técnicas
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-3"> {/* Aumentado pt e space-y */}
                    {product.metafields
                      .filter(metafield => 
                        metafield && 
                        metafield.value && 
                        metafield.value.trim() !== '' &&
                        (metafield.namespace === 'custom' || metafield.namespace === 'specs') &&
                        // Oculta os metafields específicos visualmente, incluindo os de controle de HTML/fonte
                        !['use custom rem base', 'rem base font size', 'html mobile', 'mobile font size', 'mobile html url'].includes(
                          metafield.key.toLowerCase().replace(/[\._-]/g, ' ').replace(/\s+/g, ' ').trim()
                        )
                      ) // Adiciona verificação para 'metafield' ser válido, inclui namespace 'specs' e oculta específicos
                      .map((metafield) => (
                        <div key={`${metafield.namespace}-${metafield.key}`} className="flex flex-col sm:flex-row text-sm"> {/* Adicionado namespace à chave para garantir unicidade */}
                          <span className="font-medium w-full sm:w-1/3 pr-2 mb-1 sm:mb-0">
                            {formatMetafieldKey(metafield.key)}:
                          </span>
                          <span className="text-gray-700 w-full sm:w-2/3">{metafield.value}</span>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Acordeon para Especificações Técnicsas (Singular - product.metafield) - Mantido por enquanto, caso tenha uso específico */}
        {/* Verificando se product.metafield existe e tem valor antes de renderizar */}
        {product.metafield?.value && (
          <div className="w-full mb-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="specifications">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">Informações Adicionais</AccordionTrigger> {/* Nome alterado para diferenciar */}
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="flex text-sm">
                      <span className="font-medium w-1/3">
                        {/* Como product.metafield é { value: string }, não temos a 'key' aqui. */}
                        {/* Usaremos um label genérico ou o valor diretamente. */}
                        Informação Adicional: {/* Usando label fixo */}
                      </span>
                      <span className="text-gray-700 w-2/3">{product.metafield.value}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Título da seção "Detalhes do Produto" */}
        <div className="w-full mt-12 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Detalhes do Produto</h2>
        </div>
      </div>

      {/* Container separado para o IsolatedHtmlContent com largura total real */}
      <div className="fullwidth-html-content">
        {/* Renderiza o IsolatedHtmlContentTest. Se isLoadingMobileHtml for true, pode-se optar por não renderizar ou mostrar um loader.
            Por enquanto, passamos fetchedMobileHtml. Se for undefined (antes do fetch ou se não houver URL),
            IsolatedHtmlContentTest usará htmlContent. Se for string vazia (erro no fetch), mostrará iframe vazio. */}
        <IsolatedHtmlContentTest
          htmlContent={product.descriptionHtml || ""}
          mobileHtmlContent={fetchedMobileHtml || ""} 
          desktopCss={desktopCss}
          mobileCss={mobileCss}
          mobileFooterHeight={600}
          desktopFooterHeight={500}
          preserveOriginalStyles={passPreserveOriginalStyles} // Logged above
          fontSizeMetafield={passFontSizeMetafield} // Logged above
          mobileFontSizeMetafield={mobileFontSizeValue} // Passa o valor do metafield de tamanho da fonte mobile
        />
      </div>
    </>
  );
}
