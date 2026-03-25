import { NextResponse } from 'next/server';
import { 
  calculateShipment, 
  type ShippingCalculatePayload,
  type PackageDimensions,
  type ShippingResponse
} from '@/lib/melhorenvio';

interface Product {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

interface CalculateShippingRequest {
  cep?: string; // Mantém compatibilidade com a versão antiga
  from?: {
    postal_code: string;
  };
  to?: {
    postal_code: string;
  };
  products?: Product[];
  options?: {
    receipt?: boolean;
    own_hand?: boolean;
  };
  services?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CalculateShippingRequest;

    // Compatibilidade com a versão antiga (apenas CEP)
    let toPostalCode: string;
    let fromPostalCode: string = '13802170'; // CEP padrão da origem
    let packageDimensions: PackageDimensions;
    let insuranceValue: number = 100.00;
    let services: string | undefined;
    let options = {
      receipt: false,
      own_hand: false,
      collect: false,
    };

    if (body.cep) {
      // Versão antiga - apenas CEP
      toPostalCode = body.cep;
      packageDimensions = {
        weight: 0.25, 
        width: 12,    
        height: 2,     
        length: 17,    
      };
    } else {
      // Nova versão - payload completo
      if (!body.to?.postal_code) {
        return NextResponse.json({ error: 'CEP de destino é obrigatório.' }, { status: 400 });
      }

      toPostalCode = body.to.postal_code;
      
      if (body.from?.postal_code) {
        fromPostalCode = body.from.postal_code;
      }

      // Calcular dimensões e peso total baseado nos produtos
      if (body.products && body.products.length > 0) {
        let totalWeight = 0;
        let maxWidth = 0;
        let maxHeight = 0;
        let maxLength = 0;
        let totalInsuranceValue = 0;

        body.products.forEach(product => {
          totalWeight += product.weight * product.quantity;
          maxWidth = Math.max(maxWidth, product.width);
          maxHeight = Math.max(maxHeight, product.height);
          maxLength = Math.max(maxLength, product.length);
          totalInsuranceValue += product.insurance_value * product.quantity;
        });

        packageDimensions = {
          weight: totalWeight,
          width: maxWidth,
          height: maxHeight,
          length: maxLength
        };

        insuranceValue = totalInsuranceValue;
      } else {
        // Usar dimensões padrão se não houver produtos
        packageDimensions = {
          weight: 0.25, 
          width: 12,    
          height: 2,     
          length: 17,    
        };
      }

      // Aplicar opções personalizadas
      if (body.options) {
        options = {
          ...options,
          ...body.options
        };
      }

      // Serviços específicos
      services = body.services;
    }

    // Validar CEP
    if (!toPostalCode || !/^\d{5}-?\d{3}$/.test(toPostalCode)) {
      return NextResponse.json({ error: 'CEP de destino inválido.' }, { status: 400 });
    }

    // Montar payload no formato esperado pela API do Melhor Envio
    // A API espera "volumes" em vez de "products"
    const volumes = body.products ? body.products.map(product => ({
      width: product.width,
      height: product.height,
      length: product.length,
      weight: product.weight
    })) : [{
      width: packageDimensions.width,
      height: packageDimensions.height,
      length: packageDimensions.length,
      weight: packageDimensions.weight
    }];
    
    const melhorEnvioPayload = {
      from: { postal_code: fromPostalCode.replace('-', '') },
      to: { postal_code: toPostalCode.replace('-', '') },
      volumes: volumes,
      options: {
        insurance_value: insuranceValue,
        receipt: options.receipt || false,
        own_hand: options.own_hand || false
      }
    };
    
    // Se services foi especificado, adicionar ao payload
    if (services) {
      (melhorEnvioPayload as any).services = services;
    }

    console.log('Payload de cálculo de frete:', JSON.stringify(melhorEnvioPayload, null, 2));

    const shippingOptions = await calculateShipment(melhorEnvioPayload as any);
    
    console.log('Resposta da API do Melhor Envio:', JSON.stringify(shippingOptions, null, 2));
    
    // Verificar se a resposta é um array
    if (!Array.isArray(shippingOptions)) {
      console.error('Resposta inesperada da API - não é um array:', shippingOptions);
      
      // Se for um objeto com erro, retornar o erro
      if (shippingOptions && typeof shippingOptions === 'object') {
        // Verificar diferentes formatos de erro possíveis
        if ('error' in shippingOptions) {
          return NextResponse.json({ 
            error: 'Erro na API do Melhor Envio', 
            details: (shippingOptions as any).error 
          }, { status: 400 });
        }
        
        if ('message' in shippingOptions) {
          return NextResponse.json({ 
            error: 'Erro na API do Melhor Envio', 
            details: (shippingOptions as any).message 
          }, { status: 400 });
        }
        
        // Se a resposta for um objeto mas não um erro, pode ser que a API
        // retornou os dados em um formato diferente
        // Vamos logar e retornar vazio por enquanto
        console.log('Resposta não é array mas também não é erro:', shippingOptions);
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ 
        error: 'Formato de resposta inválido da API do Melhor Envio',
        details: 'A resposta não é um array de opções de frete'
      }, { status: 500 });
    }

    const validOptions = shippingOptions.filter((option: any) => !option.error);

    return NextResponse.json(validOptions);

  } catch (error: any) {
    console.error('Erro ao calcular frete:', error?.response?.data || error?.message);
    return NextResponse.json(
      { 
        error: 'Erro ao calcular frete com o Melhor Envio.', 
        details: error?.response?.data || error?.message 
      }, 
      { status: 500 }
    );
  }
}
