"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image'; // Importar Image de next/image
import { IMaskInput } from 'react-imask'; // Importar IMaskInput
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react'; // Ícone de carregamento
import { useCart, type ShippingOption } from '@/context/CartContext';

export default function ShippingCalculator() {
  const { selectedShipping, setSelectedShipping } = useCart();
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const handleCepChange = (event: React.ChangeEvent<HTMLInputElement>) => { // REMOVIDO - NÃO UTILIZADO
  //   setCep(event.target.value);
  //   // Limpa opções e erros ao digitar novo CEP
  //   if (shippingOptions.length > 0) setShippingOptions([]);
  //   // Com react-imask, o valor já vem sem máscara se 'unmask' for true
  //   // if (shippingOptions.length > 0) setShippingOptions([]);
  //   // if (error) setError(null);
  // };

  // Função onAccept para react-imask
  const handleAccept = (value: string) => {
    setCep(value); // Atualiza o estado com o valor não mascarado
    if (shippingOptions.length > 0) setShippingOptions([]);
    if (error) setError(null);
  };

  const calculateShipping = useCallback(async () => {
    // A validação pode ser simplificada, pois react-imask ajuda a garantir o formato
    if (!cep || cep.length !== 8) { // Verifica se tem 8 dígitos (sem máscara)
      setError('Por favor, insira um CEP válido com 8 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShippingOptions([]); // Limpa opções anteriores
    setSelectedShipping(null); // Limpa a seleção anterior

    try {
      console.log(`Enviando requisição para calcular frete para CEP: ${cep}`);
      
      const response = await axios.post<ShippingOption[]>('/api/shipping/calculate', {
        cep: cep.replace('-', ''), // Envia CEP sem hífen
      });

      console.log('Resposta do cálculo de frete:', response.data);

      if (response.data && response.data.length > 0) {
        setShippingOptions(response.data);
      } else {
        setError('Nenhuma opção de frete encontrada para este CEP.');
      }
    } catch (err: unknown) { // Alterado para unknown
      console.error("Erro ao calcular frete:", err);
      
      let errorMessage = 'Erro ao calcular o frete. Tente novamente.';
      
      if (axios.isAxiosError(err) && err.response?.data) { // Verifica se é um erro do Axios
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = (errorData as { error: string }).error;
          
          if ('details' in errorData && typeof (errorData as { details: string }).details === 'string') {
            console.error('Detalhes do erro:', (errorData as { details: string }).details);
            errorMessage += `: ${(errorData as { details: string }).details}`;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [cep, setSelectedShipping]); // Adicionado setSelectedShipping

  // Função para lidar com a seleção de uma opção de frete
  const handleSelectOption = (option: ShippingOption) => {
    setSelectedShipping(option);
  };

  // Função para formatar o prazo de entrega
  const formatDeliveryTime = (option: ShippingOption): string => {
    if (option.delivery_time !== undefined) {
      return `${option.delivery_time} dia${option.delivery_time !== 1 ? 's' : ''} útil${option.delivery_time !== 1 ? 's' : ''}`;
    }
    if (option.delivery_min !== undefined && option.delivery_max !== undefined) {
      if (option.delivery_min === option.delivery_max) {
        return `${option.delivery_min} dia${option.delivery_min !== 1 ? 's' : ''} útil${option.delivery_min !== 1 ? 's' : ''}`;
      }
      return `De ${option.delivery_min} a ${option.delivery_max} dias úteis`;
    }
    return 'Prazo não informado';
  };

  // Função para formatar preço
  const formatPrice = (price: string): string => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return 'Preço inválido';
    return numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="border border-gray-200 rounded-md p-4">
      <p className="font-medium mb-2">Calcular frete e prazo</p>
      <div className="flex items-center gap-2 mb-3">
        <IMaskInput
          mask="00000-000"
          unmask={true} // Retorna o valor sem a máscara no onAccept
          value={cep} // O estado 'cep' agora armazena o valor não mascarado
          onAccept={handleAccept} // Usa onAccept para atualizar o estado
          disabled={isLoading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-grow"
          placeholder="Digite seu CEP"
          // Adiciona type="tel" para melhor experiência mobile
          type="tel"
          inputMode="numeric"
        />
        <Button
          onClick={calculateShipping}
          disabled={isLoading || !cep || cep.length !== 8} // Valida se tem 8 dígitos
          size="sm" // Botão um pouco menor
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular'}
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {shippingOptions.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Opções de entrega:</p>
          <ul className="text-sm text-gray-700 space-y-3">
            {shippingOptions.map((option) => (
              <li key={option.id} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`shipping-option-${option.id}`}
                    name="shipping-option"
                    type="radio"
                    className="h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                    checked={selectedShipping?.id === option.id}
                    onChange={() => handleSelectOption(option)}
                  />
                </div>
                <div className="ml-3 flex justify-between w-full">
                  <label htmlFor={`shipping-option-${option.id}`} className="font-medium text-gray-700 cursor-pointer flex items-center">
                    {option.company?.picture && (
                      <div className="relative h-4 w-auto mr-2" style={{ maxWidth: '60px' }}>
                        <Image
                          src={option.company.picture}
                          alt={option.company.name || 'Logo da transportadora'}
                          fill
                          sizes="60px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span>{option.name}</span>
                  </label>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(option.price)}</div>
                    <div className="text-xs text-gray-500">{formatDeliveryTime(option)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
