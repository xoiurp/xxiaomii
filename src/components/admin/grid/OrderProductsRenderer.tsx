'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

interface OrderProductsRendererProps extends ICellRendererParams {
  data: any;
}

export default function OrderProductsRenderer({ data }: OrderProductsRendererProps) {
  const getMainProduct = (lineItems: any) => {
    if (!lineItems || !lineItems.edges || lineItems.edges.length === 0) {
      return {
        title: 'Nenhum produto',
        subtitle: ''
      };
    }
    
    const firstItem = lineItems.edges[0].node;
    const totalItems = lineItems.edges.reduce((sum: number, item: any) => sum + item.node.quantity, 0);
    
    if (lineItems.edges.length === 1) {
      return {
        title: `${firstItem.title}`,
        subtitle: `Quantidade: ${firstItem.quantity}x`
      };
    } else {
      return {
        title: firstItem.title,
        subtitle: `+${lineItems.edges.length - 1} item${lineItems.edges.length > 2 ? 's' : ''} (${totalItems} total)`
      };
    }
  };

  const productInfo = getMainProduct(data.lineItems);

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="font-medium text-sm truncate">{productInfo.title}</div>
      <div className="text-xs text-gray-500">{productInfo.subtitle}</div>
    </div>
  );
}
