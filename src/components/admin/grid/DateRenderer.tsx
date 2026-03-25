'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRendererProps extends ICellRendererParams {
  value: string;
}

export default function DateRenderer({ value }: DateRendererProps) {
  if (!value) return <div className="text-gray-400">-</div>;

  try {
    const date = new Date(value);
    
    return (
      <div className="flex flex-col justify-center h-full">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          {format(date, 'dd/MM/yyyy', { locale: ptBR })}
        </div>
        <div className="text-xs text-gray-400">
          {format(date, 'HH:mm', { locale: ptBR })}
        </div>
      </div>
    );
  } catch (error) {
    return <div className="text-gray-400">Data inválida</div>;
  }
}
