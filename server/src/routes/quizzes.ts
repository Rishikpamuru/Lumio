import { Router } from 'express';
import { prisma } from '../services/prisma';

export const quizRouter = Router();

// Create a quiz
quizRouter.post('/', async (req, res) => {
  try {
    const { classId, title, dueDate } = req.body;
    
    const quiz = await prisma.quiz.create({ 
      data: { 
        classId, 
        title, 
        dueDate: dueDate ? new Date(dueDate) : null
      } 
    });
    
    res.json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Add questions to a quiz
quizRouter.post('/questions', async (req, res) => {
  try {
    const { quizId, prompt, type, options, answerKey } = req.body;
    
    const question = await prisma.question.create({
      data: {
        quizId,
        prompt,
        type,
        options: options ? JSON.stringify(options) : null,
        answerKey
      }
    });
    
    res.json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Get quizzes for a class
quizRouter.get('/class/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const quizzes = await prisma.quiz.findMany({ 
      where: { classId }, 
      include: { questions: true } 
    });
    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to get quizzes' });
  }
});
