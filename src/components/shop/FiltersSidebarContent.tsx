'use client';

import React, { useState } from 'react'; // Adicionado useState
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Adicionado usePathname
import { Collection } from '@/lib/shopify'; // Usando alias para consistência
import { Button } from '@/components/ui/button'; // Adicionado Button
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Usando alias
import { Label } from '@/components/ui/label'; // Usando alias
import { Checkbox } from '@/components/ui/checkbox'; // Usando alias para Checkbox
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const TAGS_EXAMPLE = ['Redmi', 'Poco', 'Redmi Note', 'Redmi Pad SE', 'Redmi Pad', 'Mi', 'Band Pro', 'Amazfit', 'Gadgets', 'TV e Acessórios', 'Beleza & Saúde', 'Cozinha', 'Segurança', 'Speaker', 'Robô', 'Bip', 'Com Fio', 'Buds', 'Buds Pro', 'Buds Pro Active', 'Buds Lite', 'Band Active', 'Games' ];
// const PRODUCT_TYPES_EXAMPLE = ['smartphones', 'Earpieces', 'Acessórios', 'casa inteligente', 'wearables']; // Removido


interface PriceRangeOption {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

const priceRanges: PriceRangeOption[] = [
  { value: 'any', label: 'Qualquer Preço' },
  { value: '0-500', label: 'Até R$500', max: 500 },
  { value: '500-1000', label: 'R$500 - R$1000', min: 500, max: 1000 },
  { value: '1000-2000', label: 'R$1000 - R$2000', min: 1000, max: 2000 },
  { value: '2000+', label: 'Acima de R$2000', min: 2000 },
];

interface FiltersSidebarContentProps {
  collections: Collection[];
  currentCategoryHandle?: string;
  currentPriceRange?: string;
  categoryTags?: string[]; // Nova prop para tags específicas da categoria
  // categoryProductTypes?: string[]; // Removido
}

const FiltersSidebarContent: React.FC<FiltersSidebarContentProps> = ({
  collections,
  currentCategoryHandle,
  currentPriceRange,
  categoryTags,
  // categoryProductTypes, // Removido
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // Obter o pathname atual
  const displayPriceRange = currentPriceRange || 'any';
  const [showAllTags, setShowAllTags] = useState(false); // Estado para controlar visualização das tags

  const handleClearFilters = () => {
    // Mantém o sort se existir, ou remove se quiser resetar tudo.
    // Por ora, vamos manter o sort. Se quiser remover, adicione 'sort' à lista de delete.
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete('tag');
    current.delete('priceRange');
    // Adicione outros parâmetros de filtro que você possa ter aqui, ex: current.delete('min_price');

    // Remove a paginação
    current.delete('after');
    current.delete('before');
    
    let newUrl = pathname; // Começa com o pathname atual
    if (current.toString()) { // Adiciona searchParams apenas se houver algum restante (ex: sort)
      newUrl += `?${current.toString()}`;
    }

    router.push(newUrl, { scroll: false });
    router.refresh();
  };

  const handleFilterChange = (filterType: string, value: string, isChecked: boolean) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    // Para filtros de checkbox que podem ter múltiplos valores (como tags)
    if (filterType === 'tag') { // Removido '|| filterType === 'product_type''
      const existingValues = current.getAll(filterType);
      if (isChecked) {
        if (!existingValues.includes(value)) {
          current.append(filterType, value);
        }
      } else {
        current.delete(filterType); // Remove todas as instâncias
        existingValues.filter(v => v !== value).forEach(v => current.append(filterType, v)); // Readiciona as outras
      }
    } else if (filterType === 'priceRange') { // Para RadioGroup (valor único)
      if (value === 'any') {
        current.delete(filterType);
      } else {
        current.set(filterType, value);
      }
    }

    current.delete('after'); // Resetar paginação
    current.delete('before');

    const path = currentCategoryHandle ? `/shop/${currentCategoryHandle}` : '/shop';
    const newUrl = `${path}?${current.toString()}`;
    
    router.push(newUrl, { scroll: false });
    router.refresh(); // Adiciona router.refresh() para re-buscar dados do servidor
  };
  
  const getActiveFilters = (filterType: string): string[] => {
    return searchParams.getAll(filterType);
  };

  return (
    <Accordion type="multiple" defaultValue={['categories', 'price', 'tags', 'product_types']} className="w-full">
      {/* Categorias */}
      <AccordionItem value="categories" className="border-b">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Categorias
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4">
          <ul className="space-y-2">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/shop/${collection.handle}`}
                  className={`block py-1 transition-colors ${
                    collection.handle === currentCategoryHandle
                      ? 'text-[#FF6700] font-medium'
                      : 'text-gray-600 hover:text-[#FF6700]'
                  }`}
                >
                  {collection.title}
                </Link>
              </li>
            ))}
            {/* Adicionar link para "Todas as Categorias" ou "Loja Principal" */}
            <li>
              <Link
                href="/shop"
                className={`block py-1 transition-colors ${
                  !currentCategoryHandle // Ativo se nenhuma categoria específica estiver selecionada
                    ? 'text-[#FF6700] font-medium'
                    : 'text-gray-600 hover:text-[#FF6700]'
                }`}
              >
                Ver Tudo
              </Link>
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Filtro de preço */}
      <AccordionItem value="price" className="border-b-0">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Preço
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4">
          <RadioGroup value={displayPriceRange} onValueChange={(value) => handleFilterChange('priceRange', value, true)}>
            {priceRanges.map((range) => (
              <div key={range.value} className="flex items-center space-x-2 py-1">
                <RadioGroupItem
                  value={range.value}
                  id={`price-${range.value}`}
                  className="rounded-sm border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" // Adicionado rounded-sm e mantido border-primary
                />
                {/*
                  Explicação:
                  - 'rounded-sm': Aplica o mesmo border-radius do Checkbox.
                  - 'border-primary': Aplica a cor primária à borda.
                  - 'data-[state=checked]:bg-primary': Mantém o fundo primário quando checado.
                  - 'data-[state=checked]:text-primary-foreground': Mantém a cor do texto/indicador quando checado.
                */}
                <Label htmlFor={`price-${range.value}`} className="text-gray-600 font-normal cursor-pointer">
                  {range.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Filtro de Tags */}
      <AccordionItem value="tags" className="border-b">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Tags
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4 space-y-2">
          {(() => {
            const currentTagsList = categoryTags && categoryTags.length > 0 ? categoryTags : TAGS_EXAMPLE;
            const displayedTags = showAllTags ? currentTagsList : currentTagsList.slice(0, 7);

            return (
              <>
                {displayedTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={getActiveFilters('tag').includes(tag)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => handleFilterChange('tag', tag, !!checked)}
                    />
                    <Label htmlFor={`tag-${tag}`} className="text-gray-600 font-normal cursor-pointer">
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Label>
                  </div>
                ))}
                {currentTagsList.length > 7 && (
                  <Button
                    variant="link"
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="text-sm text-[#FF6700] hover:text-[#E05A00] p-0 h-auto mt-2"
                  >
                    {showAllTags ? 'Ver menos' : `Ver mais (${currentTagsList.length - 7} restantes)`}
                  </Button>
                )}
              </>
            );
          })()}
        </AccordionContent>
      </AccordionItem>
      
      {/* Botão Limpar Filtros */}
      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          className="w-full text-sm text-gray-600 hover:text-[#FF6700] hover:bg-[#FF6700]/10" // Cor de hover alterada
        >
          Limpar todos os filtros
        </Button>
      </div>

      {/* Filtro de Tipos de Produto REMOVIDO */}
      {/*
      <AccordionItem value="product_types" className="border-b-0">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Tipos de Produto
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4 space-y-2">
          {(categoryProductTypes && categoryProductTypes.length > 0 ? categoryProductTypes : PRODUCT_TYPES_EXAMPLE).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={getActiveFilters('product_type').includes(type)}
                onCheckedChange={(checked: boolean | 'indeterminate') => handleFilterChange('product_type', type, !!checked)}
              />
              <Label htmlFor={`type-${type}`} className="text-gray-600 font-normal cursor-pointer">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Label>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
      */}
    </Accordion>
  );
};

export default FiltersSidebarContent;
