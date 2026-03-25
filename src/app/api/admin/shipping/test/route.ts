import { NextResponse } from 'next/server';
import { getCompanyInfo, getBalance } from '@/lib/melhorenvio';

export async function GET() {
  try {
    console.log('Testando autenticação com Melhor Envio...');
    
    // Testar informações da empresa
    const companyInfo = await getCompanyInfo();
    console.log('Informações da empresa:', companyInfo);
    
    // Testar saldo
    const balance = await getBalance();
    console.log('Saldo:', balance);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        company: companyInfo,
        balance: balance
      }
    });
  } catch (error) {
    console.error('Erro no teste de autenticação:', error);
    return NextResponse.json({ 
      error: 'Erro na autenticação', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
} 