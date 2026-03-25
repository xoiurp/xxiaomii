import React from 'react';
import { Badge } from '@/components/ui/badge';

interface OptionsRendererProps {
  value: string;
  data: any;
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const OptionsRenderer: React.FC<OptionsRendererProps> = ({ value, data, setTooltip }) => {
  const selectedOptions = data.selectedOptions || [];

  React.useEffect(() => {
    if (selectedOptions.length > 0) {
      const optionsText = selectedOptions
        .map((option: any) => `${option.name}: ${option.value}`)
        .join('\n');
      setTooltip(`Opções da variante:\n${optionsText}`, () => true);
    }
  }, [selectedOptions, setTooltip]);

  if (!selectedOptions.length) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  // Mostrar apenas as duas primeiras opções como badges
  const mainOptions = selectedOptions.slice(0, 2);
  const extraOptionsCount = selectedOptions.length - 2;

  return (
    <div className="flex flex-col gap-1 py-1">
      {mainOptions.map((option: any, index: number) => (
        <Badge
          key={index}
          variant="outline"
          className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200"
        >
          <span className="font-medium">{option.name}:</span>
          <span className="ml-1">{option.value}</span>
        </Badge>
      ))}
      
      {extraOptionsCount > 0 && (
        <span className="text-xs text-gray-500">
          +{extraOptionsCount} opção{extraOptionsCount > 1 ? 'ões' : ''}
        </span>
      )}
    </div>
  );
};

export default OptionsRenderer;
