import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface StudentGrade {
  student: Student;
  grade: number | null;
  feedback: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

interface AssignmentGradesData {
  assignment: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
  };
  className: string;
  studentGrades: StudentGrade[];
}

export const AssignmentGrades: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AssignmentGradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignmentGrades = async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/grades/assignment/${assignmentId}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignment grades');
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

  const calculateStats = () => {
    if (!data) return { average: null, submitted: 0, graded: 0, total: 0 };
    
    const grades = data.studentGrades
      .map(sg => sg.grade)
      .filter(g => g !== null) as number[];
    
    const average = grades.length > 0
      ? Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 10) / 10
      : null;
    
    return {
      average,
      submitted: data.studentGrades.filter(sg => sg.submitted).length,
      graded: grades.length,
      total: data.studentGrades.length
    };
  };

  useEffect(() => {
    loadAssignmentGrades();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="page">
        <h1>Loading assignment grades...</h1>
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

  const stats = calculateStats();

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
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            {data.assignment.title}
          </h1>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
            {data.className} • Individual Student Grades
          </div>
          {data.assignment.description && (
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              {data.assignment.description}
            </div>
          )}
          {data.assignment.dueDate && (
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              Due: {new Date(data.assignment.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {stats.average !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: getGradeColor(stats.average)
            }}>
              {stats.average}%
            </div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: getGradeColor(stats.average)
            }}>
              Class Average
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.submitted}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Submitted</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.graded}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Graded</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Total Students</div>
        </div>
        {stats.average !== null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: getGradeColor(stats.average) 
            }}>
              {getGradeLabel(stats.average)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Letter Grade</div>
          </div>
        )}
      </div>

      {/* Student Grades List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.studentGrades
          .sort((a, b) => {
            // Sort by: 1) submitted first, 2) graded first, 3) alphabetical by name
            if (a.submitted !== b.submitted) return b.submitted ? 1 : -1;
            if (a.grade !== null && b.grade === null) return -1;
            if (a.grade === null && b.grade !== null) return 1;
            return a.student.name.localeCompare(b.student.name);
          })
          .map(studentGrade => (
          <div
            key={studentGrade.student.id}
            style={{
              background: '#fff',
              border: '1px solid #e1e6ef',
              borderRadius: '8px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            {/* Student Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                {studentGrade.student.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {studentGrade.student.email}
              </div>
            </div>

            {/* Submission Status */}
            <div style={{ minWidth: '100px', textAlign: 'center' }}>
              {studentGrade.submitted ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 'bold' }}>
                    ✅ Submitted
                  </div>
                  {studentGrade.submittedAt && (
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>
                      {new Date(studentGrade.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#dc3545', fontWeight: 'bold' }}>
                  ❌ Not submitted
                </div>
              )}
            </div>

            {/* Grade */}
            <div style={{ minWidth: '120px', textAlign: 'center' }}>
              {studentGrade.grade !== null ? (
                <div>
                  <div style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: getGradeColor(studentGrade.grade)
                  }}>
                    {studentGrade.grade}%
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: getGradeColor(studentGrade.grade)
                  }}>
                    {getGradeLabel(studentGrade.grade)}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6c757d' }}>
                  <div style={{ fontSize: '1.3rem' }}>—</div>
                  <div style={{ fontSize: '0.8rem' }}>Not graded</div>
                </div>
              )}
            </div>

            {/* Feedback Indicator */}
            <div style={{ minWidth: '80px', textAlign: 'center' }}>
              {studentGrade.feedback ? (
                <div style={{ fontSize: '0.8rem', color: '#007bff' }}>
                  💬 Has feedback
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  No feedback
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.studentGrades.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3>No Students</h3>
          <p>No students are enrolled in this class.</p>
        </div>
      )}
    </div>
  );
};