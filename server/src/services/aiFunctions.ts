
import { getAIKey } from './aiKey';

interface AIGradingResult {
  grade: number;
  feedback: string;
}

export async function gradeAssignmentWithAI(
  assignmentTitle: string,
  assignmentDescription: string,
  studentAnswer: string,
  maxPoints: number = 100
): Promise<AIGradingResult> {
  const key = getAIKey();
  
  const prompt = `You are an experienced teacher grading a student assignment. Please provide a fair and constructive evaluation.

ASSIGNMENT DETAILS:
Title: ${assignmentTitle}
Description: ${assignmentDescription || 'No description provided'}
Maximum Points: ${maxPoints}

STUDENT SUBMISSION:
${studentAnswer}

Please provide your response in exactly this JSON format:
{
  "grade": [number from 0 to ${maxPoints}],
  "feedback": "[constructive feedback explaining the grade, what was done well, and areas for improvement]"
}

Be fair but thorough in your evaluation. Consider accuracy, completeness, effort, and understanding demonstrated in the response.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the more affordable model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful and fair teacher assistant that grades student work constructively and provides useful feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3 // Lower temperature for more consistent grading
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse the JSON response
    try {
      const result = JSON.parse(aiResponse);
      
      // Validate the response structure
      if (typeof result.grade !== 'number' || typeof result.feedback !== 'string') {
        throw new Error('Invalid AI response format');
      }

      // Ensure grade is within valid range
      const grade = Math.max(0, Math.min(maxPoints, result.grade));

      return {
        grade,
        feedback: result.feedback
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      
      // Fallback: try to extract grade and feedback manually
      const gradeMatch = aiResponse.match(/grade["\s]*:[\s]*(\d+)/i);
      const grade = gradeMatch ? Math.max(0, Math.min(maxPoints, parseInt(gradeMatch[1]))) : Math.floor(maxPoints * 0.7);
      
      return {
        grade,
        feedback: aiResponse.includes('feedback') 
          ? aiResponse.split('feedback')[1]?.replace(/[":]/g, '').trim() || aiResponse
          : aiResponse
      };
    }
  } catch (error) {
    console.error('AI grading error:', error);
    throw new Error('AI grading service temporarily unavailable. Please try again or grade manually.');
  }
}

export async function exampleAICompletion(prompt: string): Promise<string> {
  // Keep the old function for backward compatibility
  try {
    const result = await gradeAssignmentWithAI('General Question', '', prompt);
    return result.feedback;
  } catch (error) {
    console.error('AI completion error:', error);
    return 'AI service temporarily unavailable.';
  }
}
