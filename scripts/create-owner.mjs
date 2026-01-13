import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function printUsage() {
  console.log('Usage: OWNER_EMAIL=you@example.com OWNER_PASSWORD=secret OWNER_NAME="Owner Name" node scripts/create-owner.mjs');
  console.log('   or: node scripts/create-owner.mjs you@example.com secret "Owner Name"');
}

async function main() {
  const email = process.env.OWNER_EMAIL || process.argv[2];
  const password = process.env.OWNER_PASSWORD || process.argv[3];
  const name = process.env.OWNER_NAME || process.argv[4];

  if (!email || !password || !name) {
    printUsage();
    process.exit(1);
  }

  const existingAdmin = await prisma.systemAdmin.findFirst();
  if (existingAdmin) {
    console.log('A system owner already exists. Aborting to avoid duplicates.');
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingEmail = await prisma.systemAdmin.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmail) {
    console.log('This email is already registered as a system admin.');
    return;
  }

  const passwordHash = await hash(password, 12);

  const admin = await prisma.systemAdmin.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('System owner created:', admin.id);
}

main()
  .catch((error) => {
    console.error('Failed to create system owner:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
