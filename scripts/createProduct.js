const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Usar as variáveis de ambiente ou valores padrão como fallback
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'uxh1te-1d.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

async function createProduct() {
  const productCreateQuery = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const productInput = {
    title: "Redmi 14C 128GB/4GB RAM 4G",
    bodyHtml: "<p>O Redmi 14C é um smartphone versátil e potente que combina desempenho eficiente com uma experiência visual imersiva. Com sua ampla tela Dot Drop de 6,88 polegadas e taxa de atualização de 120 Hz, oferece uma experiência visual fluida e vibrante para navegação, redes sociais e entretenimento. Equipado com processador MediaTek Helio G81-Ultra, 4GB de RAM e 128GB de armazenamento expansível, o Redmi 14C proporciona desempenho estável para multitarefas e aplicativos exigentes. A impressionante câmera principal de 50MP captura fotos detalhadas em qualquer cenário, enquanto a bateria de 5.160 mAh garante autonomia para o dia inteiro. Disponível nas cores Preto, StarBlue e Verde, o Redmi 14C oferece excelente custo-benefício com Xiaomi HyperOS e recursos avançados de segurança.</p>",
    vendor: "Xiaomi",
    productType: "Smartphone",
    tags: ["4G", "128GB", "4GB RAM", "MediaTek", "50MP", "HyperOS"],
    metafields: [
      {
        namespace: "especificacoes",
        key: "processador",
        value: "MediaTek Helio G81-Ultra",
        type: "single_line_text_field"
      },
      {
        namespace: "especificacoes",
        key: "tela",
        value: "6,88 polegadas, 120Hz",
        type: "single_line_text_field"
      },
      {
        namespace: "especificacoes",
        key: "camera",
        value: "50MP traseira, 13MP frontal",
        type: "single_line_text_field"
      },
      {
        namespace: "especificacoes",
        key: "bateria",
        value: "5160mAh",
        type: "single_line_text_field"
      }
    ]
  };

  const productResponse = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2023-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query: productCreateQuery,
      variables: { input: productInput },
    }),
  });

  const productResult = await productResponse.json();
  console.log('Resultado da criação do produto:');
  console.log(JSON.stringify(productResult, null, 2));

  if (
    productResult.data &&
    productResult.data.productCreate &&
    productResult.data.productCreate.product &&
    productResult.data.productCreate.product.variants.edges.length > 0
  ) {
    const variantId = productResult.data.productCreate.product.variants.edges[0].node.id;

    const variantUpdateQuery = `
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            sku
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variantInput = {
      id: variantId,
      price: "999.99",
      inventoryItem: {
        sku: "REDMI14C-128GB-4GB"
      }
    };

    const variantResponse = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2023-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: variantUpdateQuery,
        variables: { input: variantInput },
      }),
    });

    const variantResult = await variantResponse.json();
    console.log('Resultado da atualização da variante padrão:');
    console.log(JSON.stringify(variantResult, null, 2));
  }
}

createProduct().catch(console.error);