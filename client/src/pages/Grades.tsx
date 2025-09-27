import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../state/authStore';

interface ClassGrade {
  classId: string;
  className: string;
  section?: string;
  average: number | null;
  totalAssignments?: number;
  gradedAssignments?: number;
  totalStudents?: number;
  totalGrades?: number;
}

interface GradesOverview {
  type: 'student' | 'teacher' | 'other';
  classes: ClassGrade[];
}

export const Grades: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<GradesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/grades/overview');
      setOverview(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const getAverageColor = (average: number | null) => {
    if (average === null) return '#6c757d';
    if (average >= 90) return '#28a745';
    if (average >= 80) return '#20c997';
    if (average >= 70) return '#ffc107';
    if (average >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getGradeLabel = (average: number | null) => {
    if (average === null) return 'No grades';
    if (average >= 97) return 'A+';
    if (average >= 93) return 'A';
    if (average >= 90) return 'A-';
    if (average >= 87) return 'B+';
    if (average >= 83) return 'B';
    if (average >= 80) return 'B-';
    if (average >= 77) return 'C+';
    if (average >= 73) return 'C';
    if (average >= 70) return 'C-';
    if (average >= 67) return 'D+';
    if (average >= 65) return 'D';
    return 'F';
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <h1>Grades</h1>
        <div>Loading grades...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Grades</h1>
        <button 
          onClick={loadOverview}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#ffe6e6',
          color: '#cc0000',
          borderRadius: '4px',
          border: '1px solid #ffcccc',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {overview && (
        <div>
          {overview.type === 'student' && (
            <div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Click on a class to view your individual assignment grades
              </p>
              
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {overview.classes.map(cls => (
                  <div
                    key={cls.classId}
                    onClick={() => navigate(`/grades/class/${cls.classId}`)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e1e6ef',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                          {cls.className}
                        </h3>
                        {cls.section && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Section: {cls.section}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: getAverageColor(cls.average)
                        }}>
                          {cls.average !== null ? `${cls.average}%` : '—'}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: getAverageColor(cls.average)
                        }}>
                          {getGradeLabel(cls.average)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {cls.gradedAssignments} of {cls.totalAssignments} assignments graded
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: '#007bff', marginTop: '0.5rem' }}>
                      Click to view assignment details →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview.type === 'teacher' && (
            <div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Class averages for your courses. Click on a class to see assignment breakdowns.
              </p>
              
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {overview.classes.map(cls => (
                  <div
                    key={cls.classId}
                    onClick={() => navigate(`/grades/class/${cls.classId}`)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e1e6ef',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                          {cls.className}
                        </h3>
                        {cls.section && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Section: {cls.section}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: getAverageColor(cls.average)
                        }}>
                          {cls.average !== null ? `${cls.average}%` : '—'}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: getAverageColor(cls.average)
                        }}>
                          {getGradeLabel(cls.average)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', color: '#666' }}>
                      <div>
                        👥 {cls.totalStudents} students
                      </div>
                      <div>
                        📝 {cls.totalAssignments} assignments
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        ✅ {cls.totalGrades} total grades recorded
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: '#007bff', marginTop: '0.5rem' }}>
                      Click to view assignment breakdowns →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview.classes.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6c757d'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3>No Grades Yet</h3>
              <p>
                {overview.type === 'student' 
                  ? 'You haven\'t received any grades yet. Check back after your teachers grade some assignments!'
                  : 'No classes with grades found. Create some assignments and start grading!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
