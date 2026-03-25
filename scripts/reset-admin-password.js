const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Buscar o usuário admin existente
    const admin = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'admin@mibrasil.com' },
          { email: 'admin@shopmi.com' }
        ]
      }
    });

    if (!admin) {
      console.log('❌ Nenhum usuário administrador encontrado');
      return;
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Atualizar a senha
    const updatedAdmin = await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    console.log('✅ Senha do administrador resetada com sucesso!');
    console.log('Email:', updatedAdmin.email);
    console.log('Nova senha: admin123');
    console.log('Acesse: http://localhost:3000/admin/signin');

  } catch (error) {
    console.error('❌ Erro ao resetar senha do administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
