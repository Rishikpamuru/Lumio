import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthedRequest, requireAuth } from './middleware/auth';
import OpenAI from 'openai';

export const aiAssistantRouter = Router();


aiAssistantRouter.post('/query', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole === 'teacher') {
      return handleTeacherQuery(req, res, question, userId);
    } else if (userRole === 'student') {
      return handleStudentQuery(req, res, question, userId);
    } else {
      return res.status(403).json({ error: 'AI Assistant is not available for this user role' });
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ 
      error: 'Failed to process AI query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function handleStudentQuery(req: AuthedRequest, res: any, question: string, studentId: string) {
  try {
    console.log('Starting student query for:', studentId, 'Question:', question);
    
    // Get student's data for context
    
    // Get student info
    console.log('Fetching student info...');
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });
    console.log('Student found:', student ? 'Yes' : 'No');
    
    // Get student's classes and assignments
    console.log('Fetching enrollments...');
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            assignments: {
              include: {
                submissions: {
                  where: { studentId }
                }
              }
            }
          }
        }
      }
    });
    console.log('Enrollments found:', enrollments.length);

    // Prepare context data
    const contextData = {
      student: {
        id: studentId,
        name: student?.name || 'Student',
        email: student?.email || ''
      },
      classes: enrollments.map((enrollment: any) => ({
        id: enrollment.class.id,
        name: enrollment.class.name,

        assignments: enrollment.class.assignments.map((assignment: any) => {
          const submission = assignment.submissions.find((s: any) => s.studentId === studentId);
          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            points: assignment.points,
            hasSubmission: !!submission,
            grade: submission?.grade || null,
            submittedAt: submission?.createdAt || null
          };
        })
      }))
    };

    // Calculate current grades for grade calculator queries
    const gradeData = contextData.classes.map((cls: any) => {
      const gradedAssignments = cls.assignments.filter((a: any) => a.grade !== null);
      const totalPoints = gradedAssignments.reduce((sum: number, a: any) => sum + (a.points || 0), 0);
      const earnedPoints = gradedAssignments.reduce((sum: number, a: any) => sum + ((a.grade || 0) * (a.points || 0) / 100), 0);
      
      return {
        className: cls.name,
        currentGrade: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10 : null,
        gradedAssignments: gradedAssignments.length,
        totalAssignments: cls.assignments.length,
        upcomingAssignments: cls.assignments.filter((a: any) => 
          !a.hasSubmission && 
          (!a.dueDate || new Date(a.dueDate) > new Date())
        )
      };
    });

    console.log('Initializing OpenAI client...');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an AI academic assistant for a student. You help with questions about upcoming assignments and grade calculations.

Current date: ${new Date().toLocaleDateString()}

Student Context:
${JSON.stringify(contextData, null, 2)}

Grade Summary:
${JSON.stringify(gradeData, null, 2)}

Guidelines:
1. For assignment questions: Provide clear information about upcoming deadlines, what's due soon, and assignment details
2. For grade calculations: Help calculate current grades, what grades are needed on future assignments, or GPA impacts
3. Be encouraging and supportive in your responses
4. If asked about something not in the provided data, politely explain you can only help with their current coursework
5. Keep responses concise but helpful
6. Use the student's name when appropriate
7. IMPORTANT: Do not use any markdown formatting like **bold**, *italic*, or other text effects. Use plain text only.

