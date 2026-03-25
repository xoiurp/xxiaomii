import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Admin lista todos os tickets
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (category && category !== 'all') where.category = category;

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Contagens por status
  const counts = await prisma.supportTicket.groupBy({
    by: ['status'],
    _count: true,
  });

  const statusCounts: Record<string, number> = {};
  let total = 0;
  for (const c of counts) {
    statusCounts[c.status] = c._count;
    total += c._count;
  }

  return NextResponse.json({ tickets, statusCounts, total });
}
