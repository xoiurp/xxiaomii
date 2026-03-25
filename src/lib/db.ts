import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { success: false, message: `Database connection failed: ${error}` }
  }
}
