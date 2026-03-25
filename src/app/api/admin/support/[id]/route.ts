import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Admin visualiza um ticket específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

// PUT - Admin atualiza status/notas do ticket
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const { status, priority, adminNotes } = body;

  const data: any = {};
  if (status) data.status = status;
  if (priority) data.priority = priority;
  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  // Marcar data de resolução quando resolvido/fechado
  if (status === 'RESOLVED' || status === 'CLOSED') {
    data.resolvedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ success: true, ticket });
}
