import React from 'react';
import { Palette } from 'lucide-react';

interface ColorRendererProps {
  value: string;
  data: any;
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const ColorRenderer: React.FC<ColorRendererProps> = ({ value, data, setTooltip }) => {
  // Buscar cor nos metafields da variante
  const colorMetafield = data.metafields?.find(
    (meta: any) => meta.namespace === 'custom' && meta.key === 'cor'
  );
  const colorHex = colorMetafield?.value || value;

  React.useEffect(() => {
    if (colorHex) {
      setTooltip(`Cor: ${colorHex}`, () => true);
    }
  }, [colorHex, setTooltip]);

  if (!colorHex) {
    return (
      <div className="flex items-center text-gray-400">
        <Palette className="h-4 w-4" />
      </div>
    );
  }

  // Validar se é um hex válido
  const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorHex);

  if (!isValidHex) {
    return (
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-600">{colorHex}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0"
        style={{ backgroundColor: colorHex }}
        title={`Cor: ${colorHex}`}
      />
      <span className="text-xs text-gray-600 font-mono">
        {colorHex.toUpperCase()}
      </span>
    </div>
  );
};

export default ColorRenderer;
