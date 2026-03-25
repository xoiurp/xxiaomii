'use client';

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

interface OrderPriceRendererProps extends ICellRendererParams {
  data: any;
}

export default function OrderPriceRenderer({ data }: OrderPriceRendererProps) {
  const totalPrice = data.totalPriceSet?.presentmentMoney;
  const shippingPrice = data.totalShippingPriceSet?.presentmentMoney;

  if (!totalPrice) {
    return <div className="text-gray-400">-</div>;
  }

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="font-medium text-sm">
        {totalPrice.currencyCode} {parseFloat(totalPrice.amount).toFixed(2)}
      </div>
      {shippingPrice && parseFloat(shippingPrice.amount) > 0 && (
        <div className="text-xs text-gray-500">
          Frete: {parseFloat(shippingPrice.amount).toFixed(2)}
        </div>
      )}
    </div>
  );
}
