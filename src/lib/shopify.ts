import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Interfaces para tipagem
export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
}

// Adicionando a interface Metafield aqui para uso em Product
export interface Metafield {
  key: string;
  value: string;
  namespace: string;
}

export interface ProductsConnection {
  edges: {
    node: Product;
  }[];
  pageInfo: PageInfo;
  // totalCount não é diretamente suportado pela Storefront API para products connection
  // para fins de performance. O total de produtos/páginas precisará ser gerenciado
  // de forma diferente se um contador exato for necessário para a UI de paginação.
  // Para a paginação da Shadcn, geralmente precisamos saber o número total de páginas.
  // Isso pode exigir uma query separada para contar todos os produtos ou uma estimativa.
  // Por ora, focaremos em implementar a navegação "próxima página".
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: {
      node: {
        originalSrc?: string; // Tornando opcional
        transformedSrc: string; // Adicionando novo campo
        altText: string | null;
      };
    }[];
  };
  variants?: {
    edges: {
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice?: {
          amount: string;
          currencyCode: string;
        } | null;
        availableForSale: boolean;
        quantityAvailable?: number;
        selectedOptions: { name: string; value: string }[];
        metafield?: { value: string } | null;
        mediavariant?: {
          references?: {
            nodes: {
              image: {
                originalSrc?: string; // Tornando opcional
                transformedSrc: string; // Adicionando novo campo
                altText: string | null;
              };
            }[];
          };
        } | null;
      };
    }[];
  };
  metafield?: { // Este é para um metafield singular específico, como descri_curta
    value: string;
  };
  metafields?: Metafield[]; // Para a lista de metafields de especificações
  collections?: { // Adicionado para buscar a coleção do produto
    edges: {
      node: {
        title: string;
        handle: string;
      };
    }[];
  };
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  image?: {
    originalSrc?: string; // Tornando opcional
    transformedSrc?: string; // Adicionando novo campo opcional para imagem da coleção
    altText: string | null;
  } | null;
  // Adicionando products connection para quando uma coleção é buscada com seus produtos paginados
  products?: ProductsConnection;
}

// Interface para o retorno de getProductsByCollection
export interface CollectionWithProductsPage extends Collection {
  products: ProductsConnection;
}


// Tokens da API Shopify - usando variáveis de ambiente
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN_CLIENT = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT;

if (!SHOPIFY_STOREFRONT_TOKEN_CLIENT) {
  throw new Error("A variável de ambiente NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT não está definida.");
}

// URL da API GraphQL da Shopify
// Como estamos em modo de demonstração, usaremos dados mockados quando a API não estiver disponível

// Função para criar dados mockados
const createMockData = () => {
  // Produtos mockados
  const mockProducts = Array(10).fill(null).map((_, index) => ({
    id: `gid://shopify/Product/${index + 1}`,
    title: `Xiaomi Smartphone ${index + 1}`,
    handle: `xiaomi-smartphone-${index + 1}`,
    description: `Este é um smartphone Xiaomi de alta qualidade com excelentes recursos e desempenho.`,
    priceRange: {
      minVariantPrice: {
        amount: `${999 + index * 100}`,
        currencyCode: 'BRL',
      },
    },
    images: {
      edges: [
        {
          node: {
            originalSrc: 'https://placehold.co/600x400?text=Xiaomi+Smartphone',
            transformedSrc: 'https://placehold.co/600x400?text=Xiaomi+Smartphone', // Mock
            altText: `Xiaomi Smartphone ${index + 1}`,
          },
        },
      ],
    },
  }));

  // Coleções mockadas
  const mockCollections = [
    {
      id: 'gid://shopify/Collection/1',
      title: 'Smartphones',
      handle: 'smartphones',
      description: 'Nossa coleção de smartphones Xiaomi',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Smartphones',
        transformedSrc: 'https://placehold.co/600x400?text=Smartphones', // Mock
        altText: 'Smartphones',
      },
    },
    {
      id: 'gid://shopify/Collection/2',
      title: 'Acessórios',
      handle: 'acessorios',
      description: 'Acessórios para seus dispositivos Xiaomi',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Acessorios',
        transformedSrc: 'https://placehold.co/600x400?text=Acessorios', // Mock
        altText: 'Acessórios',
      },
    },
    {
      id: 'gid://shopify/Collection/3',
      title: 'Casa Inteligente',
      handle: 'casa-inteligente',
      description: 'Produtos Xiaomi para sua casa inteligente',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Casa+Inteligente',
        transformedSrc: 'https://placehold.co/600x400?text=Casa+Inteligente', // Mock
        altText: 'Casa Inteligente',
      },
    },
  ];

  return { mockProducts, mockCollections };
};

