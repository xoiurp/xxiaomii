import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      {/* Placeholder para Imagem */}
      <div className="block relative h-64 overflow-hidden bg-gray-200"></div>

      {/* Placeholder para Detalhes */}
      <div className="p-4">
        {/* Placeholder para Título */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        {/* Placeholder para Preço e Botão */}
        <div className="flex justify-between items-center mt-3">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
