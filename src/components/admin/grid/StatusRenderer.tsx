import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Archive, 
  AlertCircle,
  Eye,
  EyeOff 
} from 'lucide-react';

interface StatusRendererProps {
  value: string;
  data: any;
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const StatusRenderer: React.FC<StatusRendererProps> = ({ value, data, setTooltip }) => {
  const status = value;
  const publishedAt = data.publishedAt;
  const isPublished = status === 'ACTIVE' && publishedAt;

  React.useEffect(() => {
    let tooltipText = '';
    switch (status) {
      case 'ACTIVE':
        tooltipText = isPublished ? 'Produto ativo e publicado na loja' : 'Produto ativo mas não publicado';
        break;
      case 'ARCHIVED':
        tooltipText = 'Produto arquivado e não visível na loja';
        break;
      case 'DRAFT':
        tooltipText = 'Produto em rascunho, não visível na loja';
        break;
      default:
        tooltipText = `Status: ${status}`;
    }

    if (publishedAt) {
      const publishDate = new Date(publishedAt).toLocaleString('pt-BR');
      tooltipText += `\nPublicado em: ${publishDate}`;
    }

    setTooltip(tooltipText, () => true);
  }, [status, publishedAt, isPublished, setTooltip]);

  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Ativo',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />
        };
      case 'ARCHIVED':
        return {
          label: 'Arquivado',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Archive className="h-3 w-3" />
        };
      case 'DRAFT':
        return {
          label: 'Rascunho',
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant={config.variant}
        className={`${config.className} flex items-center gap-1 w-fit`}
      >
        {config.icon}
        {config.label}
      </Badge>
      
      {status === 'ACTIVE' && !isPublished && (
        <span className="text-xs text-orange-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Não publicado
        </span>
      )}
      
      {status === 'ACTIVE' && isPublished && (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Publicado
        </span>
      )}
    </div>
  );
};

export default StatusRenderer;