// Criando o link HTTP para a API Storefront GraphQL
const storefrontLink = createHttpLink({
  uri: `https://${SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`,
  headers: {
    'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN_CLIENT,
    'Content-Type': 'application/json',
  },
});

// Criando o cliente Apollo para a Storefront API
export const storefrontClient = new ApolloClient({
  link: storefrontLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

// Funções para obter dados (Storefront API)

// Definições de tipo para filtros de produto
export interface ShopifyProductPriceFilter {
  price: {
    min?: number;
    max?: number;
  };
}

export interface ShopifyProductTagFilter {
  tag: string;
}

export interface ShopifyProductTypeFilter {
  productType: string;
}

// ProductFilterInput pode ser um dos tipos de filtro ou uma combinação,
// a API da Shopify espera um array de ProductFilter, onde cada objeto no array é um filtro.
// Se passarmos [{ price: {...} }, { tag: "A" }, { productType: "B" }],
// a API os combina com AND. Múltiplos filtros do mesmo tipo (ex: [{tag:"A"}, {tag:"B"}]) são OR.
export type ProductFilter = ShopifyProductPriceFilter | ShopifyProductTagFilter | ShopifyProductTypeFilter;


interface GqlVariables {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  handle?: string;
  queryText?: string; // Para searchProducts (busca textual)
  sortKey?: string;
  reverse?: boolean;
  query?: string; // Descomentado: Mantido para getProducts e searchProducts (combinado)
  filters?: ProductFilter[]; // Atualizado para o novo tipo ProductFilter
  // Adicionar outros possíveis campos de variáveis aqui
}

interface GetProductsParams {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  sortKey?: string; // BEST_SELLING, CREATED_AT, ID, PRICE, PRODUCT_TYPE, RELEVANCE, TITLE, UPDATED_AT, VENDOR
  reverse?: boolean;
  query?: string; // Para filtros de preço, busca textual E tags
  tags?: string[];
  // priceFiltersArray?: ShopifyProductPriceFilter[]; // REMOVIDO
  // productTypes?: string[]; // REMOVIDO
}

export async function getProducts(
  params: GetProductsParams,
  fetchOptions: ShopifyFetchOptions = { next: { revalidate: 3600, tags: ['products'] } }
): Promise<ProductsConnection> {
  const {
    first = 20,
    after = null,
    last = null,
    before = null,
    sortKey,
    reverse,
    query: existingQuery, // Voltando a usar existingQuery para a string de preço/textual
    tags,
    // priceFiltersArray // REMOVIDO
    // productTypes // REMOVIDO
  } = params;

  let constructedQueryParts: string[] = [];
  
  // Ordem original: preço (existingQuery), depois tags
  if (existingQuery) {
    // existingQuery (priceQuery) já vem formatado como "(condição AND condição)" ou "condição"
    // Envolvemos em parênteses para consistência e para garantir que seja tratado como um bloco de filtro.
    constructedQueryParts.push(`(${existingQuery})`);
  }

  if (tags && tags.length > 0) {
    const tagQuery = tags.map(tag => `tag:'${tag.replace(/'/g, "\\'")}'`).join(' OR ');
    constructedQueryParts.push(`(${tagQuery})`);
  }
  // A chave '}' que estava aqui foi movida para o final da função getProducts

// if (productTypes && productTypes.length > 0) { // REMOVIDO
//   const typeQuery = productTypes.map(type => `product_type:'${type.replace(/'/g, "\\'")}'`).join(' OR ');
//   constructedQueryParts.push(`(${typeQuery})`);
// }


  const finalQueryString = constructedQueryParts.join(' AND ');
  const variables: GqlVariables = {};
  const queryArgsDefsParts: string[] = [];
  const productArgsParts: string[] = [];

  if (last && before) {
    queryArgsDefsParts.push("$last: Int!", "$before: String");
    productArgsParts.push("last: $last", "before: $before");
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefsParts.push("$first: Int!");
    productArgsParts.push("first: $first");
    variables.first = first;
    if (after) {
      queryArgsDefsParts.push("$after: String");
      productArgsParts.push("after: $after");
      variables.after = after;
    }
  }

  if (sortKey) {
    queryArgsDefsParts.push("$sortKey: ProductSortKeys", "$reverse: Boolean");
    productArgsParts.push("sortKey: $sortKey", "reverse: $reverse");
    variables.sortKey = sortKey;
    variables.reverse = reverse === undefined ? false : reverse;
  }

  // if (query) { // Lógica para string query de preço removida
  //   queryArgsDefsParts.push("$query: String");
  //   variables.query = query; // Esta linha estava comentada, mas a lógica de query deve ser restaurada
  // }

  // Lógica para a query final construída
  if (finalQueryString) {
    queryArgsDefsParts.push("$query: String");
    productArgsParts.push("query: $query");
    variables.query = finalQueryString;
  }
  // NENHUMA LÓGICA PARA variables.filters AQUI, POIS O NÓ products RAIZ NÃO ACEITA
  
  const queryArgsDefsString = queryArgsDefsParts.join(", ");
  const productArgsString = productArgsParts.join(", ");
  console.log("[ShopifyLib GetProducts] productArgsString:", productArgsString); 

  const gqlQuery = `
    query GetProducts(${queryArgsDefsString}) {
      products(${productArgsString}) {
        edges {
          node {
            id
            title
            handle
            # description REMOVIDO
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            # Adicionando busca por metafield de descrição curta
            metafield(namespace: "custom", key: "descri_curta") {
              value
            }
            # Adicionando busca por variantes para compareAtPrice, cores e estoque
            variants(first: 10) { # Limita a busca de variantes para não sobrecarregar
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice { # Buscar compareAtPrice da variante
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable # Quantidade em estoque
                  # Adiciona busca pelo metafield da cor na variante
                  metafield(namespace: "custom", key: "cor") {
                    value
                  }
                }
              }
            }
            images(first: 1) {
              edges {
                node {
                  transformedSrc(maxWidth: 500, maxHeight: 500, preferredContentType: WEBP)
                  altText
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
      }
    }
  `;

  try {
    console.log("[ShopifyLib GetProducts] Constructed gqlQuery String:\n", gqlQuery);
    console.log("[ShopifyLib GetProducts] GQL Variables:", JSON.stringify(variables, null, 2));
    
    const response = await shopifyFetch<{ products: ProductsConnection }>(
      gqlQuery,
      variables,
      fetchOptions // Passa o objeto fetchOptions diretamente
    );

    // Log da resposta completa da API quando um filtro de preço está ativo
    if (variables.query && variables.query.includes("price:")) {
      // Se houver erro, response.data pode não existir.
      if ('data' in response && response.data) {
        console.log("[ShopifyLib GetProducts] API Response (for price filter query):", JSON.stringify(response.data, null, 2));
      } else if ('errors' in response) {
        console.log("[ShopifyLib GetProducts] API Error (for price filter query):", JSON.stringify(response.errors, null, 2));
      }
    }

    if ('errors' in response) {
      console.warn("[ShopifyLib GetProducts] Errors from shopifyFetch:", response.errors);
      // Retornar uma estrutura vazia válida para evitar erros de runtime
      return {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false }
      };
    }

    if (response.data && response.data.products) {
      return response.data.products;
    } else {
      console.warn("[ShopifyLib GetProducts] No products data in response:", response.data ? response.data : response); // Log mais detalhado da resposta
      // Retornar uma estrutura vazia válida para evitar erros de runtime
      return {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false }
      };
    }
  } catch (error)
 {
    console.error('Erro ao buscar produtos:', error);
    console.warn('Usando dados mockados para produtos devido a erro na API');
    const { mockProducts } = createMockData();
    // Simulação de paginação para mock data
    let hasNext = false;
    let hasPrev = false;
    let startIdx = 0;

    if (after) { // Simula 'after'
      const afterIdx = mockProducts.findIndex(p => p.id === after); // Supondo que 'after' é um ID para mock
      if (afterIdx !== -1) startIdx = afterIdx + 1;
      hasPrev = true;
    } else if (before) { // Simula 'before'
      const beforeIdx = mockProducts.findIndex(p => p.id === before);
      if (beforeIdx !== -1) {
        startIdx = Math.max(0, beforeIdx - (last || first));
      }
      hasNext = true;
    }
    
    const itemsToTake = last || first;
    const paginatedMockProducts = mockProducts.slice(startIdx, startIdx + itemsToTake);
    
    if (!before) hasNext = (startIdx + itemsToTake) < mockProducts.length;
    if (!after && startIdx > 0) hasPrev = true;


    return {
      edges: paginatedMockProducts.map(node => ({ node })),
      pageInfo: {
        hasNextPage: hasNext,
        endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null, // Usando ID como cursor mock
        hasPreviousPage: hasPrev,
        startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null, // Usando ID como cursor mock
      },
    };
  }
} // <<<<<< CHAVE DE FECHAMENTO ADICIONADA/CORRIGIDA para a função getProducts

