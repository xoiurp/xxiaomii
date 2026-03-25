import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/shopify-admin';
import { gql } from '@apollo/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Validar se o ID tem formato correto (gid://shopify/Order/ID ou apenas ID)
    let shopifyOrderId: string;
    if (orderId.startsWith('gid://shopify/Order/')) {
      shopifyOrderId = orderId;
    } else {
      shopifyOrderId = `gid://shopify/Order/${orderId}`;
    }

    const query = `
      query getOrderDetails($id: ID!) {
        order(id: $id) {
          id
          name
          createdAt
          updatedAt
          processedAt
          closedAt
          cancelledAt
          cancelReason
          confirmed
          test
          displayFinancialStatus
          displayFulfillmentStatus
          email
          phone
          note
          tags
          district: metafield(namespace: "custom", key: "district") {
            value
          }
          customer {
            id
            firstName
            lastName
            email
            phone
            cpf: metafield(namespace: "custom", key: "cpf") {
              value
            }
            defaultAddress {
              address1
              address2
              city
              province
              country
              zip
            }
          }
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          billingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  price
                  sku
                  image {
                    originalSrc
                    altText
                  }
                }
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                taxLines {
                  title
                  rate
                  priceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          transactions {
            id
            kind
            status
            amount
            gateway
            createdAt
            processedAt
          }
          fulfillments {
            id
            status
            trackingInfo {
              company
              number
              url
            }
            createdAt
            updatedAt
            fulfillmentLineItems(first: 50) {
              edges {
                node {
                  id
                  quantity
                  lineItem {
                    id
                    title
                  }
                }
              }
            }
          }
          shippingLine {
            id
            title
            code
            carrierIdentifier
            custom
            deliveryCategory
            currentDiscountedPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            discountedPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            discountAllocations {
              allocatedAmountSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountApplication {
                ... on DiscountCodeApplication {
                  code
                }
                ... on ManualDiscountApplication {
                  title
                }
                ... on AutomaticDiscountApplication {
                  title
                }
              }
            }
          }
          discountApplications(first: 10) {
            edges {
              node {
                targetSelection
                targetType
                value {
                  ... on MoneyV2 {
                    amount
                    currencyCode
                  }
                  ... on PricingPercentageValue {
                    percentage
                  }
                }
                ... on DiscountCodeApplication {
                  title: code
                }
                ... on AutomaticDiscountApplication {
                  title
                }
                ... on ManualDiscountApplication {
                  title
                }
              }
            }
          }
          taxLines {
            title
            rate
            priceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `;

    const variables = {
      id: shopifyOrderId
    };

    console.log('Buscando detalhes do pedido:', shopifyOrderId);

    if (!adminClient) {
      return NextResponse.json({
        error: 'Cliente admin não configurado',
        details: 'Token de acesso admin não encontrado'
      }, { status: 500 });
    }

    const response = await adminClient.query({
      query: gql`${query}`,
      variables
    });

    const data = response.data;

    if (response.errors) {
      console.error('Erro GraphQL:', response.errors);
      return NextResponse.json({
        error: 'Erro ao buscar detalhes do pedido',
        details: response.errors
      }, { status: 500 });
    }

    if (!data.order) {
      return NextResponse.json({
        error: 'Pedido não encontrado',
        details: `Pedido com ID ${orderId} não foi encontrado`
      }, { status: 404 });
    }

    const order = data.order;

    // Processar dados para facilitar o uso no frontend
    const processedOrder = {
      ...order,
      // Extrair orderNumber do campo name (ex: "#1001" -> 1001)
      orderNumber: order.name ? parseInt(order.name.replace('#', '')) : 0,
      // Renomear campos de preço para compatibilidade com frontend
      currentTotalPriceSet: order.totalPriceSet,
      currentSubtotalPriceSet: order.subtotalPriceSet,
      currentTotalTaxSet: order.totalTaxSet,
      currentTotalDiscountsSet: order.totalDiscountsSet,
      currentShippingPriceSet: order.totalShippingPriceSet,
      // Converter transações para array simples
      transactions: order.transactions || [],
      // Processar fulfillments para estrutura esperada
      fulfillments: (order.fulfillments || []).map((fulfillment: any) => ({
        ...fulfillment,
        trackingCompany: fulfillment.trackingInfo?.company || null,
        trackingNumber: fulfillment.trackingInfo?.number || null,
        trackingUrl: fulfillment.trackingInfo?.url || null,
        lineItems: fulfillment.fulfillmentLineItems?.edges?.map((edge: any) => edge.node) || []
      })),
      // Converter shipping lines de connection para array simples e normalizar estrutura
      shippingLine: order.shippingLine ? {
        id: order.shippingLine.id,
        title: order.shippingLine.title,
        code: order.shippingLine.code,
        carrierIdentifier: order.shippingLine.carrierIdentifier,
        custom: order.shippingLine.custom,
        deliveryCategory: order.shippingLine.deliveryCategory,
        // Manter compatibilidade com o campo price antigo
        price: order.shippingLine.currentDiscountedPriceSet?.shopMoney?.amount || 
               order.shippingLine.discountedPriceSet?.shopMoney?.amount || 
               "0.00",
        // Campos de preço detalhados
        currentDiscountedPriceSet: {
          shopMoney: {
            amount: order.shippingLine.currentDiscountedPriceSet?.shopMoney?.amount || "0.00",
            currencyCode: order.shippingLine.currentDiscountedPriceSet?.shopMoney?.currencyCode || "BRL"
          },
          presentmentMoney: {
            amount: order.shippingLine.currentDiscountedPriceSet?.presentmentMoney?.amount || "0.00",
            currencyCode: order.shippingLine.currentDiscountedPriceSet?.presentmentMoney?.currencyCode || "BRL"
          }
        },
        discountedPriceSet: {
          shopMoney: {
            amount: order.shippingLine.discountedPriceSet?.shopMoney?.amount || "0.00",
            currencyCode: order.shippingLine.discountedPriceSet?.shopMoney?.currencyCode || "BRL"
          },
          presentmentMoney: {
            amount: order.shippingLine.discountedPriceSet?.presentmentMoney?.amount || "0.00",
            currencyCode: order.shippingLine.discountedPriceSet?.presentmentMoney?.currencyCode || "BRL"
          }
        },
        discountAllocations: order.shippingLine.discountAllocations || []
      } : null,
      // Converter tax lines para array simples
      taxLines: order.taxLines || [],
      // Converter tags para array (pode vir como string ou array)
      tags: Array.isArray(order.tags) 
        ? order.tags 
        : (order.tags && typeof order.tags === 'string') 
          ? order.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) 
          : [],
      // Normalizar estrutura dos line items
      lineItems: {
        edges: order.lineItems?.edges?.map((edge: any) => ({
          node: {
            ...edge.node,
            variant: edge.node.variant ? {
              ...edge.node.variant,
              image: edge.node.variant.image ? {
                ...edge.node.variant.image,
                url: edge.node.variant.image.originalSrc
              } : null
            } : null
          }
        })) || []
      }
    };

    console.log('Detalhes do pedido encontrados:', {
      id: order.id,
      name: order.name,
      lineItemsCount: order.lineItems?.edges?.length || 0,
      transactionsCount: order.transactions?.length || 0,
      fulfillmentsCount: order.fulfillments?.length || 0
    });

    return NextResponse.json({
      order: processedOrder,
      success: true
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
