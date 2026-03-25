'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueGetterParams, ValueSetterParams, GridApi, CellEditingStoppedEvent, RowNode, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; // Corrigido para AllCommunityModule

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Registrar os módulos da AG Grid Community
ModuleRegistry.registerModules([AllCommunityModule]); // Corrigido para AllCommunityModule e envolvido em array

// Tipagem para os produtos como recebidos da nossa API
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  status?: string;
  totalInventory?: number;
  options?: { id: string; name: string; values: string[] }[];
  images?: { id: string; src: string; altText?: string; width?: number; height?: number }[];
  variants?: ShopifyVariant[];
  metafields?: ShopifyMetafield[];
}

interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string;
  inventoryQuantity?: number;
  availableForSale?: boolean;
  barcode?: string;
  image?: { id: string; src: string };
  selectedOptions?: { name: string; value: string }[];
  metafields?: ShopifyMetafield[];
}

interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

const CadastroProdutosPage = () => {
  const [rowData, setRowData] = useState<ShopifyProduct[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (cursor: string | null = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products?limit=20${cursor ? `&cursor=${cursor}` : ''}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Erro ao buscar produtos: ${response.statusText}`);
      }
      const data = await response.json();
      setRowData(prevData => cursor ? [...prevData, ...data.products] : data.products);
      setPageInfo(data.pageInfo);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadMore = () => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      fetchProducts(pageInfo.endCursor);
    }
  };

  const onGridReady = (params: { api: GridApi }) => {
    setGridApi(params.api);
  };
  
  const onCellEditingStopped = async (event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    const field = colDef.field;

    if (!field || newValue === oldValue) {
      console.log("Nenhuma alteração ou campo indefinido.");
      return;
    }

    console.log(`Célula editada: Produto ID ${data.id}, Campo ${field}, Novo Valor: ${newValue}, Valor Antigo: ${oldValue}`);

    // Construir o payload para atualização
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productUpdatePayload: any = {
      id: data.id,
    };

    // Lógica para campos de variantes (simplificado para a primeira variante)
    if (field.startsWith('variant_')) {
      const variantField = field.split('_')[1]; // price, sku, inventoryQuantity
      if (data.variants && data.variants.length > 0) {
        const variantId = data.variants[0].id;
        productUpdatePayload.variants = [{
          id: variantId,
          [variantField]: newValue
        }];
         // Se for inventoryQuantity, converter para número
        if (variantField === 'inventoryQuantity') {
            productUpdatePayload.variants[0][variantField] = parseInt(newValue, 10);
        }
      } else {
        console.warn("Produto sem variantes para atualizar.");
        return;
      }
    } 
    // Lógica para metafields (simplificado: assume que o field é `metafield_{namespace}_{key}`)
    // E que o valor é uma string simples. A edição de JSON ou tipos complexos precisaria de mais lógica.
    else if (field.startsWith('metafield_')) {
        const parts = field.split('_');
        const namespace = parts[1];
        const key = parts[2];
        const existingMetafield = data.metafields?.find((mf: ShopifyMetafield) => mf.namespace === namespace && mf.key === key);

        if (existingMetafield) {
            productUpdatePayload.metafields = [{
                id: existingMetafield.id, // ID do metafield para atualização
                namespace: namespace,
                key: key,
                value: newValue,
                type: existingMetafield.type // Manter o tipo original
            }];
        } else {
            // Se não existir, poderia criar um novo, mas precisa do 'type'
            // Por simplicidade, vamos focar em atualizar existentes ou campos simples.
            // Para criar, precisaríamos de uma UI para definir namespace, key, value e type.
            console.warn(`Metafield ${namespace}.${key} não encontrado para atualização. Criação não implementada nesta simplificação.`);
            // Reverter a alteração na UI se a lógica de atualização não for completa
            event.node.setDataValue(field, oldValue);
            alert(`Criação de novo metafield ${namespace}.${key} não suportada diretamente na tabela ainda.`);
            return;
        }
    }
    // Campos diretos do produto
    else {
      productUpdatePayload[field] = newValue;
    }
    
    // Tags precisam ser um array de strings
    if (field === 'tags' && typeof newValue === 'string') {
        productUpdatePayload.tags = newValue.split(',').map(tag => tag.trim()).filter(tag => tag);
    }


    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdatePayload),
      });
      
      setIsLoading(false);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro ao salvar:", errorData);
        alert(`Erro ao salvar: ${errorData.error || response.statusText}`);
        // Reverter a alteração na UI em caso de erro
        event.node.setDataValue(field, oldValue);
        return;
      }
      const updatedProductFromServer = await response.json();
      console.log('Produto atualizado com sucesso:', updatedProductFromServer);
      // Atualizar o dado na grid para refletir o que veio do servidor (pode ter sido modificado/validado)
      // Idealmente, o servidor retorna o produto completo atualizado.
      // Por simplicidade, vamos assumir que a alteração foi bem sucedida como enviada.
      // event.node.setData(updatedProductFromServer); // Isso substituiria toda a linha.
      // Apenas confirmamos que a alteração foi salva. A grid já reflete o novo valor.
      alert('Produto salvo com sucesso!');

    } catch (err) {
      setIsLoading(false);
      console.error('Erro ao salvar produto:', err);
      alert(`Erro de rede ou cliente ao salvar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      event.node.setDataValue(field, oldValue); // Reverter
    }
  };


  const columnDefs = useMemo<ColDef[]>(() => [
    { headerName: 'ID', field: 'id', editable: false, width: 300 },
    { headerName: 'Título', field: 'title', editable: true, filter: true, sortable: true, resizable: true, minWidth: 200 },
    { headerName: 'Handle', field: 'handle', editable: false, filter: true, sortable: true, resizable: true, minWidth: 150 },
    { headerName: 'Tipo', field: 'productType', editable: true, filter: true, sortable: true, resizable: true, minWidth: 150 },
    { headerName: 'Fornecedor', field: 'vendor', editable: true, filter: true, sortable: true, resizable: true, minWidth: 150 },
    { 
      headerName: 'Tags', 
      field: 'tags', 
      editable: true, 
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => params.data?.tags?.join(', ') || '',
      valueSetter: (params: ValueSetterParams<ShopifyProduct>) => {
        if (params.data && typeof params.newValue === 'string') {
          params.data.tags = params.newValue.split(',').map(tag => tag.trim()).filter(tag => tag);
          return true;
        }
        return false;
      },
      minWidth: 200,
      resizable: true
    },
    { headerName: 'Status', field: 'status', editable: true, filter: true, sortable: true, resizable: true, minWidth: 100 },
    // Campos da primeira variante (simplificado)
    { 
      headerName: 'Preço Var.', 
      field: 'variant_price', 
      editable: true, 
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => params.data?.variants?.[0]?.price || '',
      valueSetter: (params: ValueSetterParams<ShopifyProduct>) => {
        if (params.data?.variants?.[0]) {
          params.data.variants[0].price = params.newValue;
          return true;
        }
        return false;
      },
      minWidth: 100,
      resizable: true
    },
    { 
      headerName: 'SKU Var.', 
      field: 'variant_sku', 
      editable: true, 
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => params.data?.variants?.[0]?.sku || '',
      valueSetter: (params: ValueSetterParams<ShopifyProduct>) => {
        if (params.data?.variants?.[0]) {
          params.data.variants[0].sku = params.newValue;
          return true;
        }
        return false;
      },
      minWidth: 120,
      resizable: true
    },
    { 
      headerName: 'Qtd Var.', 
      field: 'variant_inventoryQuantity', 
      editable: true, 
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => params.data?.variants?.[0]?.inventoryQuantity?.toString() || '',
      valueSetter: (params: ValueSetterParams<ShopifyProduct>) => {
        if (params.data?.variants?.[0]) {
          const numValue = parseInt(params.newValue, 10);
          if (!isNaN(numValue)) {
            params.data.variants[0].inventoryQuantity = numValue;
            return true;
          }
        }
        return false;
      },
      minWidth: 100,
      resizable: true,
      cellDataType: 'number'
    },
    // Metafields (exemplo para um metafield específico, precisaria ser dinâmico ou configurável)
    // Para simplificar, vamos mostrar todos os metafields como JSON. A edição direta é complexa.
    {
      headerName: 'Metafields (Produto)',
      field: 'metafields',
      editable: false, // Edição direta de JSON na célula é complexa, melhor um modal/componente dedicado
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => {
        return params.data?.metafields ? JSON.stringify(params.data.metafields, null, 2) : '';
      },
      minWidth: 300,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellEditor: 'agLargeTextCellEditor', // Permite edição multiline, mas não ideal para JSON
    },
    {
      headerName: 'Metafields (1ª Variante)',
      field: 'variant_metafields',
      editable: false,
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => {
        return params.data?.variants?.[0]?.metafields ? JSON.stringify(params.data.variants[0].metafields, null, 2) : '';
      },
      minWidth: 300,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellEditor: 'agLargeTextCellEditor',
    },
     {
      headerName: 'Imagens',
      field: 'images',
      editable: false,
      valueGetter: (params: ValueGetterParams<ShopifyProduct>) => {
        return params.data?.images?.map(img => img.src).join(', ') || '';
      },
      minWidth: 200,
      resizable: true,
      wrapText: true,
      autoHeight: true,
    },
  ], []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Cadastro de Produtos Shopify</h1>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => fetchProducts()} disabled={isLoading} style={{ marginRight: '10px', padding: '10px', cursor: 'pointer' }}>
          {isLoading && !pageInfo?.hasNextPage ? 'Carregando...' : 'Carregar Produtos do Shopify'}
        </button>
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
      </div>

      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          pagination={false} // Paginação manual
          rowSelection="single"
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            // flex: 1, // Descomente para colunas flexíveis
          }}
          onCellEditingStopped={onCellEditingStopped}
          stopEditingWhenCellsLoseFocus={true}
        />
      </div>
      {pageInfo?.hasNextPage && (
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleLoadMore} disabled={isLoading} style={{ padding: '10px', cursor: 'pointer' }}>
            {isLoading ? 'Carregando mais...' : 'Carregar Mais Produtos'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CadastroProdutosPage;
