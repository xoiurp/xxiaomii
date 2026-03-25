'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomerSyncButton from '@/components/admin/CustomerSyncButton';

// Interfaces para tipagem
interface DashboardMetrics {
  salesToday: {
    amount: number;
    currency: string;
    percentageChange: number;
  };
  ordersToday: {
    count: number;
    percentageChange: number;
  };
  totalProducts: number;
  totalCustomers: number;
  newCustomersToday: number;
  lowStockCount: number;
}

interface ChartData {
  name: string;
  vendas: number;
  pedidos: number;
}

interface TopProduct {
  name: string;
  value: number;
  color: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  value: string;
  status: string;
  createdAt: string;
}

interface Alert {
  type: 'warning' | 'info' | 'error';
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para dados reais
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Estados para filtro de data
  const [startDate, setStartDate] = useState<string>(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Função para buscar dados reais das APIs
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Criar query string com parâmetros de data
      const queryParams = new URLSearchParams({
        startDate,
        endDate
      });

      // Buscar dados de vendas com filtro de data
      let salesData = null;
      try {
        const salesResponse = await fetch(`/api/admin/analytics/sales?${queryParams}`);
        if (salesResponse.ok) {
          salesData = await salesResponse.json();
        }
      } catch (err) {
        console.warn('Erro ao buscar dados de vendas:', err);
      }

      // Buscar dados de produtos com filtro de data
      const [productsResponse, customersResponse] = await Promise.all([
        fetch(`/api/admin/analytics/products?${queryParams}`),
        fetch(`/api/admin/analytics/customers?${queryParams}`)
      ]);

      const productsData = productsResponse.ok ? await productsResponse.json() : null;
      const customersData = customersResponse.ok ? await customersResponse.json() : null;

      // Buscar pedidos recentes com filtro de data
      let ordersData = null;
      try {
        const ordersResponse = await fetch(`/api/admin/analytics/orders?${queryParams}`);
        if (ordersResponse.ok) {
          ordersData = await ordersResponse.json();
        }
      } catch (err) {
        console.warn('Erro ao buscar pedidos:', err);
      }

      // Consolidar métricas
      const consolidatedMetrics: DashboardMetrics = {
        salesToday: salesData?.metrics?.salesToday || {
          amount: ordersData?.summary?.totalSales || 0,
          currency: 'BRL',
          percentageChange: 0
        },
        ordersToday: salesData?.metrics?.ordersToday || {
          count: ordersData?.summary?.totalOrders || 0,
          percentageChange: 0
        },
        totalProducts: productsData?.metrics?.totalProducts || 0,
        totalCustomers: customersData?.metrics?.totalCustomers || 0,
        newCustomersToday: customersData?.metrics?.newToday || 0,
        lowStockCount: productsData?.metrics?.lowStockCount || 0
      };

      setMetrics(consolidatedMetrics);

      // Dados do gráfico
      if (salesData?.chartData) {
        setChartData(salesData.chartData);
      } else {
        // Dados de fallback se não conseguir buscar vendas
        setChartData([
          { name: 'Seg', vendas: 0, pedidos: 0 },
          { name: 'Ter', vendas: 0, pedidos: 0 },
          { name: 'Qua', vendas: 0, pedidos: 0 },
          { name: 'Qui', vendas: 0, pedidos: 0 },
          { name: 'Sex', vendas: 0, pedidos: 0 },
          { name: 'Sáb', vendas: 0, pedidos: 0 },
          { name: 'Dom', vendas: 0, pedidos: 0 },
        ]);
      }

      // Top produtos
      if (salesData?.topProducts) {
        setTopProducts(salesData.topProducts);
      } else {
        setTopProducts([
          { name: 'Produtos Xiaomi', value: 100, color: '#FF6700' }
        ]);
      }

      // Pedidos recentes
      if (salesData?.recentOrders) {
        setRecentOrders(salesData.recentOrders);
      } else if (ordersData?.recentOrders) {
        setRecentOrders(ordersData.recentOrders);
      }

      // Gerar alertas baseados nos dados
      const newAlerts: Alert[] = [];
      
      if (productsData?.metrics?.lowStockCount > 0) {
        newAlerts.push({
          type: 'warning',
          message: `${productsData.metrics.lowStockCount} produtos com estoque baixo`,
          time: '2 min atrás'
        });
      }

      if (customersData?.metrics?.newToday > 0) {
        newAlerts.push({
          type: 'info',
          message: `${customersData.metrics.newToday} novos clientes hoje`,
          time: '1 hora atrás'
        });
      }

      if (productsData?.metrics?.outOfStockCount > 0) {
        newAlerts.push({
          type: 'error',
          message: `${productsData.metrics.outOfStockCount} produtos sem estoque`,
          time: '30 min atrás'
        });
      }

      setAlerts(newAlerts);

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [session, startDate, endDate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6700] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/admin/signin');
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pendente': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'Processando': { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'Enviado': { variant: 'default', color: 'bg-purple-100 text-purple-800' },
      'Entregue': { variant: 'default', color: 'bg-green-100 text-green-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente'];
    return <Badge className={config.color}>{status}</Badge>;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <img src="/mibrasil2svg.svg" alt="Mi Brasil" className="h-8 w-8" />
            {sidebarOpen && <span className="ml-3 text-xl font-bold text-gray-800">Admin</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          <div className={`flex items-center p-3 rounded-lg bg-[#FF6700] text-white ${!sidebarOpen && 'justify-center'}`}>
            <BarChart3 className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Dashboard</span>}
          </div>
          
          <div 
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/orders')}
          >
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Pedidos</span>}
          </div>

