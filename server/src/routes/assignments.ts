import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthedRequest, requireAuth } from './middleware/auth';

export const assignmentRouter = Router();

assignmentRouter.post('/', async (req, res) => {
  try {
    const { classId, title, description, dueDate, points, submissionType } = req.body;
    
    if (!classId || !title) {
      return res.status(400).json({ error: 'classId and title required' });
    }
    
    const assignment = await prisma.assignment.create({ 
      data: { 
        classId, 
        title, 
        description, 
        dueDate: dueDate ? new Date(dueDate) : null,
        submissionType: submissionType || 'text'
      } 
    });
    
    res.json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

assignmentRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role === 'teacher' || req.user!.role === 'admin') {
      // Teachers get assignments from their classes
      const assignments = await prisma.assignment.findMany({ 
        where: { 
          class: { teacherId: req.user!.id }
        },
        include: {
          class: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(assignments);
    } else if (req.user!.role === 'student') {
      // Students get assignments from classes they're enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user!.id },
        include: {
          class: {
            include: {
              assignments: {
                include: {
                  class: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      });
      
      // Flatten assignments from all enrolled classes
      const assignments = enrollments.flatMap((e: any) => e.class.assignments);
      res.json(assignments);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

assignmentRouter.get('/class/:id', requireAuth, async (req: AuthedRequest, res) => {
  const clsId = req.params.id;
  const assignments = await prisma.assignment.findMany({ where: { classId: clsId } });
  res.json(assignments);
});

// Get single assignment with basic info
assignmentRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) return res.status(404).json({ error: 'Not found' });
  res.json(assignment);
});

// List all students with their submissions for an assignment (teacher only)
assignmentRouter.get('/:id/submissions', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: { class: true } });
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    if (!['teacher','admin'].includes(req.user!.role)) return res.status(403).json({ error: 'Forbidden' });
    
    const classRec = await prisma.class.findFirst({ where: { id: assignment.classId, teacherId: req.user!.id } });
    if (!classRec && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    // Get all students enrolled in the class
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: assignment.classId },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });
    
    // Get all submissions for this assignment
    const submissions = await prisma.submission.findMany({ 
      where: { assignmentId: assignment.id },
      include: { student: true }
    });
    
    // Create a map of submissions by student ID for easy lookup
    const submissionMap = new Map();
    submissions.forEach((sub: any) => {
      submissionMap.set(sub.studentId, sub);
    });
    
    // Combine students with their submissions (if any)
    const studentsWithSubmissions = enrollments.map((enrollment: any) => ({
      student: enrollment.student,
      submission: submissionMap.get(enrollment.student.id) || null
    }));
    
    res.json({
      assignment,
      studentsWithSubmissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Update grade for a submission (teacher only)
assignmentRouter.put('/submissions/:submissionId/grade', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    
    if (!['teacher', 'admin'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Verify the teacher owns this assignment
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { class: true } } }
    });
    
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    
    const isOwner = submission.assignment?.class.teacherId === req.user!.id;
    if (!isOwner && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: grade ? parseFloat(grade) : null,
        feedback: feedback || null
      },
      include: { student: true }
    });
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});
