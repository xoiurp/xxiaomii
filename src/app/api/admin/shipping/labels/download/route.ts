import { NextRequest, NextResponse } from 'next/server';
import { getLabel } from '@/lib/melhorenvio';

// GET - Baixar etiqueta específica
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const format = searchParams.get('format') || 'pdf';

    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    const labelData = await getLabel(orderId);

    if (!labelData) {
      return NextResponse.json({ error: 'Etiqueta não encontrada' }, { status: 404 });
    }

    // Assumindo que labelData contém o PDF em base64 ou URL
    // Você pode ajustar isso baseado na resposta real da API do Melhor Envio
    return NextResponse.json({ 
      success: true, 
      data: labelData,
      format: format
    });

  } catch (error) {
    console.error('Erro ao baixar etiqueta:', error);
    return NextResponse.json({ 
      error: 'Erro ao baixar etiqueta', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// POST - Baixar múltiplas etiquetas
export async function POST(request: NextRequest) {
  try {
    const { orderIds, format = 'pdf' } = await request.json();

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({ error: 'orderIds é obrigatório e deve ser um array' }, { status: 400 });
    }

    const labels = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const labelData = await getLabel(orderId);
        labels.push({
          orderId,
          success: true,
          data: labelData
        });
      } catch (error) {
        console.error(`Erro ao baixar etiqueta ${orderId}:`, error);
        errors.push({
          orderId,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      labels,
      errors,
      format,
      total: orderIds.length,
      successful: labels.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Erro ao baixar etiquetas:', error);
    return NextResponse.json({ 
      error: 'Erro ao baixar etiquetas', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
} 