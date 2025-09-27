import 'dotenv/config';
import { prisma } from '../services/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const users = [
    { name: 'Teacher One', email: 'teacher1@lumio.test', password: 'Password123!', role: 'teacher' as const },
    { name: 'Teacher Two', email: 'teacher2@lumio.test', password: 'Password123!', role: 'teacher' as const },
    { name: 'Student One', email: 'student1@lumio.test', password: 'Password123!', role: 'student' as const },
    { name: 'Student Two', email: 'student2@lumio.test', password: 'Password123!', role: 'student' as const }
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`Skip existing: ${u.email}`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({ data: { name: u.name, email: u.email, passwordHash: hash, role: u.role } });
    console.log(`Created user: ${u.email} (${u.role})`);
  }

  console.log('Seed complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });