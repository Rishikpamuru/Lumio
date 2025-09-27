import { Router } from 'express';
import { requireAuth, AuthedRequest } from './middleware/auth';
import { prisma } from '../services/prisma';
import { toCSV } from '../services/exportCsv';

export const exportRouter = Router();

// Export submissions for a class (teacher only)
exportRouter.get('/class/:id/submissions.csv', requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
  const classId = req.params.id;
  const subs = await prisma.submission.findMany({ where: { assignment: { classId } }, include: { student: true, assignment: true } });
  const headers = ['Student', 'Assignment', 'Grade', 'Submitted'];
  const rows = subs.map(s => [s.student.name, s.assignment?.title || '', s.grade ?? '', s.createdAt.toISOString()]);
  const csv = toCSV(headers, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});