Respond in a friendly, helpful tone as their academic assistant using plain text without formatting.`;

    console.log('Making OpenAI API call...');
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    console.log('OpenAI response received');

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Student AI query error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ 
      error: 'Failed to process student AI query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleTeacherQuery(req: AuthedRequest, res: any, question: string, teacherId: string) {
  try {
    // Get teacher info
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    // Get teacher's classes and student data for context
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId },
      include: {
        assignments: {
          include: {
            submissions: {
              include: {
                student: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Prepare context data for teacher
    const contextData = {
      teacher: {
        id: teacherId,
        name: teacher?.name || 'Teacher',
        email: teacher?.email || ''
      },
      classes: teacherClasses.map((cls: any) => ({
        id: cls.id,
        name: cls.name,

        totalStudents: cls.enrollments.length,
        assignments: cls.assignments.map((assignment: any) => {
          const submissions = assignment.submissions;
          const gradedSubmissions = submissions.filter((s: any) => s.grade !== null);
          const averageGrade = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum: number, s: any) => sum + s.grade, 0) / gradedSubmissions.length
            : null;

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            totalSubmissions: submissions.length,
            gradedSubmissions: gradedSubmissions.length,
            averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
            submissions: submissions.map((sub: any) => ({
              studentName: sub.student.name,
              studentId: sub.student.id,
              grade: sub.grade,
              submittedAt: sub.createdAt
            }))
          };
        }),
        students: cls.enrollments.map((enrollment: any) => {
          const studentSubmissions = cls.assignments.flatMap((a: any) => 
            a.submissions.filter((s: any) => s.student.id === enrollment.student.id)
          );
          const gradedSubmissions = studentSubmissions.filter((s: any) => s.grade !== null);
          const averageGrade = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum: number, s: any) => sum + s.grade, 0) / gradedSubmissions.length
            : null;

          return {
            id: enrollment.student.id,
            name: enrollment.student.name,
            email: enrollment.student.email,
            submissionCount: studentSubmissions.length,
            averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null
          };
        })
      }))
    };

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an AI teaching assistant for educators. You help teachers with classroom management, student performance analysis, and content creation.

Current date: ${new Date().toLocaleDateString()}

Teacher Context:
${JSON.stringify(contextData, null, 2)}

Capabilities and Guidelines:
1. STUDENT ANALYSIS: Identify struggling students, top performers, grade trends, and provide insights on student performance
2. CONTENT GENERATION: Create multiple choice questions, assignment prompts, rubrics, and educational materials
3. CLASS MANAGEMENT: Provide suggestions for improving engagement, differentiated instruction, and assessment strategies
4. GRADE ANALYSIS: Calculate class averages, identify grade distributions, compare assignment performance

Special Functions:
- When asked about "lowest scoring students" or similar, identify students with the lowest average grades
- When asked to create MCQs or assignments, generate detailed, educational content with clear instructions
- For content creation, always include answer keys, rubrics, or grading criteria when appropriate
- Be professional and pedagogically sound in your recommendations

Response Format:
- For student lists: Include names, grades/performance data
- For content creation: Provide structured, ready-to-use materials
- For analysis: Include specific data points and actionable insights
- Keep responses comprehensive but organized with clear headings
- IMPORTANT: Do not use any markdown formatting like **bold**, *italic*, or other text effects. Use plain text only.

Respond as a knowledgeable teaching assistant who understands pedagogy and classroom dynamics.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Teacher AI query error:', error);
    res.status(500).json({ 
      error: 'Failed to process teacher AI query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


aiAssistantRouter.post('/generate-assignment', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { topic, type, difficulty, questionCount } = req.body;
    
    if (req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can generate assignments' });
    }

    if (!topic || !type) {
      return res.status(400).json({ error: 'Topic and type are required' });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'mcq') {
      systemPrompt = `You are an expert educator creating multiple choice questions. Generate high-quality, educational MCQ questions with exactly 4 options each.

