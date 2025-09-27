import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Assignment {
  id: string;
  title: string;
  currentGrade: number | null;
  hypotheticalGrade: number | null;
}

interface GradeCalculatorProps {
  onClose: () => void;
}

export const GradeCalculator: React.FC<GradeCalculatorProps> = ({ onClose }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hypotheticalGrades, setHypotheticalGrades] = useState<{[key: string]: number}>({});
  const [currentGrade, setCurrentGrade] = useState<number>(0);
  const [projectedGrade, setProjectedGrade] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hypotheticalAssignments, setHypotheticalAssignments] = useState<Array<{id: string, name: string, grade: number}>>([]);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [newAssignmentGrade, setNewAssignmentGrade] = useState<number | string>('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const result = await api.get('/api/classes');
      setClasses(result.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const calculateGrades = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      const result = await api.post('/api/ai-assistant/calculate-grade', {
        classId: selectedClassId,
        hypotheticalGrades,
        hypotheticalAssignments
      });

      setCurrentGrade(result.data.currentGrade);
      setProjectedGrade(result.data.projectedGrade);
      setAssignments(result.data.assignments);
    } catch (error) {
      console.error('Failed to calculate grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      calculateGrades();
    }
  }, [selectedClassId]);

  useEffect(() => {
    calculateGrades();
  }, [hypotheticalGrades, hypotheticalAssignments]);

  const handleGradeChange = (assignmentId: string, grade: string) => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) {
      const newGrades = { ...hypotheticalGrades };
      delete newGrades[assignmentId];
      setHypotheticalGrades(newGrades);
    } else {
      setHypotheticalGrades(prev => ({
        ...prev,
        [assignmentId]: Math.max(0, Math.min(100, numGrade))
      }));
    }
  };

  const getLetterGrade = (grade: number) => {
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
    if (grade >= 63) return 'D';
    if (grade >= 60) return 'D-';
    return 'F';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return '#28a745';
    if (grade >= 80) return '#17a2b8';
    if (grade >= 70) return '#ffc107';
    if (grade >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const addHypotheticalAssignment = () => {
    if (!newAssignmentName.trim() || !newAssignmentGrade) {
      alert('Please fill in assignment name and grade');
      return;
    }

    const grade = parseFloat(newAssignmentGrade.toString());

    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert('Please enter a valid grade (0-100)');
      return;
    }

    const newAssignment = {
      id: `hyp_${Date.now()}`,
      name: newAssignmentName.trim(),
      grade
    };

    setHypotheticalAssignments(prev => [...prev, newAssignment]);
    setNewAssignmentName('');
    setNewAssignmentGrade('');
    
    // Add to hypothetical grades for calculation
    setHypotheticalGrades(prev => ({
      ...prev,
      [newAssignment.id]: grade
    }));
  };

  const removeHypotheticalAssignment = (assignmentId: string) => {
    setHypotheticalAssignments(prev => prev.filter(a => a.id !== assignmentId));
    const newGrades = { ...hypotheticalGrades };
    delete newGrades[assignmentId];
    setHypotheticalGrades(newGrades);
  };

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
        borderRadius: '12px',
        width: '95%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e1e6ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🧮</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Grade Calculator</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Calculate your current grade and predict future outcomes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* Class Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Select Class:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: 'white'
              }}
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClassId && (
            <>
              {/* Grade Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    Current Grade
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(currentGrade)
                  }}>
                    {currentGrade.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(currentGrade),
                    marginTop: '0.25rem'
                  }}>
                    {getLetterGrade(currentGrade)}
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  background: projectedGrade > currentGrade ? '#d4edda' : projectedGrade < currentGrade ? '#f8d7da' : '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    Projected Grade
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(projectedGrade)
                  }}>
                    {projectedGrade.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(projectedGrade),
                    marginTop: '0.25rem'
                  }}>
                    {getLetterGrade(projectedGrade)}
                  </div>
                  {projectedGrade !== currentGrade && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: projectedGrade > currentGrade ? '#155724' : '#721c24',
                      marginTop: '0.5rem'
                    }}>
                      {projectedGrade > currentGrade ? '↑' : '↓'} 
                      {Math.abs(projectedGrade - currentGrade).toFixed(1)} points
                    </div>
                  )}
                </div>
              </div>

              {/* Assignments List */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                  Assignment Grades
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {assignment.title}
                        </div>

                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {assignment.currentGrade !== null ? (
                          <div style={{ 
                            textAlign: 'center',
                            minWidth: '80px'
                          }}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Current</div>
                            <div style={{ 
                              fontWeight: 'bold',
                              color: getGradeColor(assignment.currentGrade)
                            }}>
                              {assignment.currentGrade}%
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: 'center',
                            minWidth: '80px',
                            color: '#999'
                          }}>
                            <div style={{ fontSize: '0.8rem' }}>No Grade</div>
                          </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                            What if?
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder={assignment.currentGrade !== null ? assignment.currentGrade.toString() : "85"}
                            value={hypotheticalGrades[assignment.id] || ''}
                            onChange={(e) => handleGradeChange(assignment.id, e.target.value)}
                            style={{
                              width: '70px',
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'center',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Hypothetical Assignment */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#333' }}>
                    Add Hypothetical Assignment
                  </h4>
                  <div style={{
                    background: '#fff3cd',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: '1rem',
                      alignItems: 'end'
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold',
                          color: '#856404'
                        }}>
                          Assignment Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Final Exam"
                          value={newAssignmentName}
                          onChange={(e) => setNewAssignmentName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold',
                          color: '#856404'
                        }}>
                          Expected Grade (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="85"
                          value={newAssignmentGrade}
                          onChange={(e) => setNewAssignmentGrade(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>



                      <button
                        onClick={addHypotheticalAssignment}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '100px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#218838';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#28a745';
                        }}
                      >
                        ➕ Add
                      </button>
                    </div>
                  </div>

                  {/* Display Hypothetical Assignments */}
                  {hypotheticalAssignments.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h5 style={{ marginBottom: '0.5rem', color: '#333' }}>
                        Hypothetical Assignments:
                      </h5>
                      {hypotheticalAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: '#fff8e1',
                            border: '1px solid #ffcc02',
                            borderRadius: '6px',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#f57c00' }}>
                              {assignment.name} (Hypothetical)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#ef6c00' }}>
                              Grade: {assignment.grade}%
                            </div>
                          </div>
                          <button
                            onClick={() => removeHypotheticalAssignment(assignment.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            ✖️ Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#e3f2fd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#1565c0'
                }}>
                  <strong>💡 Tip:</strong> Enter hypothetical grades in the "What if?" column to see how they would affect your overall grade. Add hypothetical assignments to plan for future work and see what scores you need to reach your target grade.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};