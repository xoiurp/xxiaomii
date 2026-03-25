const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Já existe um usuário administrador:', existingAdmin.email);
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@shopmi.com',
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('Email:', admin.email);
    console.log('Senha: admin123');
    console.log('Acesse: http://localhost:3000/admin/signin');

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 