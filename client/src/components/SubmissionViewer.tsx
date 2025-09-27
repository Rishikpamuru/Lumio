import React, { useState, useEffect } from 'react';
import { api, AssignmentAPI } from '../lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Submission {
  id: string;
  answers: string;
  grade?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  student: Student;
}

interface StudentWithSubmission {
  student: Student;
  submission: Submission | null;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  submissionType?: string;
}

interface SubmissionViewerProps {
  assignmentId: string;
  onClose: () => void;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({ assignmentId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentsWithSubmissions, setStudentsWithSubmissions] = useState<StudentWithSubmission[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithSubmission | null>(null);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
      setAssignment(response.data.assignment);
      setStudentsWithSubmissions(response.data.studentsWithSubmissions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (studentWithSub: StudentWithSubmission) => {
    setSelectedStudent(studentWithSub);
    if (studentWithSub.submission) {
      setGrade(studentWithSub.submission.grade?.toString() || '');
      setFeedback(studentWithSub.submission.feedback || '');
    } else {
      setGrade('');
      setFeedback('');
    }
  };

  const saveGrade = async () => {
    if (!selectedStudent?.submission) return;
    
    setGrading(true);
    try {
      const response = await api.put(`/api/assignments/submissions/${selectedStudent.submission.id}/grade`, {
        grade: grade ? parseFloat(grade) : null,
        feedback: feedback || null
      });
      
      // Update the submission in our state
      setStudentsWithSubmissions(prev => 
        prev.map(item => 
          item.student.id === selectedStudent.student.id 
            ? { ...item, submission: response.data }
            : item
        )
      );
      
      // Update selected student
      setSelectedStudent({
        ...selectedStudent,
        submission: response.data
      });
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save grade');
    } finally {
      setGrading(false);
    }
  };

  const runAIGrade = async () => {
    if (!selectedStudent?.submission) return;
    
    setAiLoading(true);
    setError(null);
    
    try {
      const response = await AssignmentAPI.aiGrade(selectedStudent.submission.id);
      
      // Update the submission in our state
      setStudentsWithSubmissions(prev => 
        prev.map(item => 
          item.student.id === selectedStudent.student.id 
            ? { ...item, submission: response }
            : item
        )
      );
      

      setSelectedStudent({
        ...selectedStudent,
        submission: response
      });
      

      setGrade(response.grade?.toString() || '');
      setFeedback(response.feedback || '');
      
      // Show success notification
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI grading failed');
      console.error('AI grading error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const parseAnswers = (answersJson: string) => {
    try {
      return JSON.parse(answersJson);
    } catch {
      return answersJson; // Fallback to raw string
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  if (loading) {
    return (
      <div style={{
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
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
          Loading submissions...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e1e6ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0 }}>
            Submissions: {assignment?.title}
          </h2>
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

        {error && (
          <div style={{
            margin: '1rem',
            padding: '0.75rem',
            background: '#ffe6e6',
            color: '#cc0000',
            borderRadius: '4px',
            border: '1px solid #ffcccc'
          }}>
            {error}
          </div>
        )}

        {aiSuccess && (
          <div style={{
            margin: '1rem',
            padding: '0.75rem',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ AI grading completed! Grade and feedback have been populated below.
          </div>
        )}

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Student List */}
          <div style={{
            width: '300px',
            borderRight: '1px solid #e1e6ef',
            overflow: 'auto',
            padding: '1rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>
              Students ({studentsWithSubmissions.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {studentsWithSubmissions.map((item) => (
                <div
                  key={item.student.id}
                  onClick={() => selectStudent(item)}
                  style={{
                    padding: '0.75rem',
                    background: selectedStudent?.student.id === item.student.id ? '#e3f2fd' : '#f8f9fa',
                    border: '1px solid',
                    borderColor: selectedStudent?.student.id === item.student.id ? '#2196f3' : '#e9ecef',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {item.student.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    {item.student.email}
                  </div>
                  <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    {item.submission ? (
                      <span style={{ 
                        color: item.submission.grade !== null ? '#28a745' : '#007bff',
                        fontWeight: 'bold'
                      }}>
                        {item.submission.grade !== null 
                          ? `Graded: ${item.submission.grade}%` 
                          : 'Submitted'}
                      </span>
                    ) : (
                      <span style={{ color: '#dc3545' }}>No submission</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Details */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {selectedStudent ? (
              <div>
                <h3 style={{ margin: '0 0 1rem 0' }}>
                  {selectedStudent.student.name}'s Submission
                </h3>

                {selectedStudent.submission ? (
                  <div>
                    {/* Submission Content */}
                    <div style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057' }}>
                        Student's Answer
                      </h4>
                      
                      {(() => {
                        const answers = parseAnswers(selectedStudent.submission!.answers);
                        
                        if (typeof answers === 'object' && answers !== null) {
                          return (
                            <div>
                              {answers.text && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <strong>Text Response:</strong>
                                  <div style={{
                                    background: 'white',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    border: '1px solid #dee2e6',
                                    marginTop: '0.5rem',
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {answers.text}
                                  </div>
                                </div>
                              )}
                              {answers.link && (
                                <div>
                                  <strong>Link Submission:</strong>
                                  <div style={{ marginTop: '0.5rem' }}>
                                    <a 
                                      href={answers.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        padding: '0.5rem',
                                        background: 'white',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                      }}
                                    >
                                      🔗 {answers.link}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div style={{
                              background: 'white',
                              padding: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {String(answers)}
                            </div>
                          );
                        }
                      })()}
                      
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#666', 
                        marginTop: '1rem',
                        borderTop: '1px solid #dee2e6',
                        paddingTop: '0.5rem'
                      }}>
                        Submitted: {new Date(selectedStudent.submission.createdAt).toLocaleString()}
                        {selectedStudent.submission.updatedAt !== selectedStudent.submission.createdAt && (
                          <span> • Updated: {new Date(selectedStudent.submission.updatedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Grading Section */}
                    <div style={{
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ margin: 0, color: '#495057' }}>Grading</h4>
                        
                        {/* AI Grade Button - only for text submissions */}
                        {(() => {
                          const answers = parseAnswers(selectedStudent.submission!.answers);
                          const hasTextContent = (typeof answers === 'object' && answers?.text) || 
                                               (typeof answers === 'string' && answers.trim());
                          
                          if (hasTextContent) {
                            return (
                              <button
                                onClick={runAIGrade}
                                disabled={aiLoading}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: aiLoading ? '#ccc' : '#6f42c1',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                {aiLoading ? (
                                  <>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>🤖</span>
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    🤖 AI Grade & Feedback
                                  </>
                                )}
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: '0 0 150px' }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                          }}>
                            Grade (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="0-100"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                          }}>
                            Feedback
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Enter feedback for the student..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={saveGrade}
                        disabled={grading}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: grading ? '#ccc' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: grading ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {grading ? 'Saving...' : 'Save Grade & Feedback'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6c757d'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <h4>No Submission</h4>
                    <p>This student hasn't submitted their work yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👆</div>
                <h4>Select a Student</h4>
                <p>Choose a student from the list to view their submission.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};