import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

/**
 * Endpoint de Registro de Usuários
 *
 * FLUXO DE AUTENTICAÇÃO INDEPENDENTE:
 * 1. Cliente se registra localmente (apenas Prisma)
 * 2. shopifyCustomerId inicialmente NULL
 * 3. Quando o cliente fizer o primeiro pedido, a Shopify criará o customer automaticamente
 * 4. O webhook orders/create capturará o shopifyCustomerId e vinculará ao usuário
 *
 * MOTIVO: Plano Shopify atual não permite criar customers via Admin API (restrição de PII)
 */
export async function POST(request: Request) {
  try {
    const { name, email, password, phone, role = 'CLIENT' } = await request.json();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário no banco local (Prisma)
    // shopifyCustomerId será NULL até o primeiro pedido
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        shopifyCustomerId: null, // Será preenchido pelo webhook orders/create
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shopifyCustomerId: true,
        createdAt: true,
      },
    });

    // Se for um cliente, criar perfil de cliente
    if (role === 'CLIENT') {
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          phone: phone || null,
        },
      });
    }

    console.log('✅ Usuário criado com sucesso (registro local):', {
      id: user.id,
      email: user.email,
      role: user.role,
      shopifyCustomerId: user.shopifyCustomerId
    });

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopifyCustomerId: user.shopifyCustomerId,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 