export async function getProductByHandle(
  handle: string,
  cacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: [`product:${handle}`] } 
): Promise<Product | null> {
  const query = `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType # Buscar productType
        tags # Buscar tags
        collections(first: 1) { # Buscar a primeira coleção associada
          edges {
            node {
              title
              handle
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 5) {
          edges {
            node {
              transformedSrc(maxWidth: 1200, maxHeight: 1200, preferredContentType: WEBP)
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              # Adiciona compareAtPrice à query se necessário
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable # Pede a quantidade disponível
              selectedOptions {
                name
                value
              }
              # Adiciona busca pelo metafield da cor na variante
              metafield(namespace: "custom", key: "cor") {
                 value
              }
              # Busca o metafield com as imagens da variante
              mediavariant: metafield(namespace: "custom", key: "mediavariant") {
                # Assumindo que o valor é uma lista de referências de mídia
  references(first: 20) { # Pega as primeiras 20 imagens da variante
     nodes {
       ... on MediaImage {
         id
         image {
           transformedSrc(maxWidth: 1000, maxHeight: 1000, preferredContentType: WEBP)
           altText
         }
       }
     }
  }
              }
            }
          }
        }
        # Adicionando busca por metacampos específicos
        metafields(identifiers: [
          # Especificações técnicas
          {namespace: "custom", key: "tela"},
          {namespace: "custom", key: "sistema_operacional"},
          {namespace: "custom", key: "sensores"},
          {namespace: "custom", key: "rede_bandas"},
          {namespace: "custom", key: "processador"},
          {namespace: "custom", key: "memoria"},
          {namespace: "custom", key: "garantia"},
          {namespace: "custom", key: "dimensoes"},
          {namespace: "custom", key: "conteudo_embalagem"},
          {namespace: "custom", key: "conectividade"},
          {namespace: "custom", key: "camera"},
          {namespace: "custom", key: "bateria"},
          {namespace: "custom", key: "audio_video"},
          # URL para o conteúdo HTML específico para dispositivos móveis (substitui html_mobile)
          {namespace: "custom", key: "mobile_html_url"},
          # Metafields para controle de REM base
          {namespace: "custom", key: "use_custom_rem_base"},
          {namespace: "custom", key: "rem_base_font_size"},
          {namespace: "custom", key: "mobile_font_size"}, # Adicionado para o tamanho da fonte mobile
          # Metafields específicos para Smartwatch (sw_)
          {namespace: "custom", key: "sw_conectividade-bluetooth"},
          {namespace: "custom", key: "sw_conectividade_gps"},
          {namespace: "custom", key: "sw_conectividade_wifi"},
          {namespace: "custom", key: "sw_others_app"},
          {namespace: "custom", key: "sw_others_bateria"},
          {namespace: "custom", key: "sw_others_camera"},
          {namespace: "custom", key: "sw_others_chamada"},
          {namespace: "custom", key: "sw_others_diferenciais"},
          {namespace: "custom", key: "sw_others_embalagem"},
          {namespace: "custom", key: "sw_others_memoria_local"},
          {namespace: "custom", key: "sw_others_musica"},
          {namespace: "custom", key: "sw_others_pulseira"},
          {namespace: "custom", key: "sw_others_saude"},
          {namespace: "custom", key: "sw_others_sensores"},
          {namespace: "custom", key: "sw_others_sports"},
          {namespace: "custom", key: "sw_others_watter"},
          {namespace: "custom", key: "sw_protecao_tela"},
          {namespace: "custom", key: "sw_recursos_tela"},
          {namespace: "custom", key: "sw_resolucao"},
          {namespace: "custom", key: "sw_tamanho_tela"},
          {namespace: "custom", key: "sw_tela_sensivel_ao_toque"},
          {namespace: "custom", key: "sw_tipo_tela"}
        ]) {
          key
          value
          namespace
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch<{ productByHandle: Product | null }>(
      query,
      { handle },
      { next: cacheOptions }
    );

    if ('errors' in response) {
      console.error('Erro ao buscar produto com shopifyFetch:', response.errors);
      const { mockProducts } = createMockData(); 
      return mockProducts.find((p) => p.handle === handle) || null;
    }
    
    return response.data?.productByHandle || null;

  } catch (error) { 
    console.error('Erro catastrófico ao buscar produto (fora do shopifyFetch):', error);
    const { mockProducts } = createMockData();
    return mockProducts.find((p) => p.handle === handle) || null;
  }
}

export async function getCollections(
  cacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: ['collections'] } // Default cache options
): Promise<Collection[]> {
  const query = `
    query GetCollections {
      collections(first: 250) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              transformedSrc(maxWidth: 1000, maxHeight: 1000, preferredContentType: WEBP) # Assumindo um tamanho para imagens de coleção
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch<{ collections: { edges: { node: Collection }[] } }>(
      query,
      {},
      { next: cacheOptions }
    );

    if ('errors' in response) {
      console.error('Erro ao buscar coleções com shopifyFetch:', response.errors);
      const { mockCollections } = createMockData(); // Fallback
      return mockCollections;
    }
    
    return response.data?.collections?.edges.map((edge) => edge.node) || [];
  } catch (error) { // Este catch pode ser redundante
    console.error('Erro catastrófico ao buscar coleções (fora do shopifyFetch):', error);
    console.warn('Usando dados mockados para coleções devido a erro na API');
    const { mockCollections } = createMockData();
    return mockCollections;
  }
}

