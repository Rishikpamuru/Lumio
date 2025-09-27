import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../state/authStore';

interface Assignment {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  average?: number | null;
  totalSubmissions?: number;
}

interface ClassGradesData {
  type: 'student' | 'teacher';
  className: string;
  section?: string;
  assignments: Assignment[];
}

export const ClassGrades: React.FC = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<ClassGradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClassGrades = async () => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/grades/class/${classId}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load class grades');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return '#6c757d';
    if (grade >= 90) return '#28a745';
    if (grade >= 80) return '#20c997';
    if (grade >= 70) return '#ffc107';
    if (grade >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return 'Not graded';
    if (grade >= 97) return 'A+';
    if (grade >= 93) return 'A';
    if (grade >= 90) return 'A-';
    if (grade >= 87) return 'B+';
    if (grade >= 83) return 'B';
    if (grade >= 80) return 'B-';
    if (grade >= 77) return 'C+';
    if (grade >= 73) return 'C';
    if (grade >= 70) return 'C-';
    if (grade >= 67) return 'D+';
    if (grade >= 65) return 'D';
    return 'F';
  };

  useEffect(() => {
    loadClassGrades();
  }, [classId]);

  if (loading) {
    return (
      <div className="page">
        <h1>Loading class grades...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Error</h1>
        <div style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => navigate('/grades')}>← Back to Grades</button>
      </div>
    );
  }

  if (!data) return null;

  const calculateOverallAverage = () => {
    if (data.type === 'student') {
      const grades = data.assignments
        .map(a => a.grade)
        .filter(g => g !== null && g !== undefined) as number[];
      
      if (grades.length === 0) return null;
      return Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 10) / 10;
    } else {
      const averages = data.assignments
        .map(a => a.average)
        .filter(avg => avg !== null && avg !== undefined) as number[];
      
      if (averages.length === 0) return null;
      return Math.round((averages.reduce((sum, avg) => sum + avg, 0) / averages.length) * 10) / 10;
    }
  };

  const overallAverage = calculateOverallAverage();

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/grades')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>
            {data.className}
          </h1>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
            {data.type === 'student' ? 'Your Grades' : 'Class Performance'}
          </div>
        </div>

        {overallAverage !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getGradeColor(overallAverage)
            }}>
              {overallAverage}%
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: getGradeColor(overallAverage)
            }}>
              {getGradeLabel(overallAverage)}
            </div>
          </div>
        )}
      </div>

      {data.assignments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3>No Assignments Yet</h3>
          <p>
            {data.type === 'student' 
              ? 'No assignments have been posted for this class yet.'
              : 'No assignments created for this class yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.assignments.map(assignment => (
            <div
              key={assignment.assignmentId}
              onClick={() => {
                if (data.type === 'teacher') {
                  navigate(`/grades/assignment/${assignment.assignmentId}`);
                }
              }}
              style={{
                background: '#fff',
                border: '1px solid #e1e6ef',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: data.type === 'teacher' ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (data.type === 'teacher') {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (data.type === 'teacher') {
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                    {assignment.title}
                  </h3>
                  
                  {assignment.description && (
                    <p style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: '#666', 
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}>
                      {assignment.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#666' }}>
                    {assignment.dueDate && (
                      <div>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                    )}
                    
                    {data.type === 'student' && assignment.submittedAt && (
                      <div>✅ Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}</div>
                    )}
                    
                    {data.type === 'teacher' && (
                      <div>📊 {assignment.totalSubmissions} submissions</div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  {data.type === 'student' ? (
                    <div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: getGradeColor(assignment.grade || null)
                      }}>
                        {assignment.grade !== null && assignment.grade !== undefined ? `${assignment.grade}%` : '—'}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: getGradeColor(assignment.grade || null)
                      }}>
                        {getGradeLabel(assignment.grade || null)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: getGradeColor(assignment.average || null)
                      }}>
                        {assignment.average !== null && assignment.average !== undefined ? `${assignment.average}%` : '—'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Class Average
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {data.type === 'student' && assignment.feedback && (
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Teacher Feedback:
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {assignment.feedback}
                  </div>
                </div>
              )}

              {data.type === 'teacher' && (
                <div style={{ fontSize: '0.75rem', color: '#007bff', marginTop: '0.5rem' }}>
                  Click to view individual student grades →
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};