'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { Eye, Printer, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface OrderActionsRendererProps {
  data: any;
  context?: {
    selectedOrders?: Set<string>;
    sentLabelOrders?: Set<string>;
    toggleOrderSelection?: (orderId: string) => void;
    canGenerateLabel?: (order: any) => boolean;
  };
}

export default function OrderActionsRenderer({ data, context }: OrderActionsRendererProps) {
  const orderId = data.id.split('/').pop();
  const isEligible = context?.canGenerateLabel?.(data) || false;
  const isSelected = context?.selectedOrders?.has(data.id) || false;
  const hasSentLabel = context?.sentLabelOrders?.has(data.id) || false;

  const handleCheckboxChange = () => {
    if (context?.toggleOrderSelection) {
      context.toggleOrderSelection(data.id);
    }
  };

  return (
    <div className="flex items-center gap-2 h-full">
      {/* Checkbox para seleção */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleCheckboxChange}
        disabled={!isEligible}
        className="rounded border-gray-300 text-[#FF6700] focus:ring-[#FF6700] disabled:opacity-50"
        title={!isEligible ? 'Pedido não elegível para etiqueta' : 'Selecionar pedido'}
      />
      
      {/* Indicador de status da etiqueta */}
      {hasSentLabel && (
        <div className="text-blue-600" title="Etiqueta enviada">
          <CheckCircle className="h-4 w-4" />
        </div>
      )}
      
      {isEligible && !hasSentLabel && (
        <div className="text-green-600" title="Etiqueta disponível">
          <FileText className="h-4 w-4" />
        </div>
      )}
      
      {/* Botão de visualizar */}
      <Link href={`/admin/orders/${orderId}`}>
        <Button variant="ghost" size="sm" className="p-2">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
