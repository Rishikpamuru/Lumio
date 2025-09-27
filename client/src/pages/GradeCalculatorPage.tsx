import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Assignment {
  id: string;
  title: string;
  currentGrade: number | null;
  hypotheticalGrade: number | null;
}

export const GradeCalculatorPage: React.FC = () => {
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
  const [calculationTimeout, setCalculationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadClasses();
    // Reset hypothetical assignments when component mounts
    setHypotheticalAssignments([]);
    setHypotheticalGrades({});
  }, []);

  useEffect(() => {
    // Clear existing timeout when class changes
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
      setCalculationTimeout(null);
    }
    
    // Reset hypothetical data when class changes
    setHypotheticalAssignments([]);
    setHypotheticalGrades({});
  }, [selectedClassId]);

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
    // Clear existing timeout
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }
    
    // Set new timeout for 5 seconds
    const timeout = setTimeout(() => {
      calculateGrades();
    }, 2000);
    
    setCalculationTimeout(timeout);
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
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
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🧮</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>Grade Calculator</h1>
              <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                Calculate your current grade and predict future outcomes
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {/* Class Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.75rem',
                border: '2px solid #e1e6ef',
                borderRadius: '8px',
                fontSize: '1rem',
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

          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              fontSize: '1.1rem',
              color: '#666'
            }}>
              <div>📊 Calculating grades...</div>
            </div>
          )}

          {selectedClassId && !loading && (
            <>
              {/* Grade Overview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '2rem',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.75rem' }}>
                    Current Grade
                  </div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(currentGrade)
                  }}>
                    {currentGrade.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(currentGrade),
                    marginTop: '0.5rem'
                  }}>
                    {getLetterGrade(currentGrade)}
                  </div>
                </div>

                <div style={{
                  padding: '2rem',
                  background: projectedGrade > currentGrade ? '#d4edda' : projectedGrade < currentGrade ? '#f8d7da' : '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.75rem' }}>
                    Projected Grade
                  </div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(projectedGrade)
                  }}>
                    {projectedGrade.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: getGradeColor(projectedGrade),
                    marginTop: '0.5rem'
                  }}>
                    {getLetterGrade(projectedGrade)}
                  </div>
                  {projectedGrade !== currentGrade && (
                    <div style={{
                      fontSize: '0.9rem',
                      color: projectedGrade > currentGrade ? '#155724' : '#721c24',
                      marginTop: '0.5rem'
                    }}>
                      {projectedGrade > currentGrade ? '↗️' : '↘️'} 
                      {Math.abs(projectedGrade - currentGrade).toFixed(1)} Point 
                      {projectedGrade > currentGrade ? ' Increase' : ' Decrease'}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignments List */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.3rem' }}>
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
                        padding: '1rem',
                        background: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1rem' }}>
                          {assignment.title}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {assignment.currentGrade !== null ? (
                          <div style={{ 
                            textAlign: 'center',
                            minWidth: '100px'
                          }}>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>Current</div>
                            <div style={{ 
                              fontWeight: 'bold',
                              color: getGradeColor(assignment.currentGrade),
                              fontSize: '1.1rem'
                            }}>
                              {assignment.currentGrade}%
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: 'center',
                            minWidth: '100px',
                            color: '#999'
                          }}>
                            <div style={{ fontSize: '0.85rem' }}>No Grade</div>
                          </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
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
                              width: '80px',
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'center',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Hypothetical Assignment */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.2rem' }}>
                    Add Hypothetical Assignment
                  </h4>
                  <div style={{
                    background: '#fff3cd',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    border: '2px solid #ffeaa7'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: '1.5rem',
                      alignItems: 'end'
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.75rem', 
                          fontSize: '1rem', 
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
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.75rem', 
                          fontSize: '1rem', 
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
                            fontSize: '1rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <button
                        onClick={addHypotheticalAssignment}
                        style={{
                          padding: '0.75rem 2rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '120px'
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
                      <h5 style={{ marginBottom: '0.75rem', color: '#333', fontSize: '1.1rem' }}>
                        Hypothetical Assignments:
                      </h5>
                      {hypotheticalAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: '#fff8e1',
                            border: '2px solid #ffcc02',
                            borderRadius: '8px',
                            marginBottom: '0.75rem'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '1rem' }}>
                              {assignment.name} (Hypothetical)
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#ef6c00' }}>
                              Grade: {assignment.grade}%
                            </div>
                          </div>
                          <button
                            onClick={() => removeHypotheticalAssignment(assignment.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
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
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: '#e3f2fd',
                  borderRadius: '8px',
                  fontSize: '1rem',
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