import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mrt.org' },
    update: {},
    create: {
      email: 'admin@mrt.org',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
    },
  })

  console.log({ adminUser })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
