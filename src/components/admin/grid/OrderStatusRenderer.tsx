'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Badge } from '@/components/ui/badge';

interface OrderStatusRendererProps extends ICellRendererParams {
  value: string;
  data: any;
}

export default function OrderStatusRenderer({ value, data, colDef }: OrderStatusRendererProps) {
  const getStatusBadge = (status: string, type: 'financial' | 'fulfillment') => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full";
    
    if (type === 'financial') {
      switch (status) {
        case 'PAID':
          return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Pago</Badge>;
        case 'PENDING':
          return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pendente</Badge>;
        case 'AUTHORIZED':
          return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Autorizado</Badge>;
        case 'PARTIALLY_PAID':
          return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Parcialmente Pago</Badge>;
        case 'PARTIALLY_REFUNDED':
          return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Parcialmente Reembolsado</Badge>;
        case 'REFUNDED':
          return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Reembolsado</Badge>;
        case 'VOIDED':
          return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Cancelado</Badge>;
        case 'EXPIRED':
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Expirado</Badge>;
        default:
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'FULFILLED':
          return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Entregue</Badge>;
        case 'PARTIAL':
          return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Parcial</Badge>;
        case 'UNFULFILLED':
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Não Atendido</Badge>;
        case 'SHIPPED':
          return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Enviado</Badge>;
        case 'UNSHIPPED':
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Não Enviado</Badge>;
        case 'SCHEDULED':
          return <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>Agendado</Badge>;
        case 'ON_HOLD':
          return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Em Espera</Badge>;
        case 'REQUEST_DECLINED':
          return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Recusado</Badge>;
        default:
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</Badge>;
      }
    }
  };

  // Determinar tipo de status usando múltiplas estratégias
  let statusType: 'financial' | 'fulfillment' = 'fulfillment';
  
  if (colDef?.field === 'displayFinancialStatus') {
    statusType = 'financial';
  } else if (data?.colDef?.field === 'displayFinancialStatus') {
    statusType = 'financial';
  } else if (value && ['PAID', 'PENDING', 'AUTHORIZED', 'PARTIALLY_PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED', 'EXPIRED'].includes(value)) {
    statusType = 'financial';
  }
  
  return (
    <div className="flex items-center h-full">
      {getStatusBadge(value, statusType)}
    </div>
  );
}
