declare module 'melhor-envio' {
  interface PackageDimensions {
    weight: number; // em kg
    width: number;  // em cm
    height: number; // em cm
    length: number; // em cm
  }

  interface Address {
    postal_code: string;
    address?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state_abbr?: string;
    country_id?: string;
  }

  interface ShippingOptions {
    insurance_value?: number;
    receipt?: boolean;
    own_hand?: boolean;
    collect?: boolean;
    non_commercial?: boolean;
  }

  interface ShippingCalculatePayload {
    from: Address;
    to: Address;
    package: PackageDimensions;
    services?: string; // IDs dos serviços separados por vírgula (ex: "1,2")
    options?: ShippingOptions;
  }

  interface ShippingResponse {
    id: number;
    name: string;
    price: string;
    custom_price?: string;
    discount?: string;
    currency: string;
    delivery_time?: number;
    delivery_range?: {
      min: number;
      max: number;
    };
    custom_delivery_time?: number;
    custom_delivery_range?: {
      min: number;
      max: number;
    };
    packages?: unknown[]; // Alterado para unknown[]
    additional_services?: unknown; // Alterado para unknown
    company?: {
      id: number;
      name: string;
      picture: string;
    };
    error?: string;
  }

  interface ShipmentService {
    calculate(payload: ShippingCalculatePayload): Promise<ShippingResponse[]>;
    // Adicione outros métodos do serviço de envio conforme necessário
  }

  interface MelhorEnvioSDK {
    shipment: ShipmentService;
    // Adicione outros serviços conforme necessário
  }

  interface MelhorEnvioConfig {
    client_id: string;
    client_secret: string;
    sandbox?: boolean;
    access_token: string;
    refresh_token?: string;
    timeout?: number;
    useragent?: string;
  }

  // Construtor do SDK
  const MelhorEnvio: {
    new (config: MelhorEnvioConfig): MelhorEnvioSDK;
  };

  export default MelhorEnvio;
}
