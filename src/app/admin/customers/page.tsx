'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Search,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  Star,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomerSyncButton from '@/components/admin/CustomerSyncButton';

interface Customer {
  id: string;
  shopifyId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  acceptsMarketing: boolean;
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  state: string;
  tags: string | null;
  defaultAddress: any;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

interface CustomerStats {
  totalCustomers: number;
  vipCustomers: number;
  marketingOptIn: number;
  totalRevenue: number;
  avgLifetimeValue: number;
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar dados de analytics (que já temos)
      const analyticsResponse = await fetch('/api/admin/analytics/customers');
      const analyticsData = await analyticsResponse.json();

      if (analyticsData.success) {
        // Buscar dados detalhados dos clientes diretamente do banco
        const customersResponse = await fetch('/api/admin/customers/list');
        
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.customers || []);
          setFilteredCustomers(customersData.customers || []);
        } else {
          // Fallback: usar dados dos analytics
          setCustomers(analyticsData.recentCustomers || []);
          setFilteredCustomers(analyticsData.recentCustomers || []);
        }

        // Definir estatísticas
        setStats({
          totalCustomers: analyticsData.metrics.totalCustomers,
          vipCustomers: analyticsData.metrics.vipCustomers,
          marketingOptIn: analyticsData.metrics.marketingOptIn,
          totalRevenue: analyticsData.insights.totalRevenue,
          avgLifetimeValue: analyticsData.insights.avgLifetimeValue
        });
      } else {
        throw new Error(analyticsData.details || 'Erro ao buscar dados');
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError('Erro ao carregar dados dos clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchCustomers();
    }
  }, [session]);

  // Filtrar clientes
  useEffect(() => {
    let filtered = customers;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        (customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone?.includes(searchTerm))
      );
    }

    // Filtro por tipo de cliente
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        switch (filterStatus) {
          case 'vip': return customer.ordersCount > 2 || customer.totalSpent > 500;
          case 'marketing': return customer.acceptsMarketing;
          case 'recent': return new Date(customer.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
          default: return true;
        }
      });
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, customers]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6700] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/admin/signin');
    return null;
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.firstName || customer.lastName || 'Cliente sem nome';
  };



  const getCustomerType = (customer: Customer) => {
    if (customer.ordersCount > 2 || customer.totalSpent > 500) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Star className="h-3 w-3 mr-1" />VIP</Badge>;
    }
    return null;
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
              <p className="text-sm text-gray-500">
                Visualize e gerencie todos os clientes sincronizados do Shopify
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <CustomerSyncButton />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchCustomers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCustomers}
              className="ml-4"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Clientes sincronizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opt-in Marketing</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.marketingOptIn || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalCustomers ? Math.round((stats.marketingOptIn / stats.totalCustomers) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.vipCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Mais de 2 pedidos ou R$ 500+
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats?.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                LTV médio: R$ {stats?.avgLifetimeValue || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="vip">VIP</option>
                  <option value="marketing">Aceita Marketing</option>
                  <option value="recent">Cadastros Recentes</option>
                </select>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Clientes ({filteredCustomers.length})
            </CardTitle>
            <CardDescription>
              Dados sincronizados diretamente do Shopify
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6700]"></div>
                <span className="ml-2">Carregando clientes...</span>
              </div>
            ) : currentCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {customers.length === 0 
                    ? 'Nenhum cliente sincronizado. Clique em "Sincronizar Clientes" para importar dados do Shopify.'
                    : 'Nenhum cliente encontrado com os filtros aplicados.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Cliente</th>
                        <th className="text-left p-4 font-medium">Contato</th>
                        <th className="text-left p-4 font-medium">Pedidos</th>
                        <th className="text-left p-4 font-medium">Total Gasto</th>
                        <th className="text-left p-4 font-medium">Cadastro</th>
                        <th className="text-left p-4 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#FF6700] rounded-full flex items-center justify-center text-white font-bold mr-3">
                                {getCustomerName(customer)[0]}
                              </div>
                              <div>
                                <div className="font-medium">{getCustomerName(customer)}</div>
                                <div className="text-sm text-gray-500">ID: {customer.shopifyId}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getCustomerType(customer)}
                                  {customer.acceptsMarketing && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <Mail className="h-3 w-3 mr-1" />Marketing
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {customer.email && (
                                <div className="flex items-center mb-1">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.defaultAddress && (
                                <div className="flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {customer.defaultAddress.city}, {customer.defaultAddress.province}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-medium">{customer.ordersCount}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Ticket médio: R$ {customer.averageOrderValue.toFixed(2)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">R$ {customer.totalSpent.toFixed(2)}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div className="text-xs text-gray-400">
                              Sync: {format(new Date(customer.lastSyncAt), 'dd/MM HH:mm', { locale: ptBR })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCustomers.length)} de {filteredCustomers.length} clientes
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 