// Plain-JS seed used inside the production container.
// It is self-contained: the Next.js standalone build bundles app deps into the
// server output (not node_modules), so this script avoids requiring bcrypt and
// uses a precomputed bcrypt hash of the default password instead. Only
// @prisma/client (a real runtime dependency, present in the image) is required.
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// bcrypt hash of "admin123" (cost 10). Compatible with bcryptjs.compare at login.
const DEFAULT_ADMIN_PASSWORD_HASH =
  "$2b$10$3iVJAlgzNEHqHOmP2A4fz.nA.t3frv2Py/okhdHUrtJFIlu4DkLtG"

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@mrt.org" },
    update: {},
    create: {
      email: "admin@mrt.org",
      password: DEFAULT_ADMIN_PASSWORD_HASH,
      name: "System Administrator",
      role: "SUPER_ADMIN",
    },
  })

  console.log("Seeded admin user:", adminUser.email)
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
