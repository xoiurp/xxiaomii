import React from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';

interface PriceRendererProps {
  value: string;
  data: any;
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const PriceRenderer: React.FC<PriceRendererProps> = ({ value, data, setTooltip }) => {
  // Agora acessamos diretamente os dados da variante
  const price = parseFloat(data.price || value || '0');
  const compareAtPrice = parseFloat(data.compareAtPrice || '0');
  const hasDiscount = compareAtPrice > price && compareAtPrice > 0;
  const discountPercentage = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  const availableForSale = data.availableForSale;

  React.useEffect(() => {
    let tooltipText = `Preço: R$ ${price.toFixed(2)}`;
    if (hasDiscount) {
      tooltipText += `\nPreço original: R$ ${compareAtPrice.toFixed(2)}`;
      tooltipText += `\nDesconto: ${discountPercentage}%`;
    }
    if (availableForSale === false) {
      tooltipText += '\nStatus: Indisponível para venda';
    }
    setTooltip(tooltipText, () => true);
  }, [price, compareAtPrice, hasDiscount, discountPercentage, availableForSale, setTooltip]);

  if (price === 0) {
    return (
      <div className="flex items-center text-gray-400">
        <DollarSign className="h-3 w-3 mr-1" />
        <span className="text-sm">-</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-1">
      <div className="flex items-center">
        <DollarSign className="h-3 w-3 text-green-600 mr-1" />
        <span className={`font-medium text-sm ${!availableForSale ? 'text-gray-400' : 'text-gray-900'}`}>
          R$ {price.toFixed(2)}
        </span>
      </div>
      
      {hasDiscount && (
        <div className="flex items-center mt-1">
          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          <span className="text-xs text-gray-500 line-through">
            R$ {compareAtPrice.toFixed(2)}
          </span>
          <span className="ml-2 bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">
            -{discountPercentage}%
          </span>
        </div>
      )}
      
      {!availableForSale && (
        <span className="text-xs text-red-600 mt-1">Indisponível</span>
      )}
    </div>
  );
};

export default PriceRenderer;