export interface GetProductsByCollectionParams { // Adicionado export
  collectionHandle: string;
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  sortKey?: string;
  reverse?: boolean; // Mantém uma declaração
  tags?: string[]; // Novo: para filtrar por tags
  // productTypes?: string[]; // REMOVIDO
  filters?: ShopifyProductPriceFilter[]; // Mantido especificamente para filtros de preço, os outros serão construídos
}

export async function getProductsByCollection(
  params: GetProductsByCollectionParams,
  cacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: [`collection:${params.collectionHandle}`] } // Default cache options
): Promise<CollectionWithProductsPage | null> {
  const {
    collectionHandle,
    first = 20,
    after = null,
    last = null,
    before = null,
    sortKey,
    reverse,
    filters: priceFilters, // Renomeado para clareza, pois 'filters' agora é mais genérico
    tags,
    // productTypes // REMOVIDO
  } = params;

  const gqlProductFilters: ProductFilter[] = [];
  if (priceFilters) {
    gqlProductFilters.push(...priceFilters);
  }
  if (tags && tags.length > 0) {
    tags.forEach(tag => gqlProductFilters.push({ tag }));
  }
  // if (productTypes && productTypes.length > 0) { // REMOVIDO
  //   productTypes.forEach(type => gqlProductFilters.push({ productType: type }));
  // }

  const variables: GqlVariables = { handle: collectionHandle };
  const queryArgsDefsParts: string[] = ["$handle: String!"];
  const productArgsParts: string[] = []; // Para o nó products DENTRO da collection

  if (last && before) {
    queryArgsDefsParts.push("$last: Int!", "$before: String");
    productArgsParts.push("last: $last", "before: $before");
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefsParts.push("$first: Int!");
    productArgsParts.push("first: $first");
    variables.first = first;
    if (after) {
      queryArgsDefsParts.push("$after: String");
      productArgsParts.push("after: $after");
      variables.after = after;
    }
  }

  if (sortKey) {
    queryArgsDefsParts.push("$sortKey: ProductCollectionSortKeys", "$reverse: Boolean");
    productArgsParts.push("sortKey: $sortKey", "reverse: $reverse");
    variables.sortKey = sortKey;
    variables.reverse = reverse === undefined ? false : reverse;
  }

  // if (query) { // Lógica para string query de preço removida
  //   queryArgsDefsParts.push("$query: String");
  //   productArgsParts.push("query: $query");
  //   variables.query = query;
  // }
  
  if (gqlProductFilters.length > 0) {
    // Para produtos dentro de uma coleção, o filtro é aplicado no nó 'products'.
    // A definição da variável $filters ainda é no nível da query principal.
    queryArgsDefsParts.push("$filters: [ProductFilter!]"); // ProductFilter é o tipo correto aqui
    productArgsParts.push("filters: $filters"); // Adiciona filters ao argumento de products()
    variables.filters = gqlProductFilters; // Passa o array combinado de filtros
  }

  const queryArgsDefsString = queryArgsDefsParts.join(", ");
  const productArgsString = productArgsParts.join(", ");

  const gqlQuery = `
    query GetProductsByCollection(${queryArgsDefsString}) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        description
        image {
          transformedSrc(maxWidth: 500, maxHeight: 500, preferredContentType: WEBP) # Assumindo um tamanho para imagens de coleção
          altText
        }
        products(${productArgsString}) {
          edges {
            node {
              id
              title
              handle
              tags
              productType
              # description REMOVIDO
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            # Adicionando busca por metafield de descrição curta
            metafield(namespace: "custom", key: "descri_curta") {
              value
            }
            # Adicionando busca por variantes para compareAtPrice, cores e estoque
            variants(first: 10) { # Limita a busca de variantes para não sobrecarregar
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice { # Buscar compareAtPrice da variante
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable # Quantidade em estoque
                  # Adiciona busca pelo metafield da cor na variante
                  metafield(namespace: "custom", key: "cor") {
                      value
                  }
                }
              }
            }
            images(first: 1) {
                edges {
                  node {
                    transformedSrc(maxWidth: 500, maxHeight: 500, preferredContentType: WEBP)
                    altText
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  `;

  try {
    console.log("[ShopifyLib GetProductsByCollection] GQL Variables for handle " + collectionHandle + ":", JSON.stringify(variables, null, 2));
    
    const response = await shopifyFetch<{ collectionByHandle: CollectionWithProductsPage | null }>(
      gqlQuery,
      variables,
      { next: cacheOptions } // Removido cache: 'no-store' de diagnóstico
    );

    // Adicionar este bloco de log
    if (gqlProductFilters.length > 0) {
      console.log(`[ShopifyLib GetProductsByCollection] API Response for handle ${collectionHandle} WITH FILTERS (${gqlProductFilters.map(f => JSON.stringify(f)).join(', ')}):`, JSON.stringify(response, null, 2));
    }
    // Fim do bloco de log

    if ('errors' in response) {
      console.error(`Erro ao buscar produtos da coleção ${collectionHandle} com shopifyFetch:`, response.errors);
      // Fallback para mock data em caso de erro
      const { mockProducts, mockCollections } = createMockData();
      const collectionMock = mockCollections.find((c) => c.handle === collectionHandle);
      if (collectionMock) {
        // Simulação de paginação para mock data (simplificada para o fallback)
        const paginatedMockProducts = mockProducts.slice(0, first);
        return {
          ...collectionMock,
          products: {
            edges: paginatedMockProducts.map(node => ({ node })),
            pageInfo: {
              hasNextPage: mockProducts.length > first,
              endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null,
              hasPreviousPage: false,
              startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null,
            },
          },
        };
      }
      return null;
    }
    
    if (response.data && response.data.collectionByHandle) {
      return response.data.collectionByHandle;
    } else if (response.data && !response.data.collectionByHandle) {
      console.error(`Coleção não encontrada via shopifyFetch: ${collectionHandle}`);
      return null;
    } else {
      console.error(`Resposta inesperada da API (shopifyFetch) para a coleção ${collectionHandle}:`, response);
      return null;
    }
  } catch (error) { // Este catch pode ser redundante
    console.error(`Erro catastrófico ao buscar produtos da coleção ${collectionHandle} (fora do shopifyFetch):`, error);
    console.warn(`Usando dados mockados para a coleção ${collectionHandle} devido a erro na API`);
    const { mockProducts, mockCollections } = createMockData();
    const collectionMock = mockCollections.find((c) => c.handle === collectionHandle);
    if (collectionMock) {
      // Simulação de paginação para mock data
      let hasNext = false;
      let hasPrev = false;
      let startIdx = 0;
      const itemsToTake = last || first;

      if (after) {
        const afterIdx = mockProducts.findIndex(p => p.id === after);
        if (afterIdx !== -1) startIdx = afterIdx + 1;
        hasPrev = true;
      } else if (before) {
        const beforeIdx = mockProducts.findIndex(p => p.id === before);
        if (beforeIdx !== -1) startIdx = Math.max(0, beforeIdx - itemsToTake);
        hasNext = true;
      }
      
      const paginatedMockProducts = mockProducts.slice(startIdx, startIdx + itemsToTake);
      if (!before) hasNext = (startIdx + itemsToTake) < mockProducts.length;
      if (!after && startIdx > 0) hasPrev = true;

      return {
        ...collectionMock,
        products: {
          edges: paginatedMockProducts.map(node => ({ node })),
          pageInfo: {
            hasNextPage: hasNext,
            endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null,
            hasPreviousPage: hasPrev,
            startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null,
          },
        },
      };
    }
    return null;
  }
}