          <div 
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/products')}
          >
            <Package className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Produtos</span>}
          </div>

          <div 
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/customers')}
          >
            <Users className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Clientes</span>}
          </div>

          <div 
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/finance')}
          >
            <DollarSign className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Financeiro</span>}
          </div>

          <div
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/support')}
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Suporte</span>}
          </div>

          <div
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${!sidebarOpen && 'justify-center'}`}
            onClick={() => router.push('/admin/settings')}
          >
            <Settings className="h-5 w-5 text-gray-600" />
            {sidebarOpen && <span className="ml-3 text-gray-600">Configurações</span>}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-[#FF6700] rounded-full flex items-center justify-center text-white font-bold">
              {session.user.name?.[0] || 'A'}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-800">{session.user.name}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy - HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Filtro de Data */}
              <div className="flex items-center space-x-2">
                <div>
                  <label className="text-xs text-gray-600">Data Inicial:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Data Final:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                  className="bg-[#FF6700] text-white hover:bg-[#E05A00]"
                >
                  Filtrar
                </Button>
              </div>

              <CustomerSyncButton />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="mr-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                className="ml-4"
              >
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {metrics?.salesToday.amount.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(metrics?.salesToday?.percentageChange || 0) >= 0 ? (
                    <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(metrics?.salesToday?.percentageChange || 0).toFixed(1)}% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.ordersToday.count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(metrics?.ordersToday?.percentageChange || 0) >= 0 ? (
                    <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(metrics?.ordersToday?.percentageChange || 0).toFixed(1)}% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(metrics?.lowStockCount || 0) > 0 ? (
                    <>
                      <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                      {metrics?.lowStockCount || 0} com estoque baixo
                    </>
                  ) : (
                    <span className="text-green-500">Estoque OK</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                  +{metrics?.newCustomersToday || 0} novos hoje
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas da Semana</CardTitle>
                <CardDescription>Vendas e pedidos dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'vendas' ? `R$ ${value}` : value,
                        name === 'vendas' ? 'Vendas' : 'Pedidos'
                      ]}
                    />
                    <Bar dataKey="vendas" fill="#FF6700" />
                    <Bar dataKey="pedidos" fill="#FFA366" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Distribuição de vendas por produto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: product.color }}
                        />
                        <span className="text-sm">{product.name}</span>
                      </div>
                      <span className="text-sm font-medium">{product.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Últimos pedidos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length > 0 ? (
                    recentOrders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-gray-500">{order.customer}</p>
                          <p className="text-sm text-gray-600">{order.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.value}</p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum pedido encontrado
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos os Pedidos
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas e Notificações</CardTitle>
                <CardDescription>Últimas atualizações do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum alerta no momento
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Bell className="h-4 w-4 mr-2" />
                  Ver Todas as Notificações
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
