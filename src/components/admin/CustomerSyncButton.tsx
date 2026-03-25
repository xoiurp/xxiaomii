'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  totalSynced: number;
  error: string | null;
}

export default function CustomerSyncButton() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    totalSynced: 0,
    error: null
  });

  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, isRunning: true, error: null }));
    
    try {
      const response = await fetch('/api/admin/customers/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          isRunning: false,
          lastSync: new Date().toISOString(),
          totalSynced: data.summary.total,
          error: null
        });
        
        // Recarregar a página para atualizar os dados do dashboard
        window.location.reload();
      } else {
        throw new Error(data.details || 'Erro na sincronização');
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/customers/sync');
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: data.lastSync,
          totalSynced: data.stats.totalCustomers
        }));
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Verificar status ao carregar o componente
  useState(() => {
    checkSyncStatus();
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={syncStatus.isRunning}
        className="flex items-center gap-2"
        variant="outline"
      >
        {syncStatus.isRunning ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Sincronizar Clientes
          </>
        )}
      </Button>

      {/* Status da sincronização */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {syncStatus.error && (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Erro: {syncStatus.error}</span>
          </div>
        )}
        
        {syncStatus.lastSync && !syncStatus.error && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>
              {syncStatus.totalSynced} clientes sincronizados
            </span>
          </div>
        )}
        
        {!syncStatus.lastSync && !syncStatus.error && !syncStatus.isRunning && (
          <div className="flex items-center gap-1 text-orange-600">
            <Clock className="h-4 w-4" />
            <span>Nunca sincronizado</span>
          </div>
        )}
      </div>
    </div>
  );
} 