'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

interface CustomerRendererProps extends ICellRendererParams {
  data: any;
}

export default function CustomerRenderer({ data }: CustomerRendererProps) {
  const getCustomerName = (customer: any) => {
    if (!customer) return 'Cliente não identificado';
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.firstName || customer.lastName || customer.email || 'Cliente';
  };

  const customerName = getCustomerName(data.customer);
  const customerEmail = data.customer?.email || 'Email não disponível';

  return (
    <div className="flex items-center h-full">
      <div className="w-8 h-8 bg-[#FF6700] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
        {customerName[0]}
      </div>
      <div>
        <div className="font-medium text-sm">{customerName}</div>
        <div className="text-xs text-gray-500">{customerEmail}</div>
      </div>
    </div>
  );
}
