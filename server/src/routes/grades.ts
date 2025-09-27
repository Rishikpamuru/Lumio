import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthedRequest, requireAuth } from './middleware/auth';

export const gradesRouter = Router();

// Get grade overview for current user (student or teacher)
gradesRouter.get('/overview', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role === 'student') {
      // Student: Get their grades organized by class
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user!.id },
        include: {
          class: {
            include: {
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: req.user!.id }
                  }
                }
              }
            }
          }
        }
      });

      const classGrades = enrollments.map((enrollment: any) => {
        const assignments = enrollment.class.assignments;
        const grades = assignments
          .map((assignment: any) => assignment.submissions[0]?.grade)
          .filter((grade: number | null) => grade !== null && grade !== undefined);
        
        const average = grades.length > 0 
          ? Math.round((grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length) * 10) / 10
          : null;

        return {
          classId: enrollment.class.id,
          className: enrollment.class.name,

          average,
          totalAssignments: assignments.length,
          gradedAssignments: grades.length
        };
      });

      res.json({ type: 'student', classes: classGrades });
    } else if (req.user!.role === 'teacher') {
      // Teacher: Get class averages for their classes
      const classes = await prisma.class.findMany({
        where: { teacherId: req.user!.id },
        include: {
          assignments: {
            include: {
              submissions: {
                where: { grade: { not: null } }
              }
            }
          },
          enrollments: true
        }
      });

      const classStats = classes.map((cls: any) => {
        const allGrades = cls.assignments.flatMap((assignment: any) => 
          assignment.submissions.map((sub: any) => sub.grade)
        );
        
        const average = allGrades.length > 0
          ? Math.round((allGrades.reduce((sum: number, grade: number) => sum + grade, 0) / allGrades.length) * 10) / 10
          : null;

        return {
          classId: cls.id,
          className: cls.name,

          average,
          totalStudents: cls.enrollments.length,
          totalAssignments: cls.assignments.length,
          totalGrades: allGrades.length
        };
      });

      res.json({ type: 'teacher', classes: classStats });
    } else {
      res.json({ type: 'other', classes: [] });
    }
  } catch (error) {
    console.error('Get grades overview error:', error);
    res.status(500).json({ error: 'Failed to get grades overview' });
  }
});

// Get detailed grades for a specific class
gradesRouter.get('/class/:classId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { classId } = req.params;

    // Verify access to class
    const classRec = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRec) return res.status(404).json({ error: 'Class not found' });

    if (req.user!.role === 'student') {
      // Check if student is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: req.user!.id, classId }
      });
      if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this class' });

      // Get student's grades for this class
      const assignments = await prisma.assignment.findMany({
        where: { classId },
        include: {
          submissions: {
            where: { studentId: req.user!.id },
            select: { grade: true, feedback: true, createdAt: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const assignmentGrades = assignments.map((assignment: any) => ({
        assignmentId: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        grade: assignment.submissions[0]?.grade || null,
        feedback: assignment.submissions[0]?.feedback || null,
        submittedAt: assignment.submissions[0]?.createdAt || null
      }));

      res.json({
        type: 'student',
        className: classRec.name,
        assignments: assignmentGrades
      });

    } else if (req.user!.role === 'teacher') {
      // Check if teacher owns the class
      if (classRec.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not your class' });
      }

      // Get assignment averages for this class
      const assignments = await prisma.assignment.findMany({
        where: { classId },
        include: {
          submissions: {
            where: { grade: { not: null } },
            select: { grade: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const assignmentStats = assignments.map((assignment: any) => {
        const grades = assignment.submissions.map((sub: any) => sub.grade);
        const average = grades.length > 0
          ? Math.round((grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length) * 10) / 10
          : null;

        return {
          assignmentId: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          average,
          totalSubmissions: grades.length
        };
      });

      res.json({
        type: 'teacher',
        className: classRec.name,
        assignments: assignmentStats
      });
    }
  } catch (error) {
    console.error('Get class grades error:', error);
    res.status(500).json({ error: 'Failed to get class grades' });
  }
});

// Get individual student grades for an assignment (teacher only)
gradesRouter.get('/assignment/:assignmentId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { assignmentId } = req.params;

    if (req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Teachers only' });
    }

    // Verify teacher owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { class: true }
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.class.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    // Get all students in the class with their grades
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: assignment.classId },
      include: {
        student: { select: { id: true, name: true, email: true } }
      }
    });

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: { student: { select: { id: true, name: true } } }
    });

    const submissionMap = new Map();
    submissions.forEach((sub: any) => {
      submissionMap.set(sub.studentId, sub);
    });

    const studentGrades = enrollments.map((enrollment: any) => {
      const submission = submissionMap.get(enrollment.student.id);
      return {
        student: enrollment.student,
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        submitted: !!submission,
        submittedAt: submission?.createdAt || null
      };
    });

    res.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate
      },
      className: assignment.class.name,
      studentGrades
    });

  } catch (error) {
    console.error('Get assignment grades error:', error);
    res.status(500).json({ error: 'Failed to get assignment grades' });
  }
});

export default gradesRouter;