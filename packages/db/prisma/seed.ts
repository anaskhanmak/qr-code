import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.DEMO_USER_EMAIL;
  if (!email) {
    console.log("Set DEMO_USER_EMAIL to create a demo account.");
    return;
  }

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Loopmark Demo" },
  });
  console.log(`Seeded demo user ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
