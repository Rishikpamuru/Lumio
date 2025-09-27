import React, { useState } from 'react';
import { api } from '../lib/api';

interface Question {
  id: string;
  prompt: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
  answerKey?: string;
}

interface AssignmentCreatorProps {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({ classId, onClose, onSuccess }) => {
  const [contentType, setContentType] = useState<'assignment' | 'quiz'>('assignment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiQuestionCount, setAiQuestionCount] = useState('10');

  // Assignment fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [submissionType, setSubmissionType] = useState<'text' | 'link' | 'both'>('text');
  
  // Quiz fields
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const addQuestion = (type: 'MCQ' | 'TEXT') => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      prompt: '',
      type,
      options: type === 'MCQ' ? ['', '', '', ''] : undefined,
      answerKey: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId && q.options ? 
        { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) } : 
        q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const generateAIContent = async (type: 'mcq' | 'essay') => {
    if (!aiTopic.trim()) {
      setError('Please enter a topic for AI generation');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/ai-assistant/generate-assignment', {
        topic: aiTopic,
        type,
        difficulty: aiDifficulty,
        questionCount: type === 'mcq' ? parseInt(aiQuestionCount) : undefined
      });

      const generatedContent = response.data.content;

      if (type === 'mcq') {
        // Set title and description
        setTitle(generatedContent.title);
        setDescription(generatedContent.description);
        

        const aiQuestions: Question[] = generatedContent.questions.map((q: any, index: number) => ({
          id: (Date.now() + index).toString(),
          prompt: q.prompt,
          type: 'MCQ' as const,
          options: q.options,
          answerKey: q.options[q.correctAnswer] // Store the actual answer text
        }));
        
        setQuestions(aiQuestions);
        setContentType('quiz');
      } else {
        // Essay assignment
        setTitle(generatedContent.title);
        setDescription(`${generatedContent.description}\n\n**Essay Prompt:**\n${generatedContent.prompt}\n\n**Requirements:**\n${generatedContent.requirements}\n\n**Evaluation Criteria:**\n${generatedContent.rubric}`);
        setContentType('assignment');
      }

      setShowAIGenerator(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate AI content');
    } finally {
      setAiLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        classId,
        title,
        description,
        dueDate: dueDate || null,
        points: parseInt(points) || 100,
        submissionType
      };
      
      await api.post('/api/assignments', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.prompt.trim()) {
        setError('All questions must have a prompt');
        return;
      }
      if (q.type === 'MCQ') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          setError('All MCQ options must be filled');
          return;
        }
        if (!q.answerKey) {
          setError('All MCQ questions must have a correct answer selected');
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const quizPayload = {
        classId,
        title,
        dueDate: dueDate || null
      };
      
      const response = await api.post('/api/quizzes', quizPayload);
      const quizId = response.data.id;
      
      // Add questions
      for (const question of questions) {
        await api.post('/api/quizzes/questions', {
          quizId,
          prompt: question.prompt,
          type: question.type,
          options: question.type === 'MCQ' ? question.options : null,
          answerKey: question.answerKey
        });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (contentType === 'assignment') {
      createAssignment();
    } else {
      createQuiz();
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e1e6ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, color: '#1d2433' }}>Create Assignment or Quiz</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Content Type Selector */}
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e1e6ef',
          backgroundColor: '#f8f9fa'
        }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1d2433' }}>
            Content Type
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="assignment"
                checked={contentType === 'assignment'}
                onChange={(e) => setContentType(e.target.value as 'assignment' | 'quiz')}
                style={{ marginRight: '0.5rem' }}
              />
              Assignment
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="quiz"
                checked={contentType === 'quiz'}
                onChange={(e) => setContentType(e.target.value as 'assignment' | 'quiz')}
                style={{ marginRight: '0.5rem' }}
              />
              Quiz
            </label>
          </div>

          {/* AI Generation Button */}
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowAIGenerator(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🤖 Generate with AI
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {/* Basic Info (shared) */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Enter ${contentType} title...`}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {contentType === 'assignment' && (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter assignment instructions, requirements, and details..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Points
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={e => setPoints(e.target.value)}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Submission Type
                </label>
                <select
                  value={submissionType}
                  onChange={e => setSubmissionType(e.target.value as 'text' | 'link' | 'both')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="text">Text Submission Only</option>
                  <option value="link">Link/URL Submission Only</option>
                  <option value="both">Both Text and Link</option>
                </select>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  Choose how students can submit their work
                </p>
              </div>
            </>
          )}

          {contentType === 'quiz' && (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Questions Section */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '1rem' 
                }}>
                  <h3 style={{ margin: 0, color: '#333' }}>Questions ({questions.length})</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => addQuestion('MCQ')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      + MCQ
                    </button>
                    <button
                      onClick={() => addQuestion('TEXT')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      + Text Answer
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                {questions.map((question, index) => (
                  <div key={question.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: '#f9f9f9'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: '1rem' 
                    }}>
                      <h4 style={{ margin: 0, color: '#333' }}>
                        Question {index + 1} ({question.type === 'MCQ' ? 'Multiple Choice' : 'Text Answer'})
                      </h4>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Question Prompt *
                      </label>
                      <textarea
                        value={question.prompt}
                        onChange={e => updateQuestion(question.id, 'prompt', e.target.value)}
                        placeholder="Enter your question here..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    {question.type === 'MCQ' && question.options && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Answer Options *
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            marginBottom: '0.5rem' 
                          }}>
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.answerKey === option}
                              onChange={() => updateQuestion(question.id, 'answerKey', option)}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <span style={{ minWidth: '20px', fontWeight: 'bold' }}>
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={e => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                              }}
                            />
                          </div>
                        ))}
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                          Select the radio button next to the correct answer
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    border: '2px dashed #ddd'
                  }}>
                    <p style={{ margin: 0 }}>No questions added yet</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                      Click "Add MCQ" or "Add Text Answer" to get started
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #f5c6cb',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e1e6ef',
          display: 'flex',
          justifyContent: 'space-between',
          background: '#f8f9fa'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            style={{
              padding: '0.75rem 2rem',
              background: loading || !title.trim() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Creating...' : `Create ${contentType === 'assignment' ? 'Assignment' : 'Quiz'}`}
          </button>
        </div>
      </div>

      {/* AI Generation Modal */}
      {showAIGenerator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 AI Content Generator
              </h3>
              <button
                onClick={() => setShowAIGenerator(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Topic/Subject *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Algebra, World War 2, Photosynthesis..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Difficulty Level
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Number of Questions (for MCQ)
              </label>
              <input
                type="number"
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(e.target.value)}
                min="5"
                max="50"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => generateAIContent('mcq')}
                disabled={aiLoading || !aiTopic.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: aiLoading || !aiTopic.trim() ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: aiLoading || !aiTopic.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                {aiLoading ? '🔄 Generating...' : '📝 Generate MCQ Quiz'}
              </button>
              
              <button
                onClick={() => generateAIContent('essay')}
                disabled={aiLoading || !aiTopic.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: aiLoading || !aiTopic.trim() ? '#ccc' : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: aiLoading || !aiTopic.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                {aiLoading ? '🔄 Generating...' : '✍️ Generate Essay Assignment'}
              </button>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              <strong>💡 Tips:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                <li>Be specific with your topic for better results</li>
                <li>MCQ will generate a quiz with multiple choice questions</li>
                <li>Essay will create an assignment with detailed instructions</li>
                <li>You can edit the generated content before saving</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};