Response must be valid JSON in this exact format:
{
  "title": "Assignment Title",
  "description": "Assignment description and instructions",
  "questions": [
    {
      "prompt": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Guidelines:
- Make questions clear and unambiguous
- Ensure only one correct answer per question
- Include plausible distractors
- Vary difficulty appropriately
- correctAnswer should be the index (0-3) of the correct option`;

      userPrompt = `Create ${questionCount || 10} multiple choice questions about: ${topic}
Difficulty level: ${difficulty || 'medium'}
Academic level: High school/College appropriate`;

    } else if (type === 'essay') {
      systemPrompt = `You are an expert educator creating essay assignments. Generate thoughtful, engaging essay prompts with clear instructions.

Response must be valid JSON in this exact format:
{
  "title": "Assignment Title", 
  "description": "Detailed assignment description and instructions",
  "prompt": "The main essay question/prompt",
  "requirements": "Specific requirements (length, format, etc.)",
  "rubric": "Key evaluation criteria"
}

Guidelines:
- Create engaging, thought-provoking prompts
- Include clear expectations and requirements
- Provide evaluation criteria
- Make instructions comprehensive but concise`;

      userPrompt = `Create an essay assignment about: ${topic}
Difficulty level: ${difficulty || 'medium'}
Academic level: High school/College appropriate`;

    } else {
      return res.status(400).json({ error: 'Invalid assignment type. Use "mcq" or "essay"' });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let generatedContent;
    try {
      generatedContent = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Invalid response format from AI');
    }

    res.json({
      success: true,
      content: generatedContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assignment Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Grade calculator endpoint
aiAssistantRouter.post('/calculate-grade', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { classId, hypotheticalGrades, hypotheticalAssignments } = req.body;
    
    if (req.user!.role !== 'student') {
      return res.status(403).json({ error: 'Grade calculator is only available for students' });
    }

    const studentId = req.user!.id;

    // Get class assignments and current grades
    const classData = await prisma.class.findFirst({
      where: { 
        id: classId,
        enrollments: {
          some: { studentId }
        }
      },
      include: {
        assignments: {
          include: {
            submissions: {
              where: { studentId }
            }
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found or not enrolled' });
    }

    // Calculate current grade and projected grade using simple averaging
    let currentGradeTotal = 0;
    let currentGradeCount = 0;
    let projectedGradeTotal = 0;
    let projectedGradeCount = 0;

    // Process existing assignments
    classData.assignments.forEach((assignment: any) => {
      const submission = assignment.submissions.find((s: any) => s.studentId === studentId);
      const currentGrade = submission?.grade;
      
      if (currentGrade !== null && currentGrade !== undefined) {
        // Use actual grade for both current and projected
        currentGradeTotal += currentGrade;
        currentGradeCount++;
        projectedGradeTotal += currentGrade;
        projectedGradeCount++;
      } else if (hypotheticalGrades && hypotheticalGrades[assignment.id]) {
        // Use hypothetical grade for projected only
        const hypotheticalGrade = hypotheticalGrades[assignment.id];
        projectedGradeTotal += hypotheticalGrade;
        projectedGradeCount++;
      }
    });

    // Add hypothetical assignments to projected calculation
    if (hypotheticalAssignments && Array.isArray(hypotheticalAssignments)) {
      hypotheticalAssignments.forEach((hypAssignment: any) => {
        const grade = hypAssignment.grade || 0;
        projectedGradeTotal += grade;
        projectedGradeCount++;
      });
    }

    const currentGrade = currentGradeCount > 0 ? currentGradeTotal / currentGradeCount : 0;
    const projectedGrade = projectedGradeCount > 0 ? projectedGradeTotal / projectedGradeCount : 0;

    res.json({
      className: classData.name,
      currentGrade: Math.round(currentGrade * 10) / 10,
      projectedGrade: Math.round(projectedGrade * 10) / 10,
      totalAssignments: classData.assignments.length,
      gradedAssignments: currentGradeCount,
      assignments: classData.assignments.map((assignment: any) => {
        const submission = assignment.submissions.find((s: any) => s.studentId === studentId);
        return {
          id: assignment.id,
          title: assignment.title,
          currentGrade: submission?.grade || null,
          hypotheticalGrade: hypotheticalGrades?.[assignment.id] || null
        };
      })
    });

  } catch (error) {
    console.error('Grade calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate grades' });
  }
});