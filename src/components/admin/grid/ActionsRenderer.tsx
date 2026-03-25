import React, { useState } from 'react';
import { 
  Edit, 
  Eye, 
  MoreHorizontal, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Copy, 
  ExternalLink,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionsRendererProps {
  data: any;
  context: {
    onEdit: (product: any) => void;
    onView: (product: any) => void;
    onPublish: (product: any) => void;
    onUnpublish: (product: any) => void;
    onArchive: (product: any) => void;
    onDelete: (product: any) => void;
    onDuplicate: (product: any) => void;
  };
  setTooltip: (value: string, shouldDisplayTooltip?: () => boolean) => void;
}

const ActionsRenderer: React.FC<ActionsRendererProps> = ({ data, context, setTooltip }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    onEdit,
    onView,
    onPublish,
    onUnpublish,
    onArchive,
    onDelete,
    onDuplicate
  } = context;

  const handleAction = async (actionFn: (product: any) => Promise<void> | void, product: any) => {
    setIsProcessing(true);
    try {
      await actionFn(product);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickEdit = () => {
    setTooltip('Editar produto', () => true);
    handleAction(onEdit, data);
  };

  const handleQuickView = () => {
    setTooltip('Visualizar produto', () => true);
    handleAction(onView, data);
  };

  const handleToggleStatus = () => {
    if (data.status === 'ACTIVE') {
      handleAction(onUnpublish, data);
    } else {
      handleAction(onPublish, data);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${data.title}"? Esta ação não pode ser desfeita.`)) {
      handleAction(onDelete, data);
    }
  };

  const getStatusAction = () => {
    if (data.status === 'ACTIVE') {
      return {
        icon: <ToggleLeft className="h-4 w-4" />,
        label: 'Despublicar',
        className: 'text-orange-600 hover:text-orange-700'
      };
    }
    return {
      icon: <ToggleRight className="h-4 w-4" />,
      label: 'Publicar',
      className: 'text-green-600 hover:text-green-700'
    };
  };

  const statusAction = getStatusAction();

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Quick Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickEdit}
          disabled={isProcessing}
          className="hover:bg-blue-50 hover:text-blue-600"
          title="Editar produto"
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickView}
          disabled={isProcessing}
          className="hover:bg-gray-50"
          title="Visualizar produto"
        >
          <Eye className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleStatus}
          disabled={isProcessing}
          className={statusAction.className}
          title={statusAction.label}
        >
          {statusAction.icon}
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              className="hover:bg-gray-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleAction(onView, data)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver na loja
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleAction(onDuplicate, data)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar produto
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {data.status !== 'ARCHIVED' ? (
              <DropdownMenuItem onClick={() => handleAction(onArchive, data)}>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction(onPublish, data)}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Desarquivar
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default ActionsRenderer;
