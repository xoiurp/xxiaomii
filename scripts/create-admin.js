const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  try {
    // Se passou argumentos: node create-admin.js <email> <senha> [nome]
    let email = process.argv[2];
    let password = process.argv[3];
    let name = process.argv[4] || 'Administrador';

    // Se não passou argumentos, pedir interativamente
    if (!email) {
      console.log('\n🔧 Criação de Usuário Administrador\n');
      name = (await prompt('Nome (padrão: Administrador): ')) || 'Administrador';
      email = await prompt('E-mail: ');
      password = await prompt('Senha: ');
    }

    if (!email || !password) {
      console.error('❌ E-mail e senha são obrigatórios.');
      console.log('\nUso: node scripts/create-admin.js <email> <senha> [nome]');
      console.log('Ou execute sem argumentos para modo interativo.');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ A senha deve ter pelo menos 6 caracteres.');
      process.exit(1);
    }

    // Verificar se o email já existe
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role === 'ADMIN') {
        console.log(`⚠️  Já existe um admin com o e-mail ${email}.`);

        // Atualizar a senha
        const updatePassword = process.argv[5] === '--force' || (!process.argv[2] && (await prompt('Deseja atualizar a senha? (s/n): ')).toLowerCase() === 's');

        if (updatePassword) {
          const passwordHash = await bcrypt.hash(password, 12);
          await prisma.user.update({
            where: { email },
            data: { passwordHash, name },
          });
          console.log('✅ Senha atualizada com sucesso!');
        }
        return;
      } else {
        // Usuário existe como CLIENT, promover a ADMIN
        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN', passwordHash, name },
        });
        console.log(`✅ Usuário ${email} promovido a ADMIN com nova senha.`);
        return;
      }
    }

    // Criar novo admin
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('\n✅ Administrador criado com sucesso!');
    console.log(`   Nome:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Acesse: http://localhost:3000/admin/signin\n`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
