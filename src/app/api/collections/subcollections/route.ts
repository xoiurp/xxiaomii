import { NextResponse } from 'next/server';
import { adminOperations } from '@/lib/shopify-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'O parâmetro "parentId" é obrigatório.' }, { status: 400 });
    }

    const subcollections = await adminOperations.getProcessedSubcollections(parentId);
    
    // A função getProcessedSubcollections retorna um array de subcoleções (ou array vazio)
    // e lida com erros internos de GraphQL ou parsing.
    return NextResponse.json({ subcollections });

  } catch (error) {
    console.error(`Erro ao buscar subcoleções para o pai ${new URL(request.url).searchParams.get('parentId')}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (errorMessage.includes("Erro GraphQL:")) {
        return NextResponse.json({ error: 'Falha ao buscar dados de subcoleções do Shopify.', details: errorMessage }, { status: 502 });
    }
    return NextResponse.json({ error: 'Falha ao buscar subcoleções.', details: errorMessage }, { status: 500 });
  }
}
