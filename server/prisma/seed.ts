import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin',
      passwordHash: adminPassword,
      role: 'admin'
    }
  });

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.create({
    data: {
      name: 'Teacher Demo',
      email: 'teacher',
      passwordHash: teacherPassword,
      role: 'teacher'
    }
  });

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.create({
    data: {
      name: 'Student Demo',
      email: 'student',
      passwordHash: studentPassword,
      role: 'student'
    }
  });

  console.log('✅ Seed completed!');
  console.log(`Admin: admin / admin123`);
  console.log(`Teacher: teacher / teacher123`);
  console.log(`Student: student / student123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });