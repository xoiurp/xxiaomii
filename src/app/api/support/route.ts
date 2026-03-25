import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Cliente envia ticket
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, subject, category, message, orderNumber } = body;

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: 'Preencha todos os campos obrigatórios.' },
      { status: 400 }
    );
  }

  // Tentar vincular ao usuário logado
  const session = await auth();
  const userId = session?.user?.id || null;

  // Definir prioridade automática por categoria
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  if (category === 'RETURN' || category === 'PAYMENT') priority = 'HIGH';

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      name,
      email,
      phone: phone || null,
      subject,
      category: category || 'OTHER',
      message,
      orderNumber: orderNumber || null,
      priority,
    },
  });

  return NextResponse.json({
    success: true,
    ticketId: ticket.id,
    message: 'Ticket criado com sucesso! Entraremos em contato em breve.',
  });
}

// GET - Cliente autenticado lista seus próprios tickets
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subject: true,
      category: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
    },
  });

  return NextResponse.json({ tickets });
}
