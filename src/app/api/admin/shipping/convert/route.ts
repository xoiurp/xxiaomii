import { NextRequest, NextResponse } from 'next/server';
import { type CartItem } from '@/lib/melhorenvio';

// Função para converter endereço do Shopify para o formato do Melhor Envio
function convertAddress(address: any, isFrom: boolean = false) {
  // Para remetente, usar dados da empresa a partir das variáveis de ambiente
  if (isFrom) {
    const fromAddress: any = {
      name: process.env.MELHOR_ENVIO_FROM_NAME || 'Mi Brasil',
      phone: process.env.MELHOR_ENVIO_FROM_PHONE || '11999999999',
      email: process.env.MELHOR_ENVIO_FROM_EMAIL || 'contato@mibrasil.com.br',
      address: process.env.MELHOR_ENVIO_FROM_ADDRESS || 'Rua Exemplo, 123',
      complement: process.env.MELHOR_ENVIO_FROM_COMPLEMENT || '',
      number: process.env.MELHOR_ENVIO_FROM_NUMBER || '123',
      district: process.env.MELHOR_ENVIO_FROM_DISTRICT || 'Centro',
      city: process.env.MELHOR_ENVIO_FROM_CITY || 'São Paulo',
      country_id: 'BR',
      postal_code: (process.env.MELHOR_ENVIO_FROM_POSTAL_CODE || '13802170').replace(/\D/g, ''),
      note: 'Loja Mi Brasil'
    };

    // Adicionar documento da empresa (CNPJ) ou pessoal (CPF) - NUNCA ambos.
    if (process.env.MELHOR_ENVIO_FROM_COMPANY_DOCUMENT) {
      fromAddress.company_document = process.env.MELHOR_ENVIO_FROM_COMPANY_DOCUMENT;
    } else if (process.env.MELHOR_ENVIO_FROM_DOCUMENT) {
      fromAddress.document = process.env.MELHOR_ENVIO_FROM_DOCUMENT;
    }

    return fromAddress;
  }

  // Verificar se address existe
  if (!address) {
    throw new Error('Endereço de entrega não encontrado');
  }

  // Extrair endereço e número da address1 (formato comum: "Rua X, 123")
  const fullAddress = address.address1 || '';
  let street = fullAddress;
  let number = address.address2 || 'S/N';

  // Tentar extrair número do endereço se estiver no formato "Rua X, 123"
  const addressMatch = fullAddress.match(/^(.+),\s*(\d+).*$/);
  if (addressMatch) {
    street = addressMatch[1].trim();
    number = addressMatch[2];
  }

  // Construir nome completo
  const fullName = `${address.firstName || ''} ${address.lastName || ''}`.trim();
  const finalName = fullName || 'Cliente';

  // Usar telefone do endereço ou gerar um padrão
  const finalPhone = address.phone || '11999999999';

  // Extrair bairro da cidade se não estiver disponível
  const finalDistrict = address.province || address.city || 'Centro';

  const baseAddress = {
    name: finalName,
    phone: finalPhone,
    email: '', // Será preenchido pelo contexto
    document: '', // Será preenchido pelo contexto
    address: street,
    complement: address.address2 && !addressMatch ? address.address2 : '',
    number: number,
    district: finalDistrict,
    city: address.city || '',
    country_id: 'BR',
    postal_code: (address.zip || '').replace(/\D/g, ''),
    note: ''
  };

  return baseAddress;
}

// Função para converter produtos do Shopify para o formato do Melhor Envio
function convertProducts(lineItems: any[]) {
  return lineItems.map(item => ({
    name: item.title || 'Produto',
    quantity: item.quantity || 1,
    unitary_value: parseFloat(item.originalUnitPriceSet?.presentmentMoney?.amount || '0')
  }));
}

// Função para calcular dimensões padrão baseadas nos produtos
function calculateVolumes(lineItems: any[]) {
  const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Dimensões padrão por produto (pode ser ajustado conforme necessário)
  const defaultDimensions = {
    height: 2,
    width: 12,
    length: 17,
    weight: 0.25
  };

  return [{
    height: defaultDimensions.height * Math.ceil(totalQuantity / 3), // Empilhar até 3 produtos
    width: defaultDimensions.width,
    length: defaultDimensions.length,
    weight: defaultDimensions.weight * totalQuantity
  }];
}

