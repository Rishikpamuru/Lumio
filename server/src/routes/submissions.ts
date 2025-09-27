import { Router } from 'express';
import { prisma } from '../services/prisma';
import { exampleAICompletion } from '../services/aiFunctions';

export const submissionRouter = Router();

// Submit assignment (temporary hardcoded student ID for demo)
submissionRouter.post('/assignment/:id', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { answers } = req.body;
    const studentId = '3'; // Hardcoded to student demo user for now
    
    console.log('Assignment submission attempt:', { assignmentId, studentId, answers });
    
    const submission = await prisma.submission.upsert({
      where: { 
        studentId_assignmentId: { 
          studentId: studentId, 
          assignmentId: assignmentId 
        } 
      },
      update: { answers: JSON.stringify(answers) },
      create: { 
        assignmentId, 
        studentId, 
        answers: JSON.stringify(answers) 
      }
    });
    
    console.log('Submission saved:', submission);
    res.json(submission);
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Get current user's submission for an assignment
submissionRouter.get('/assignment/:id', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const studentId = '3'; // Hardcoded to student demo user for now
    
    console.log('Getting submission for assignment:', assignmentId, 'student:', studentId);
    
    const submission = await prisma.submission.findFirst({ 
      where: { 
        assignmentId: assignmentId, 
        studentId: studentId 
      } 
    });
    
    if (!submission) {
      return res.json({ answers: null }); // Return empty state instead of 404
    }
    
    res.json({
      answers: submission.answers ? JSON.parse(submission.answers) : null,
      grade: submission.grade,
      feedback: submission.feedback
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

// Submit quiz (auto-grade MCQ)
submissionRouter.post('/quiz/:id', async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers } = req.body;
    const studentId = '3'; // Hardcoded to student demo user for now
    
    const quiz = await prisma.quiz.findUnique({ 
      where: { id: quizId }, 
      include: { questions: true } 
    });
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    let score = 0;
    let total = 0;
    
    quiz.questions.forEach((q) => {
      if (q.type === 'MCQ') { 
        total++;
        if (answers[q.id] === q.answerKey) {
          score++;
        }
      }
    });
    
    const grade = total ? (score / total) * 100 : null;
    
    const submission = await prisma.submission.create({ 
      data: { 
        quizId, 
        studentId, 
        answers: JSON.stringify(answers), 
        grade 
      } 
    });
    
    res.json(submission);
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});


submissionRouter.post('/:id/ai-grade', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ 
      where: { id: req.params.id }, 
      include: { 
        assignment: { include: { class: true } }, 
        student: true 
      } 
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!submission.assignment) {
      return res.status(400).json({ error: 'This submission is not for an assignment' });
    }

    // Parse the student's answers
    let studentAnswer = '';
    try {
      const answers = JSON.parse(submission.answers || '{}');
      if (typeof answers === 'object') {
        studentAnswer = [answers.text, answers.link].filter(Boolean).join('\n\n');
      } else {
        studentAnswer = String(answers);
      }
    } catch {
      studentAnswer = submission.answers || '';
    }

    if (!studentAnswer.trim()) {
      return res.status(400).json({ error: 'No content to grade' });
    }
    

    const { gradeAssignmentWithAI } = await import('../services/aiFunctions');
    
    const result = await gradeAssignmentWithAI(
      submission.assignment.title,
      submission.assignment.description || '',
      studentAnswer,
      100 // Default max points
    );
    
    const updated = await prisma.submission.update({ 
      where: { id: submission.id }, 
      data: { 
        grade: result.grade,
        feedback: result.feedback 
      },
      include: { student: true }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('AI grading error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'AI grading failed' 
    });
  }
});
