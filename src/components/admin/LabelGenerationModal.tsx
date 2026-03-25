'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  XCircle, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download,
  FileText,
  Package,
  Truck,
  User,
  MapPin,
  Settings
} from 'lucide-react';

interface Order {
  id: string;
  name: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  totalPriceSet: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  totalShippingPriceSet?: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  lineItems?: {
    edges?: Array<{
      node: {
        title: string;
        quantity: number;
      };
    }>;
  };
}

interface LabelGenerationModalProps {
  isOpen: boolean;
  selectedOrders: Order[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface ServiceOption {
  id: number;
  name: string;
  description: string;
  estimatedDays: string;
}

// A lista de serviços agora será buscada da API
// const serviceOptions: ServiceOption[] = [ ... ];

export default function LabelGenerationModal({ 
  isOpen, 
  selectedOrders, 
  onClose, 
  onSuccess 
}: LabelGenerationModalProps) {
  const [step, setStep] = useState<'config' | 'processing' | 'completed' | 'error'>('config');
  const [selectedServices, setSelectedServices] = useState<Map<string, number>>(new Map());
  const [shippingResults, setShippingResults] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Busca as opções de frete quando o modal é aberto
  useEffect(() => {
    if (isOpen && selectedOrders.length > 0) {
      const fetchShippingOptions = async () => {
        setIsLoadingOptions(true);
        setError(null);
        try {
          // Usar a nova API batch que calcula frete para cada pedido individualmente
          const response = await fetch('/api/shipping/calculate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orders: selectedOrders,
              fromPostalCode: "13802170" // CEP padrão da origem
            })
          });

          if (!response.ok) {
            throw new Error('Falha ao buscar opções de frete.');
          }

          const data = await response.json();
          
          if (data.success && data.results) {
            setShippingResults(data.results);
            
            // Pré-selecionar os serviços recomendados para cada pedido
            const newSelectedServices = new Map<string, number>();
            data.results.forEach((result: any) => {
              if (result.recommendedService) {
                newSelectedServices.set(result.orderId, result.recommendedService.id);
              } else if (result.shippingOptions.length > 0) {
                // Se não houver recomendação, selecionar o primeiro disponível
                newSelectedServices.set(result.orderId, result.shippingOptions[0].id);
              }
            });
            setSelectedServices(newSelectedServices);
          } else {
            throw new Error(data.error || 'Erro ao calcular fretes');
          }

        } catch (e) {
          console.error("Erro ao buscar opções de frete:", e);
          setError(e instanceof Error ? e.message : "Não foi possível carregar as opções de frete.");
          setShippingResults([]);
        } finally {
          setIsLoadingOptions(false);
        }
      };

      fetchShippingOptions();
    }
  }, [isOpen, selectedOrders]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setSelectedServices(new Map());
      setShippingResults([]);
      setIsGenerating(false);
      setResult(null);
      setError(null);
      setProgress(0);
    }
  }, [isOpen]);

  const generateLabels = async () => {
    if (selectedOrders.length === 0) return;

    setIsGenerating(true);
    setStep('processing');
    setProgress(0);

    try {
      // Simular progresso
      setProgress(10);
      
      // Preparar pedidos com seus respectivos serviços selecionados
      const ordersWithServices = selectedOrders.map(order => ({
        ...order,
        selectedServiceId: selectedServices.get(order.id) || 1 // PAC como padrão
      }));
      
      // 1. Converter pedidos para o formato do Melhor Envio
      const convertResponse = await fetch('/api/admin/shipping/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: ordersWithServices,
          // serviceId será extraído de cada pedido individualmente
        })
      });

      const convertData = await convertResponse.json();
      
      if (!convertData.success) {
        throw new Error(convertData.error || 'Erro ao converter pedidos');
      }

      setProgress(30);

      // 2. Adicionar itens ao carrinho do Melhor Envio
      const cartResponse = await fetch('/api/admin/shipping/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addToCart',
          cartItems: convertData.data
        })
      });

      const cartData = await cartResponse.json();
      
      // Lógica de verificação de sucesso mais robusta
      const allSucceeded = cartData && 
                           Array.isArray(cartData.results) && 
                           cartData.results.length > 0 && 
                           cartData.results.every((r: any) => r.success === true);

      if (!allSucceeded) {
        // Encontrar a primeira mensagem de erro detalhada para exibir
        const errorDetail = cartData?.results?.find((r: any) => r.error)?.error || cartData?.details || 'Erro ao adicionar um ou mais itens ao carrinho';
        throw new Error(errorDetail);
      }

      setProgress(100);
      setResult(cartData); // Salva a resposta completa
      setStep('completed');
      onSuccess?.();

    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setStep('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  const downloadLabels = async () => {
    if (!result || !result.print) {
      console.error('Dados de etiquetas não disponíveis');
      return;
    }

    try {
      // SIMULAÇÃO - Em produção, usar o código real comentado abaixo
      alert(`Simulando download de ${result.print.labels.length} etiqueta(s):\n\n${result.print.labels.map((label: any) => `• ${label.tracking_code || 'Código de rastreamento'}`).join('\n')}\n\nEm produção, os PDFs serão baixados automaticamente.`);
      
      console.log('Simulação de download:', result.print.labels);
      
      // CÓDIGO REAL COMENTADO - DESCOMENTAR QUANDO RESOLVER AUTENTICAÇÃO
      /*
      // Extrair IDs dos pedidos do resultado
      const orderIds = result.print.map((item: any) => item.id || item.order_id);
      
      if (orderIds.length === 0) {
        console.error('Nenhum ID de pedido encontrado');
        return;
      }

      // Fazer requisição para baixar as etiquetas
      const response = await fetch('/api/admin/shipping/labels/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: orderIds,
          format: 'pdf'
        })
      });

      const downloadData = await response.json();

      if (!downloadData.success) {
        throw new Error(downloadData.error || 'Erro ao baixar etiquetas');
      }

      // Processar downloads
      downloadData.labels.forEach((label: any, index: number) => {
        if (label.success && label.data) {
          // Assumindo que label.data contém o PDF em base64
          const base64Data = label.data.replace(/^data:application\/pdf;base64,/, '');
          
          // Criar blob do PDF
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Criar link para download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `etiqueta-${label.orderId}-${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      });

      // Se houver múltiplas etiquetas, também criar um ZIP (opcional)
      if (downloadData.labels.length > 1) {
        // Aqui você pode implementar a criação de um arquivo ZIP
        // Por enquanto, vamos apenas mostrar uma mensagem
        console.log(`${downloadData.successful} etiquetas baixadas com sucesso`);
      }
      */

    } catch (error) {
      console.error('Erro ao baixar etiquetas:', error);
      setError(error instanceof Error ? error.message : 'Erro ao baixar etiquetas');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Gerar Etiquetas de Envio</h2>
          {!isGenerating && (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'config' && (
            <div className="space-y-6">
              {/* Resumo dos Pedidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Pedidos Selecionados ({selectedOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Resumo dos valores */}
                  {(() => {
                    const totalShipping = selectedOrders.reduce((sum, order) => {
                      return sum + (order.totalShippingPriceSet ? parseFloat(order.totalShippingPriceSet.presentmentMoney.amount) : 0);
                    }, 0);
                    
                    if (totalShipping > 0) {
                      return (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              <Truck className="h-4 w-4 inline mr-1" />
                              Total de frete pago pelos clientes:
                            </span>
                            <span className="font-semibold text-blue-900">
                              R$ {totalShipping.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#FF6700] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {order.name.slice(-2)}
                          </div>
                          <div>
                            <div className="font-medium">{order.name}</div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.firstName} {order.customer?.lastName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {order.totalPriceSet.presentmentMoney.currencyCode} {parseFloat(order.totalPriceSet.presentmentMoney.amount).toFixed(2)}
                          </div>
                          {order.totalShippingPriceSet && parseFloat(order.totalShippingPriceSet.presentmentMoney.amount) > 0 && (
                            <div className="text-xs text-gray-600">
                              Frete pago: {order.totalShippingPriceSet.presentmentMoney.currencyCode} {parseFloat(order.totalShippingPriceSet.presentmentMoney.amount).toFixed(2)}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {order.shippingAddress?.city}, {order.shippingAddress?.province}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Configuração do Serviço */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurações de Envio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingOptions ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FF6700]" />
                      <span className="ml-3 text-lg">Calculando melhores opções de frete...</span>
                    </div>
                  ) : shippingResults.length > 0 ? (
                    <div className="space-y-4">
                      {shippingResults.map((result) => {
                        const order = selectedOrders.find(o => o.id === result.orderId);
                        if (!order) return null;
                        
                        return (
                          <div key={result.orderId} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{result.orderName}</h4>
                                <p className="text-sm text-gray-600">
                                  {order.shippingAddress?.city}, {order.shippingAddress?.province}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Frete pago pelo cliente:</p>
                                <p className="font-semibold text-lg">R$ {result.shippingPaidByCustomer.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            {result.shippingOptions.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 mb-2">Opções disponíveis:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {result.shippingOptions.map((option: any) => {
                                    const isSelected = selectedServices.get(result.orderId) === option.id;
                                    const isRecommended = result.recommendedService?.id === option.id;
                                    const priceDiff = parseFloat(option.price) - result.shippingPaidByCustomer;
                                    
                                    return (
                                      <div
                                        key={option.id}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                          isSelected
                                            ? 'border-[#FF6700] bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${isRecommended ? 'ring-2 ring-green-500' : ''}`}
                                        onClick={() => {
                                          const newServices = new Map(selectedServices);
                                          newServices.set(result.orderId, option.id);
                                          setSelectedServices(newServices);
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="font-medium flex items-center">
                                              {option.name}
                                              {isRecommended && (
                                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                  Recomendado
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {option.company?.name} • {option.delivery_time || 'N/A'} dias
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-semibold">R$ {parseFloat(option.price).toFixed(2)}</div>
                                            <div className={`text-xs ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                              {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-4">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>Nenhuma opção de frete encontrada para este pedido</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Resumo das diferenças */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Resumo das Diferenças</h4>
                        {(() => {
                          let totalPaid = 0;
                          let totalCalculated = 0;
                          
                          shippingResults.forEach(result => {
                            totalPaid += result.shippingPaidByCustomer;
                            const selectedOption = result.shippingOptions.find(
                              (opt: any) => opt.id === selectedServices.get(result.orderId)
                            );
                            if (selectedOption) {
                              totalCalculated += parseFloat(selectedOption.price);
                            }
                          });
                          
                          const difference = totalCalculated - totalPaid;
                          
                          return (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Total pago pelos clientes:</span>
                                <span className="font-medium">R$ {totalPaid.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total dos serviços selecionados:</span>
                                <span className="font-medium">R$ {totalCalculated.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span className="font-medium">Diferença total:</span>
                                <span className={`font-bold ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {difference > 0 ? '+' : ''} R$ {difference.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3" />
                      <p>Nenhuma opção de frete encontrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={generateLabels} className="bg-[#FF6700] hover:bg-[#E55A00]">
                  <Printer className="h-4 w-4 mr-2" />
                  Gerar Etiquetas
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#FF6700]" />
              <h3 className="text-lg font-medium mb-2">Processando etiquetas...</h3>
              <p className="text-gray-600 mb-4">
                Gerando etiquetas para {selectedOrders.length} pedido{selectedOrders.length !== 1 ? 's' : ''}
              </p>
              
              {/* Barra de Progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-[#FF6700] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-500">
                {progress < 30 && 'Convertendo dados dos pedidos...'}
                {progress >= 30 && progress < 60 && 'Adicionando ao carrinho...'}
                {progress >= 60 && progress < 80 && 'Processando pagamento...'}
                {progress >= 80 && progress < 100 && 'Gerando etiquetas...'}
                {progress === 100 && 'Concluído!'}
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Itens Adicionados ao Carrinho!</h3>
              <p className="text-gray-600 mb-6">
                {selectedOrders.length} etiqueta{selectedOrders.length !== 1 ? 's foram adicionadas' : ' foi adicionada'} ao seu carrinho no Melhor Envio.
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <a
                  href="https://melhorenvio.com.br/carrinho"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6700] hover:bg-[#E55A00]"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Ver Carrinho no Melhor Envio
                </a>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao gerar etiquetas</h3>
              <p className="text-gray-600 mb-2">
                Ocorreu um erro durante o processo de geração das etiquetas.
              </p>
              <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 rounded-lg">
                {error}
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={() => setStep('config')} className="bg-[#FF6700] hover:bg-[#E55A00]">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
