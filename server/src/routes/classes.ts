import { Router } from 'express';
import { prisma } from '../services/prisma';
import { requireAuth, AuthedRequest } from './middleware/auth';
import { randomBytes } from 'crypto';

export const classRouter = Router();

// Create class (teacher only)
classRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { name } = req.body as { name: string };
  if (!name) return res.status(400).json({ error: 'name required' });
  if (req.user!.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
  const joinCode = randomBytes(3).toString('hex');
  const cls = await prisma.class.create({ data: { name, joinCode, teacherId: req.user!.id } });
  res.json(cls);
});

// List classes (for current user role)
classRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role === 'teacher' || req.user!.role === 'admin') {
    const classes = await prisma.class.findMany({ where: { teacherId: req.user!.id } });
    return res.json(classes);
  }
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: req.user!.id }, include: { class: true } });
  res.json(enrollments.map((e: any) => e.class));
});

// Class detail with teacher info; students get teacher, but not joinCode; teacher gets joinCode.
classRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const cls = await prisma.class.findUnique({ where: { id }, include: { teacher: { select: { id: true, name: true } } } });
  if (!cls) return res.status(404).json({ error: 'Not found' });
  // Authorization: teacher/admin must own; students must be enrolled.
  if (req.user!.role === 'teacher') {
    if (cls.teacherId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user!.role === 'student') {
    const enrolled = await prisma.enrollment.findFirst({ where: { studentId: req.user!.id, classId: id } });
    if (!enrolled) return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user!.role === 'admin') {
    // Admin read-only allowed
  }
  let payload: any = {
    id: cls.id,
    name: cls.name,
    teacher: cls.teacher
  };
  if (req.user!.role === 'teacher' && cls.teacherId === req.user!.id) payload.joinCode = cls.joinCode;
  res.json(payload);
});

// Join class (student)
classRouter.post('/join', requireAuth, async (req: AuthedRequest, res) => {
  const { code } = req.body as { code: string };
  if (!code) return res.status(400).json({ error: 'code required' });
  if (req.user!.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  const cls = await prisma.class.findUnique({ where: { joinCode: code } });
  if (!cls) return res.status(404).json({ error: 'Invalid join code' });
  await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId: req.user!.id, classId: cls.id } },
    update: {},
    create: { studentId: req.user!.id, classId: cls.id }
  });
  res.json({ joined: true, className: cls.name });
});

// Get class roster (teacher only)
classRouter.get('/:id/students', requireAuth, async (req: AuthedRequest, res) => {
  const classId = req.params.id;
  
  // Verify teacher owns this class
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user!.role !== 'teacher' || cls.teacherId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { student: { name: 'asc' } }
  });
  
  res.json(enrollments.map((e: any) => e.student));
});

// Add specific student to class (teacher)
classRouter.post('/:id/students', requireAuth, async (req: AuthedRequest, res) => {
  const classId = req.params.id;
  const { studentId } = req.body;
  
  if (!studentId) return res.status(400).json({ error: 'studentId required' });
  
  // Verify teacher owns this class
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user!.role !== 'teacher' || cls.teacherId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Verify student exists
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== 'student') {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Add to class
  await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId, classId } },
    update: {},
    create: { studentId, classId }
  });
  
  res.json({ added: true, student: { id: student.id, name: student.name, email: student.email } });
});

// Remove student from class (teacher)
classRouter.delete('/:id/students/:studentId', requireAuth, async (req: AuthedRequest, res) => {
  const { id: classId, studentId } = req.params;
  
  // Verify teacher owns this class
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user!.role !== 'teacher' || cls.teacherId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await prisma.enrollment.delete({
    where: { studentId_classId: { studentId, classId } }
  });
  
  res.json({ removed: true });
});

// Delete class (teacher only - their own classes)
classRouter.delete('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const classId = req.params.id;
    
    if (req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete classes' });
    }
    
    // Check if class exists and belongs to the teacher
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (cls.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own classes' });
    }
    
    // Delete the class (CASCADE will handle related records)
    await prisma.class.delete({ where: { id: classId } });
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// Get all students (for teacher to add to class)
classRouter.get('/students/available', requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });
  
  res.json(students);
});
