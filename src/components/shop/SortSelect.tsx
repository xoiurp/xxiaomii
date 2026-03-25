'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface SortOption {
  value: string;
  label: string;
  shortLabel?: string; // Label curto para mobile
}

const sortOptions: SortOption[] = [
  { value: 'featured', label: 'Em destaque', shortLabel: 'Destaque' },
  { value: 'price-asc', label: 'Preço: Menor para maior', shortLabel: 'Menor preço' },
  { value: 'price-desc', label: 'Preço: Maior para menor', shortLabel: 'Maior preço' },
  { value: 'name-asc', label: 'Nome: A-Z', shortLabel: 'A-Z' },
  { value: 'name-desc', label: 'Nome: Z-A', shortLabel: 'Z-A' },
  { value: 'created-desc', label: 'Mais recentes', shortLabel: 'Recentes' },
  { value: 'created-asc', label: 'Mais antigos', shortLabel: 'Antigos' },
];

interface SortSelectProps {
  initialSortValue?: string;
}

const SortSelect: React.FC<SortSelectProps> = ({ initialSortValue }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSort, setSelectedSort] = useState(initialSortValue || 'featured');

  useEffect(() => {
    if (initialSortValue && initialSortValue !== selectedSort) {
      setSelectedSort(initialSortValue);
    }
  }, [initialSortValue, selectedSort]);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value === 'featured') {
      current.delete('sort');
      current.delete('sKey');
      current.delete('sRev');
    } else {
      current.set('sort', value);
    }

    current.delete('after');
    current.delete('before');

    const queryString = current.toString();
    router.push(`?${queryString}`, { scroll: false });
  };

  // Encontra o label atual para exibição
  const currentOption = sortOptions.find(opt => opt.value === selectedSort);

  return (
    <div className="flex items-center w-full sm:w-auto">
      {/* Label oculto em mobile muito pequeno */}
      <label 
        htmlFor="sort-select" 
        className="hidden sm:block mr-2 text-gray-600 whitespace-nowrap text-sm"
      >
        Ordenar por:
      </label>
      <Select value={selectedSort} onValueChange={handleSortChange}>
        <SelectTrigger 
          id="sort-select" 
          className="w-full sm:w-[180px] md:w-[200px] min-h-[44px] text-sm"
        >
          <SelectValue placeholder="Ordenar">
            {/* Mostra label curto em mobile, completo em desktop */}
            <span className="sm:hidden">{currentOption?.shortLabel || currentOption?.label}</span>
            <span className="hidden sm:inline">{currentOption?.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-xs text-gray-500 px-2 py-1.5">Ordenar por:</SelectLabel>
            {sortOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="min-h-[44px] flex items-center text-sm"
              >
                {/* Label completo no dropdown */}
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortSelect;
