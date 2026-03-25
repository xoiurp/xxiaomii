'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload, X, Plus } from 'lucide-react';

interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ProductImage {
  id?: string;
  src: string;
  altText?: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string;
  images: ProductImage[];
  variants: ProductVariant[];
  options: Array<{
    name: string;
    values: string[];
  }>;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do produto
  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erro ao carregar produto');
        }
        
        // Processar dados do produto para o formato esperado
        const productData = data.product;
        const processedProduct: Product = {
          id: productData.id.replace('gid://shopify/Product/', ''),
          title: productData.title || '',
          description: productData.descriptionHtml || '',
          handle: productData.handle || '',
          status: productData.status?.toLowerCase() || 'draft',
          vendor: productData.vendor || '',
          productType: productData.productType || '',
          tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : (productData.tags || ''),
          images: productData.images?.map((img: any) => ({
            id: img.id,
            src: img.url,
            altText: img.altText || productData.title
          })) || [],
          variants: productData.variants?.map((variant: any) => ({
            id: variant.id.replace('gid://shopify/ProductVariant/', ''),
            title: variant.title || '',
            price: variant.price || '0.00',
            compareAtPrice: variant.compareAtPrice || '',
            inventoryQuantity: variant.inventoryQuantity || 0,
            option1: variant.selectedOptions?.[0]?.value || '',
            option2: variant.selectedOptions?.[1]?.value || '',
            option3: variant.selectedOptions?.[2]?.value || '',
          })) || [],
          options: [] // Implementar se necessário
        };
        
        setProduct(processedProduct);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Função para salvar produto
  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    setError(null);
    try {
      // Preparar dados no formato esperado pela API
      const productData = {
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        descriptionHtml: product.description,
        status: product.status.toUpperCase(),
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar produto');
      }

      // Mostrar sucesso
      alert('Produto salvo com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  // Função para atualizar campos do produto
  const updateProduct = (field: keyof Product, value: any) => {
    if (!product) return;
    setProduct({ ...product, [field]: value });
  };

  // Função para atualizar variante
  const updateVariant = (variantIndex: number, field: keyof ProductVariant, value: any) => {
    if (!product) return;
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], [field]: value };
    setProduct({ ...product, variants: updatedVariants });
  };

  // Função para adicionar nova imagem
  const addImage = (imageUrl: string) => {
    if (!product) return;
    const newImage: ProductImage = {
      src: imageUrl,
      altText: product.title
    };
    setProduct({ ...product, images: [...product.images, newImage] });
  };

  // Função para remover imagem
  const removeImage = (imageIndex: number) => {
    if (!product) return;
    const updatedImages = product.images.filter((_, index) => index !== imageIndex);
    setProduct({ ...product, images: updatedImages });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF6700]" />
          <span className="text-gray-600">Carregando produto...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-4">
            {error || 'Produto não encontrado'}
          </div>
          <button
            onClick={() => router.back()}
            className="text-[#FF6700] hover:text-[#E05A00] font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Editar Produto
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ID: {productId}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF6700] hover:bg-[#E05A00] text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Básicas
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Produto
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => updateProduct('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) => updateProduct('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Handle/URL
                    </label>
                    <input
                      type="text"
                      value={product.handle}
                      onChange={(e) => updateProduct('handle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Produto
                    </label>
                    <input
                      type="text"
                      value={product.productType}
                      onChange={(e) => updateProduct('productType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fornecedor
                    </label>
                    <input
                      type="text"
                      value={product.vendor}
                      onChange={(e) => updateProduct('vendor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={product.tags}
                      onChange={(e) => updateProduct('tags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Imagens do Produto
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.src}
                      alt={image.altText}
                      className="w-full aspect-square object-cover border border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#FF6700] transition-colors cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Adicionar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Variants */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Variantes do Produto
              </h2>
              <div className="space-y-4">
                {product.variants.map((variant, index) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título da Variante
                        </label>
                        <input
                          type="text"
                          value={variant.title}
                          onChange={(e) => updateVariant(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço
                        </label>
                        <input
                          type="text"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estoque
                        </label>
                        <input
                          type="number"
                          value={variant.inventoryQuantity}
                          onChange={(e) => updateVariant(index, 'inventoryQuantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    {variant.compareAtPrice && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço Comparativo
                        </label>
                        <input
                          type="text"
                          value={variant.compareAtPrice}
                          onChange={(e) => updateVariant(index, 'compareAtPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Product Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status do Produto
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={product.status}
                  onChange={(e) => updateProduct('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                >
                  <option value="active">Ativo</option>
                  <option value="draft">Rascunho</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Ver no site
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Duplicar produto
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Excluir produto
                </button>
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Variantes:</span>
                  <span className="font-medium">{product.variants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Imagens:</span>
                  <span className="font-medium">{product.images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium capitalize ${
                    product.status === 'active' ? 'text-green-600' : 
                    product.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
