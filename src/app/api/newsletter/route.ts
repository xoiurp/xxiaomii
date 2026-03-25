import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email é obrigatório' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Email inválido' }, { status: 400 });
    }

    // Sanitizar email (lowercase e trim)
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if the email already exists
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existingSubscription) {
      return NextResponse.json({ message: 'Email already subscribed' }, { status: 409 });
    }

    // Create the new subscription
    const newSubscription = await prisma.newsletterSubscription.create({
      data: {
        email,
      },
    });

    return NextResponse.json(newSubscription, { status: 201 });

  } catch (error) {
    console.error('[NEWSLETTER_POST]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