// POST - Converter pedidos do Shopify para o formato do Melhor Envio
export async function POST(request: NextRequest) {
  try {
    const { orders, serviceId = 1 } = await request.json();

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: 'orders é obrigatório e deve ser um array' }, { status: 400 });
    }

    const convertedItems: CartItem[] = [];

    for (const order of orders) {
      // Usar o serviceId específico do pedido ou o padrão
      const orderServiceId = order.selectedServiceId || serviceId;
      try {
        // Verificar se o pedido tem endereço de envio
        if (!order.shippingAddress) {
          console.warn(`Pedido ${order.name} não tem endereço de envio`);
          continue;
        }

        // Converter endereços
        const fromAddress = convertAddress(null, true); // Sempre usar dados da empresa
        const toAddress = convertAddress(order.shippingAddress, false);

        // Adicionar dados do cliente (nome, email, telefone, CPF)
        if (order.customer) {
          // Nome do cliente (prioridade: customer.firstName/lastName sobre shippingAddress)
          const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
          if (customerName) {
            toAddress.name = customerName;
          }
          
          // Email do cliente
          if (order.customer.email) {
            toAddress.email = order.customer.email;
          }
          
          // Telefone do cliente (se não houver no endereço de envio)
          if (order.customer.phone && !toAddress.phone) {
            toAddress.phone = order.customer.phone;
          }
          
          // CPF do cliente
          if (order.customer.cpf?.value) {
            toAddress.document = order.customer.cpf.value.replace(/\D/g, '');
          } else {
            console.warn(`CPF não encontrado para o cliente do pedido ${order.name}`);
            toAddress.document = '00000000000';
          }
        }

        // Usar o district do metafield do pedido, se existir
        if (order.district?.value) {
          toAddress.district = order.district.value;
        }

        // Converter produtos
        const products = convertProducts(order.lineItems?.edges?.map((edge: any) => edge.node) || []);

        // Calcular volumes
        const volumes = calculateVolumes(order.lineItems?.edges?.map((edge: any) => edge.node) || []);

        // Calcular valor do seguro baseado no valor total do pedido
        const insuranceValue = parseFloat(order.totalPriceSet?.presentmentMoney?.amount || '0');

        const cartItem: CartItem = {
          service: orderServiceId, // Usar o serviceId específico do pedido
          from: fromAddress,
          to: toAddress,
          products,
          volumes,
          options: {
            insurance_value: insuranceValue,
            receipt: false,
            own_hand: false,
            reverse: false,
            non_commercial: true, // Usar Declaração de Conteúdo
          }
        };

        convertedItems.push(cartItem);
      } catch (error) {
        console.error(`Erro ao converter pedido ${order.name}:`, error);
        // Continuar com os outros pedidos mesmo se um falhar
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: convertedItems,
      converted: convertedItems.length,
      total: orders.length
    });
  } catch (error) {
    console.error('Erro ao converter pedidos:', error);
    return NextResponse.json({ 
      error: 'Erro ao converter pedidos', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// GET - Obter configurações padrão para conversão
export async function GET() {
  try {
    const defaultConfig = {
      defaultService: 1, // PAC
      defaultFromAddress: {
        name: 'Mi Brasil',
        phone: '11999999999',
        email: 'contato@mibrasil.com.br',
        document: '12345678901',
        company_document: '12345678000100',
        address: 'Rua Exemplo, 123',
        complement: '',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        postal_code: '13802170'
      },
      defaultVolume: {
        height: 2,
        width: 12,
        length: 17,
        weight: 0.25
      },
      availableServices: [
        { id: 1, name: 'PAC' },
        { id: 2, name: 'SEDEX' },
        { id: 3, name: 'SEDEX 10' },
        { id: 4, name: 'SEDEX 12' },
        { id: 5, name: 'SEDEX Hoje' }
      ]
    };

    return NextResponse.json({ success: true, data: defaultConfig });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return NextResponse.json({ 
      error: 'Erro ao obter configurações', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
