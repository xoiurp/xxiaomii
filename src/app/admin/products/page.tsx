'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import '@/lib/ag-grid-config'; // Configuração dos módulos AG Grid
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellClickedEvent } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  RefreshCw,
  ArrowLeft,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';

// Importar os componentes customizados do AG Grid
import ImageRenderer from '@/components/admin/grid/ImageRenderer';
import PriceRenderer from '@/components/admin/grid/PriceRenderer';
import StatusRenderer from '@/components/admin/grid/StatusRenderer';
import ActionsRenderer from '@/components/admin/grid/ActionsRenderer';
import OptionsRenderer from '@/components/admin/grid/OptionsRenderer';
import ColorRenderer from '@/components/admin/grid/ColorRenderer';

interface ProductVariant {
  // Dados da variante
  variantId: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image: {
    src: string;
    altText?: string;
  } | null;
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
  
  // Dados herdados do produto
  productId: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  totalInventory: number;
  tags: string[];
  descri_curta?: string;
}


export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<any>(null);

  // Definição das colunas do AG-Grid baseada nas variantes
  const columnDefs: ColDef[] = [
    {
      headerName: 'Imagem',
      field: 'image',
      width: 80,
      cellRenderer: ImageRenderer,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: { padding: '4px' },
      valueFormatter: () => '', // Evitar erro do AG Grid
    },
    {
      headerName: 'Produto',
      field: 'title',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="py-1">
          <div className="font-medium text-sm text-gray-900 leading-tight">{params.value}</div>
          {params.data.descri_curta && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {params.data.descri_curta}
            </div>
          )}
        </div>
      ),
    },
    {
      headerName: 'Tipo',
      field: 'productType',
      width: 120,
      filter: true,
      cellRenderer: (params: any) => (
        <span className="text-sm text-gray-600">
          {params.value || '-'}
        </span>
      ),
    },
    {
      headerName: 'Marca',
      field: 'vendor',
      width: 100,
      filter: true,
      cellRenderer: (params: any) => (
        <span className="text-sm font-medium text-gray-700">
          {params.value || '-'}
        </span>
      ),
    },
    {
      headerName: 'SKU',
      field: 'sku',
      width: 150,
      filter: true,
      cellRenderer: (params: any) => (
        <div className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {params.value || '-'}
        </div>
      ),
    },
    {
      headerName: 'Opções',
      field: 'selectedOptions',
      width: 160,
      cellRenderer: OptionsRenderer,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Preço',
      field: 'price',
      width: 120,
      cellRenderer: PriceRenderer,
      comparator: (valueA: any, valueB: any, nodeA: any, nodeB: any) => {
        const priceA = parseFloat(nodeA.data.price || '0');
        const priceB = parseFloat(nodeB.data.price || '0');
        return priceA - priceB;
      },
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Estoque Var.',
      field: 'inventoryQuantity',
      width: 100,
      cellRenderer: (params: any) => {
        const inventory = params.value || 0;
        const isLowStock = inventory <= 5;
        return (
          <div className="flex items-center justify-center">
            <span className={`font-medium text-sm ${
              isLowStock ? 'text-red-600' : inventory <= 10 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {inventory}
            </span>
            {isLowStock && inventory > 0 && (
              <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
            )}
          </div>
        );
      },
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Estoque Total',
      field: 'totalInventory',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="text-sm text-center text-gray-600 font-medium">
          {params.value || 0}
        </div>
      ),
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Disponível',
      field: 'availableForSale',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex justify-center">
          <Badge 
            variant={params.value ? 'default' : 'secondary'}
            className={params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          >
            {params.value ? 'Sim' : 'Não'}
          </Badge>
        </div>
      ),
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      cellRenderer: StatusRenderer,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Tags',
      field: 'tags',
      width: 120,
      cellRenderer: (params: any) => {
        const tags = params.value || [];
        if (!tags.length) return <span className="text-gray-400">-</span>;
        
        return (
          <div className="flex gap-1">
            {tags.slice(0, 2).map((tag: string, index: number) => (
              <span key={index} className="text-xs bg-purple-50 text-purple-700 px-1 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-gray-400">+{tags.length - 2}</span>
            )}
          </div>
        );
      },
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Cor',
      field: 'cor',
      width: 120,
      cellRenderer: ColorRenderer,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Ações',
      field: 'actions',
      width: 160,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
      cellStyle: { padding: '4px' },
    },
  ];

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/products');
      const data = await response.json();

      if (data.success) {
        // Transformar produtos em linhas de variantes
        const variantRows: ProductVariant[] = [];
        
        data.products.forEach((product: any) => {
          // Buscar descrição curta nos metafields do produto
          const descricaoCurta = product.metafields?.find(
            (meta: any) => meta.namespace === 'custom' && meta.key === 'descri_curta'
          )?.value;

          if (product.variants && product.variants.length > 0) {
            // Criar uma linha para cada variante
            product.variants.forEach((variant: any) => {
              variantRows.push({
                // Dados da variante
                variantId: variant.id,
                sku: variant.sku || '',
                price: variant.price || '0',
                compareAtPrice: variant.compareAtPrice,
                inventoryQuantity: variant.inventoryQuantity || 0,
                availableForSale: variant.availableForSale || false,
                selectedOptions: variant.selectedOptions || [],
                image: variant.image || product.images?.[0] || null,
                metafields: variant.metafields || [],
                
                // Dados herdados do produto
                productId: product.id,
                title: product.title,
                handle: product.handle,
                status: product.status,
                vendor: product.vendor || '',
                productType: product.productType || '',
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                publishedAt: product.publishedAt,
                totalInventory: product.totalInventory || 0,
                tags: product.tags || [],
                descri_curta: descricaoCurta,
              });
            });
          } else {
            // Produto sem variantes - criar linha única
            variantRows.push({
              variantId: product.id,
              sku: '',
              price: '0',
              compareAtPrice: null,
              inventoryQuantity: 0,
              availableForSale: false,
              selectedOptions: [],
              image: product.images?.[0] || null,
              metafields: [],
              
              productId: product.id,
              title: product.title,
              handle: product.handle,
              status: product.status,
              vendor: product.vendor || '',
              productType: product.productType || '',
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
              publishedAt: product.publishedAt,
              totalInventory: product.totalInventory || 0,
              tags: product.tags || [],
              descri_curta: descricaoCurta,
            });
          }
        });
        
        setVariants(variantRows);
      } else {
        throw new Error(data.details || 'Erro ao buscar produtos');
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao carregar dados dos produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Ações dos produtos (adaptadas para variantes)
  const handlePublish = async (variant: ProductVariant) => {
    try {
      const productId = variant.productId.split('/').pop();
      const response = await fetch(`/api/admin/products/${productId}/publish`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchProducts(); // Recarregar dados
      } else {
        alert('Erro ao publicar produto: ' + data.details);
      }
    } catch (error) {
      console.error('Erro ao publicar produto:', error);
      alert('Erro ao publicar produto');
    }
  };

  const handleUnpublish = async (variant: ProductVariant) => {
    try {
      const productId = variant.productId.split('/').pop();
      const response = await fetch(`/api/admin/products/${productId}/unpublish`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchProducts(); // Recarregar dados
      } else {
        alert('Erro ao despublicar produto: ' + data.details);
      }
    } catch (error) {
      console.error('Erro ao despublicar produto:', error);
      alert('Erro ao despublicar produto');
    }
  };

  const handleDelete = async (variant: ProductVariant) => {
    if (!confirm(`Tem certeza que deseja deletar o produto "${variant.title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const productId = variant.productId.split('/').pop();
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchProducts(); // Recarregar dados
      } else {
        alert('Erro ao deletar produto: ' + data.details);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    // Navegar para página de edição do produto
    const productId = variant.productId.split('/').pop();
    router.push(`/admin/products/${productId}/edit`);
  };

  // Novas funções para as ações adicionais
  const handleView = (variant: ProductVariant) => {
    window.open(`/product/${variant.handle}`, '_blank');
  };

  const handleArchive = async (variant: ProductVariant) => {
    // Implementar lógica de arquivamento
    console.log('Arquivar produto:', variant);
  };

  const handleDuplicate = async (variant: ProductVariant) => {
    // Implementar lógica de duplicação
    console.log('Duplicar produto:', variant);
  };

  // Context para as ações (passado para os cell renderers)
  const gridContext = {
    onEdit: handleEdit,
    onView: handleView,
    onPublish: handlePublish,
    onUnpublish: handleUnpublish,
    onArchive: handleArchive,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6700] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/admin/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
              <p className="text-gray-600">Gerencie o catálogo de produtos da loja</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm" 
              onClick={fetchProducts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={() => router.push('/admin/products/new')}
              className="bg-[#FF6700] hover:bg-[#E55A00] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchProducts}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Produtos Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Variantes de Produtos ({variants.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6700] mx-auto"></div>
                  <span className="mt-2 text-gray-600">Carregando produtos...</span>
                </div>
              </div>
            ) : (
              <div className="ag-theme-quartz" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                <AgGridReact
                  rowData={variants}
                  columnDefs={columnDefs}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                  }}
                  rowHeight={80}
                  headerHeight={85}
                  animateRows={true}
                  rowSelection={{
                    mode: 'multiRow',
                    enableClickSelection: false
                  }}
                  pagination={true}
                  paginationPageSize={50}
                  onGridReady={onGridReady}
                  context={gridContext}
                  overlayNoRowsTemplate="<span>Nenhuma variante encontrada. Clique em 'Atualizar' para carregar os dados.</span>"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