interface SearchProductsParams {
  queryText: string; // Este é o texto da busca principal
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  sortKey?: string;
  reverse?: boolean;
  priceFilterString?: string; // Para passar o filtro de preço como string
  tags?: string[]; // Novo
  // productTypes?: string[]; // REMOVIDO
}

export async function searchProducts(
  params: SearchProductsParams,
  cacheOptions: ShopifyFetchOptions['next'] = { revalidate: 3600, tags: ['search', 'products'] } // Default cache options
): Promise<ProductsConnection> {
  const {
    queryText,
    first = 20,
    after = null,
    last = null,
    before = null,
    sortKey,
    reverse,
    priceFilterString,
    tags,
    // productTypes // REMOVIDO
  } = params;
  
  const variables: GqlVariables = {};
  const queryArgsDefsParts: string[] = [];
  const productArgsParts: string[] = [];

  let constructedQueryParts: string[] = [];
  if (queryText) { // queryText é o termo principal da busca
    constructedQueryParts.push(queryText); // Não precisa de parênteses se for o único termo textual
  }
  if (priceFilterString) {
    constructedQueryParts.push(`(${priceFilterString})`);
  }
  if (tags && tags.length > 0) {
    const tagQuery = tags.map(tag => `tag:'${tag.replace(/'/g, "\\'")}'`).join(' OR ');
    constructedQueryParts.push(`(${tagQuery})`);
  }
  // if (productTypes && productTypes.length > 0) { // REMOVIDO
  //   const typeQuery = productTypes.map(type => `product_type:'${type.replace(/'/g, "\\'")}'`).join(' OR ');
  //   constructedQueryParts.push(`(${typeQuery})`);
  // }
  
  const finalQueryString = constructedQueryParts.join(' AND ');

  if (finalQueryString) {
    queryArgsDefsParts.push("$query: String!");
    productArgsParts.push("query: $query");
    variables.query = finalQueryString;
  } else if (productArgsParts.length === 0 && !finalQueryString) {
    // Se não houver queryText, nem filtros, a API de busca pode não funcionar como esperado.
    // Adicionamos uma query vazia para evitar erro, mas isso pode retornar todos os produtos.
    // Idealmente, searchProducts deve sempre ter pelo menos queryText.
    // No entanto, para permitir busca só por filtros (ex: tag), precisamos de uma query válida.
    // Se finalQueryString for realmente vazia, a API da Shopify pode retornar erro.
    // Uma busca "vazia" no nó products raiz não é o mesmo que em collection.products.
    // Se finalQueryString estiver vazia, a API pode retornar um erro ou todos os produtos.
    // Para evitar um erro de GraphQL por não ter $query definido quando productArgsParts.query espera,
    // podemos definir uma query "aberta" se nada for fornecido, mas isso não é ideal para 'search'.
    // Por ora, a lógica acima garante que se finalQueryString tiver conteúdo, $query será usado.
    // Se finalQueryString for vazia, o argumento 'query' não será adicionado a productArgsParts.
  }


  if (last && before) {
    queryArgsDefsParts.push("$last: Int!", "$before: String");
    productArgsParts.push("last: $last", "before: $before");
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefsParts.push("$first: Int!");
    productArgsParts.push("first: $first");
    variables.first = first;
    if (after) {
      queryArgsDefsParts.push("$after: String");
      productArgsParts.push("after: $after");
      variables.after = after;
    }
  }

  if (sortKey) {
    queryArgsDefsParts.push("$sortKey: ProductSortKeys", "$reverse: Boolean");
    productArgsParts.push("sortKey: $sortKey", "reverse: $reverse");
    variables.sortKey = sortKey;
    variables.reverse = reverse === undefined ? false : reverse;
  }

  // Remover a lógica de 'filters' para searchProducts
  // if (filters && filters.length > 0) {
  //   queryArgsDefsParts.push("$filters: [ProductFilter!]");
  //   productArgsParts.push("filters: $filters");
  //   variables.filters = filters;
  // }
  
  const queryArgsDefsString = queryArgsDefsParts.join(", ");
  const productArgsString = productArgsParts.join(", ");

  // Se não houver queryText nem filters, a API pode retornar erro ou todos os produtos.
  // Idealmente, searchProducts deve sempre ter queryText.
  // Se productArgsString estiver vazio (além de first/last), pode ser problemático.
  // No entanto, a lógica atual garante que first/last sempre estarão lá.

  const gqlSearchQuery = `
    query SearchProducts(${queryArgsDefsString}) {
      products(${productArgsString}) {
        edges {
          node {
            id
            title
            handle
            # description REMOVIDO
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            # Adicionando busca por metafield de descrição curta
            metafield(namespace: "custom", key: "descri_curta") {
              value
            }
            images(first: 1) {
              edges {
                node {
                  transformedSrc(maxWidth: 500, maxHeight: 500, preferredContentType: WEBP)
                  altText
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
      }
    }
  `;

  try {
    console.log("[ShopifyLib SearchProducts] GQL Variables:", JSON.stringify(variables, null, 2));
    
    const response = await shopifyFetch<{ products: ProductsConnection }>(
      gqlSearchQuery,
      variables,
      { next: cacheOptions }
    );

    if ('errors' in response) {
      console.warn("[ShopifyLib SearchProducts] Errors from shopifyFetch:", response.errors);
      // Retornar uma estrutura vazia válida
      return {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false }
      };
    }

    if (response.data && response.data.products) {
      return response.data.products;
    } else {
      console.warn("[ShopifyLib SearchProducts] No products data in response (shopifyFetch):", response);
      // Retornar uma estrutura vazia válida
      return {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false }
      };
    }
  } catch (error) { // Este catch pode ser redundante
    console.error('Erro catastrófico ao buscar produtos (fora do shopifyFetch):', error);
    const { mockProducts } = createMockData();
    // Simulação de paginação para mock data
    const filtered = mockProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(queryText.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(queryText.toLowerCase()))
    );
    
    let hasNext = false;
    let hasPrev = false;
    let startIdx = 0;
    const itemsToTake = last || first;

    if (after) {
      const afterIdx = filtered.findIndex(p => p.id === after);
      if (afterIdx !== -1) startIdx = afterIdx + 1;
      hasPrev = true;
    } else if (before) {
      const beforeIdx = filtered.findIndex(p => p.id === before);
      if (beforeIdx !== -1) startIdx = Math.max(0, beforeIdx - itemsToTake);
      hasNext = true;
    }
    
    const paginatedMockProducts = filtered.slice(startIdx, startIdx + itemsToTake);
    if (!before) hasNext = (startIdx + itemsToTake) < filtered.length;
    if (!after && startIdx > 0) hasPrev = true;
    
    return {
      edges: paginatedMockProducts.map(node => ({ node })),
      pageInfo: {
        hasNextPage: hasNext,
        endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null,
        hasPreviousPage: hasPrev,
        startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null,
      },
    };
  }
}

