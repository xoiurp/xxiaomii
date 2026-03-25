const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário admin padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mibrasil.com';
    const adminPassword = process.env.ADMIN_PASSWORD || generateRandomPassword();

    // Verificar se o admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });

      console.log('✅ Usuário admin criado:', admin.email);
      console.log('🔑 Senha admin:', adminPassword);
    } else {
      console.log('ℹ️ Usuário admin já existe:', existingAdmin.email);
    }

    // Criar usuário cliente de teste
    const clientEmail = process.env.CLIENT_EMAIL || 'cliente@teste.com';
    const clientPassword = process.env.CLIENT_PASSWORD || generateRandomPassword();

    const existingClient = await prisma.user.findUnique({
      where: { email: clientEmail }
    });

    if (!existingClient) {
      const hashedPassword = await bcrypt.hash(clientPassword, 12);
      
      const client = await prisma.user.create({
        data: {
          email: clientEmail,
          name: 'Cliente Teste',
          passwordHash: hashedPassword,
          role: 'CLIENT',
          emailVerified: new Date(),
        },
      });

      // Criar perfil do cliente
      await prisma.customerProfile.create({
        data: {
          userId: client.id,
          phone: '(11) 99999-9999',
          cpf: '123.456.789-00',
        },
      });

      console.log('✅ Usuário cliente criado:', client.email);
      console.log('🔑 Senha cliente:', clientPassword);
    } else {
      console.log('ℹ️ Usuário cliente já existe:', existingClient.email);
    }

    console.log('✅ Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Função para gerar senha aleatória
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 