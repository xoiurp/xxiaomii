import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      customerProfile: true,
      addresses: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.customerProfile?.phone ?? '',
    cpf: user.customerProfile?.cpf ?? '',
    birthDate: user.customerProfile?.birthDate?.toISOString().split('T')[0] ?? '',
    addresses: user.addresses.map((a) => ({
      id: a.id,
      type: a.type,
      isDefault: a.isDefault,
      street: a.street,
      number: a.number ?? '',
      complement: a.complement ?? '',
      neighborhood: a.neighborhood ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, cpf, birthDate, address } = body;

  // Atualizar nome do usuário
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  // Upsert do CustomerProfile
  await prisma.customerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      phone: phone || null,
      cpf: cpf || null,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
    update: {
      phone: phone || null,
      cpf: cpf || null,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  });

  // Upsert do endereço padrão (se enviado)
  if (address && address.street && address.city && address.state && address.postalCode) {
    const existingDefault = await prisma.address.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });

    if (existingDefault) {
      await prisma.address.update({
        where: { id: existingDefault.id },
        data: {
          street: address.street,
          number: address.number || null,
          complement: address.complement || null,
          neighborhood: address.neighborhood || null,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
        },
      });
    } else {
      await prisma.address.create({
        data: {
          userId: session.user.id,
          type: 'SHIPPING',
          isDefault: true,
          street: address.street,
          number: address.number || null,
          complement: address.complement || null,
          neighborhood: address.neighborhood || null,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