// Interface para os dados do produto a ser criado (mantida para referência, mas a função será movida)
export interface ProductCreateInput {
  title: string;
  descriptionHtml?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  images?: {
    src: string;
    altText?: string;
  }[];
  variants?: {
    price: string;
    compareAtPrice?: string;
    sku?: string;
    inventoryQuantity?: number;
    requiresShipping?: boolean;
    taxable?: boolean;
  }[];
}

// As funções createProduct e createCollection foram movidas para shopify-admin.ts

// Nova função shopifyFetch (esboço inicial)
export interface ShopifyFetchOptions extends RequestInit { // Adicionado export
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, any> = {},
  options: ShopifyFetchOptions = {}
): Promise<{ data: T } | { errors: any[] }> { // Simplificando o tipo de retorno por enquanto
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`;
  const key = SHOPIFY_STOREFRONT_TOKEN_CLIENT;

  if (!key) {
    throw new Error("Token da API Storefront não configurado.");
  }

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
      },
      body: JSON.stringify({ query, variables }),
      cache: options.cache, // Permite 'force-cache', 'no-store', etc.
      ... (options.next && { next: options.next }), // Adiciona opções de cache do Next.js
    });

    const body = await result.json();

    if (body.errors) {
      console.error('Shopify Fetch Errors:', body.errors);
      return { errors: body.errors };
    }

    return { data: body.data as T };

  } catch (e) {
    console.error('Erro durante o shopifyFetch:', e);
    // Em um cenário real, você pode querer lançar o erro ou retornar um formato de erro consistente
    return { errors: [{ message: (e as Error).message }] };
  }
}
