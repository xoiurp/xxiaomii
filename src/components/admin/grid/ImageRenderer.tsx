import React, { useState } from 'react';
import { Package, ImageIcon } from 'lucide-react';

interface ImageRendererProps {
  value: any;
  data: any;
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({ value, data, setTooltip }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Debug: Log dos dados recebidos
  React.useEffect(() => {
    console.log('ImageRenderer - value:', value);
    console.log('ImageRenderer - data.image:', data.image);
    console.log('ImageRenderer - data.title:', data.title);
  }, [value, data.image, data.title]);
  
  // Buscar a URL da imagem de diferentes fontes possíveis
  let imageUrl: string | undefined;
  let altText: string | undefined;
  
  if (typeof value === 'object' && value?.src) {
    imageUrl = value.src;
    altText = value.altText;
  } else if (typeof value === 'string') {
    imageUrl = value;
  } else if (data.image?.src) {
    imageUrl = data.image.src;
    altText = data.image.altText;
  } else if (typeof data.image === 'string') {
    imageUrl = data.image;
  }
  
  // Fallback para altText
  if (!altText) {
    altText = data.title;
  }
  
  // Debug: Log da URL final
  React.useEffect(() => {
    console.log('ImageRenderer - imageUrl final:', imageUrl);
  }, [imageUrl]);
  
  React.useEffect(() => {
    if (imageUrl && !imageError) {
      setTooltip(
        `Produto: ${data.title}${altText ? `\nDescrição da imagem: ${altText}` : ''}`,
        () => true
      );
    }
  }, [imageUrl, imageError, data.title, altText, setTooltip]);

  if (!imageUrl || imageError) {
    return (
      <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center group hover:bg-gray-50 transition-colors">
        <Package className="h-6 w-6 text-gray-400 group-hover:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group hover:shadow-md transition-all duration-200">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-gray-400 animate-pulse" />
        </div>
      )}
      <img 
        src={imageUrl} 
        alt={altText}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
      />
      {/* Overlay com zoom effect no hover */}
      <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
        <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </div>
  );
};

export default ImageRenderer;
