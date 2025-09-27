import 'dotenv/config';
import { prisma } from '../services/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@lumio.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash('adminpass', 10);
    await prisma.user.create({ data: { name: 'System Admin', email: adminEmail, passwordHash: hash, role: 'admin' } });
    console.log('Created admin user:', adminEmail, 'password: adminpass');
  } else {
    console.log('Admin user already exists');
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });