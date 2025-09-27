import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../state/authStore';
import { AssignmentCreator } from '../components/AssignmentCreator';
import { SubmissionViewer } from '../components/SubmissionViewer';

interface Assignment { id:string; title:string; dueDate?:string }
interface ClassRec { id:string; name:string; joinCode?:string; teacher?: { name:string; id:string } }
interface Student { id:string; name:string; email:string }
interface AvailableStudent { id:string; name:string; email:string }

export const ClassDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [cls, setCls] = useState<ClassRec|null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showAssignmentCreator, setShowAssignmentCreator] = useState(false);
  
  // Assignment submission states
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<any|null>(null);
  const [myAnswer, setMyAnswer] = useState('');
  const [myLink, setMyLink] = useState('');
  const [submissionChoice, setSubmissionChoice] = useState<'text' | 'link'>('text');
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Submission viewer states
  const [showSubmissionViewer, setShowSubmissionViewer] = useState(false);
  const [selectedAssignmentForViewing, setSelectedAssignmentForViewing] = useState<string | null>(null);
  
  const isTeacher = user?.role === 'teacher';

  const load = async () => {
    if (!id) return; setLoading(true); setError(null);
    try {
      // Use dedicated detail endpoint for teacher name + conditional joinCode.
      const detail = await api.get(`/api/classes/${id}`);
      setCls(detail.data);
      const a = await api.get(`/api/assignments/class/${id}`); setAssignments(a.data||[]);
      
      // Load students if teacher
      if (isTeacher) {
        try {
          const studentsRes = await api.get(`/api/classes/${id}/students`);
          setStudents(studentsRes.data || []);
        } catch (e) {
          console.log('Failed to load students');
        }
      }
    } catch(e:any){ setError(e.response?.data?.error || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const loadAvailableStudents = async () => {
    try {
      const res = await api.get('/api/classes/students/available');
      setAvailableStudents(res.data || []);
    } catch (e) {
      console.log('Failed to load available students');
    }
  };

  const addStudentToClass = async () => {
    if (!selectedStudentId) return;
    try {
      await api.post(`/api/classes/${id}/students`, { studentId: selectedStudentId });
      setShowAddStudent(false);
      setSelectedStudentId('');
      load(); // Refresh
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to add student');
    }
  };

  const removeStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this class?`)) return;
    try {
      await api.delete(`/api/classes/${id}/students/${studentId}`);
      load(); // Refresh
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to remove student');
    }
  };

  // Assignment submission functions
  const openSubmit = async (a: Assignment) => {
    setActiveAssignmentForSubmit(a); 
    setMySubmission(null); 
    setMyAnswer('');
    setMyLink('');
    if (user?.role === 'student') {
      try { 
        const resp = await api.get(`/api/submissions/assignment/${a.id}`); 
        setMySubmission(resp.data); 
        const answers = resp.data?.answers;
        setMyAnswer(answers?.text || ''); 
        setMyLink(answers?.link || '');
      } catch { 
        // ignore 404 - no existing submission
      }
    }
  };

  const submitWork = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!activeAssignmentForSubmit) return; 
    setSubmitLoading(true);
    try {
      const answers: any = {};
      const assignment = activeAssignmentForSubmit as any; // Type assertion for submissionType
      
      if (assignment.submissionType === 'text' || assignment.submissionType === 'both') {
        if (submissionChoice === 'text' || assignment.submissionType === 'text') {
          answers.text = myAnswer;
        }
      }
      if (assignment.submissionType === 'link' || assignment.submissionType === 'both') {
        if (submissionChoice === 'link' || assignment.submissionType === 'link') {
          answers.link = myLink;
        }
      }
      
      const resp = await api.post(`/api/submissions/assignment/${activeAssignmentForSubmit.id}`, { answers });
      setMySubmission(resp.data);
      setActiveAssignmentForSubmit(null); // Close the submission form
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit');
    } finally { 
      setSubmitLoading(false); 
    }
  };

  const viewSubmissions = (assignmentId: string) => {
    setSelectedAssignmentForViewing(assignmentId);
    setShowSubmissionViewer(true);
  };

  useEffect(()=>{ load(); }, [id]);



  const teacherView = isTeacher && (
    <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* Prominent join code banner */}
      {cls?.joinCode && (
        <div style={{
          background:'#1f2a3a',
          color:'#fff',
          padding:'1.75rem 1rem',
          borderRadius:16,
          textAlign:'center',
          boxShadow:'0 4px 14px rgba(0,0,0,.08)',
          letterSpacing:'1px'
        }}>
          <div style={{fontSize:'.65rem', textTransform:'uppercase', opacity:.7, marginBottom:'.4rem'}}>Class Join Code</div>
          <div style={{fontSize:'2.6rem', fontWeight:600, fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'}}>{cls.joinCode}</div>
        </div>
      )}
      {/* Create Content Button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowAssignmentCreator(true)}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,123,255,0.2)'
          }}
        >
          + Create Assignment
        </button>
      </div>

      <div style={{display:'grid', gap:'2rem', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))'}}>
        <section>
          <h3 style={{margin:'0 0 .6rem 0', fontSize:'1rem'}}>Assignments ({assignments.length})</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'.45rem'}}>
            {assignments.map(a => (
              <div key={a.id} style={{
                background:'#fff', 
                border:'1px solid #e1e6ef', 
                padding:'.8rem', 
                borderRadius:8, 
                fontSize:'.8rem'
              }}>
                <div style={{fontWeight:600, color:'#1d2433'}}>{a.title}</div>
                {a.dueDate && (
                  <div style={{fontSize:'.7rem', color:'#666', marginTop:'.25rem'}}>
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div style={{marginTop:'.5rem'}}>
                  <button 
                    onClick={() => viewSubmissions(a.id)}
                    style={{
                      background:'#007bff',
                      color:'white',
                      border:'none',
                      padding:'0.4rem 0.8rem',
                      borderRadius:4,
                      fontSize:'0.7rem',
                      cursor:'pointer'
                    }}
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div style={{
                fontSize:'.75rem', 
                color:'#5d6b85',
                textAlign:'center',
                padding:'2rem 1rem',
                background:'#f9f9f9',
                borderRadius:'8px',
                border:'2px dashed #ddd'
              }}>
                No assignments created yet
              </div>
            )}
          </div>
        </section>

        {/* Student Management Section */}
        <section style={{background:'#fff', border:'1px solid #e1e6ef', padding:'1.2rem', borderRadius:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3 style={{margin:0, fontSize:'.85rem', color:'#384860'}}>Students ({students.length})</h3>
            <div style={{display:'flex', gap:'0.5rem'}}>
              <button 
                onClick={() => {
                  setShowAddStudent(!showAddStudent);
                  if (!showAddStudent) loadAvailableStudents();
                }}
                style={{
                  background:'#007bff', 
                  color:'white', 
                  border:'none', 
                  padding:'0.5rem 0.75rem', 
                  borderRadius:6, 
                  fontSize:'0.7rem',
                  cursor:'pointer'
                }}
              >
                {showAddStudent ? 'Cancel' : 'Add Student'}
              </button>
            </div>
          </div>

          {/* Add Student Form */}
          {showAddStudent && (
            <div style={{
              background:'#f8f9fa', 
              padding:'1rem', 
              borderRadius:8, 
              marginBottom:'1rem',
              border:'1px solid #e9ecef'
            }}>
              <h4 style={{margin:'0 0 0.5rem 0', fontSize:'0.8rem'}}>Add Student to Class</h4>
              <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                <select 
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  style={{flex:1, padding:'0.5rem', borderRadius:4, border:'1px solid #ccc'}}
                >
                  <option value="">Select a student...</option>
                  {availableStudents
                    .filter(s => !students.some(enrolled => enrolled.id === s.id))
                    .map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))
                  }
                </select>
                <button 
                  onClick={addStudentToClass}
                  disabled={!selectedStudentId}
                  style={{
                    background:'#28a745', 
                    color:'white', 
                    border:'none', 
                    padding:'0.5rem 1rem', 
                    borderRadius:4,
                    cursor: selectedStudentId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Students List */}
          <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
            {students.length === 0 ? (
              <div style={{fontSize:'0.7rem', color:'#5d6b85', fontStyle:'italic'}}>
                No students enrolled. Students can join with code "{cls?.joinCode}" or you can add them above.
              </div>
            ) : (
              students.map(student => (
                <div key={student.id} style={{
                  display:'flex', 
                  justifyContent:'space-between', 
                  alignItems:'center',
                  background:'#f8f9fa', 
                  border:'1px solid #e9ecef', 
                  padding:'0.75rem', 
                  borderRadius:6,
                  fontSize:'0.8rem'
                }}>
                  <span>
                    <strong>{student.name}</strong> ({student.email})
                  </span>
                  <button 
                    onClick={() => removeStudent(student.id, student.name)}
                    style={{
                      background:'#dc3545', 
                      color:'white', 
                      border:'none', 
                      padding:'0.25rem 0.5rem', 
                      borderRadius:3,
                      fontSize:'0.7rem',
                      cursor:'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const studentView = !isTeacher && (
    <div style={{display:'flex', flexDirection:'column', gap:'2rem'}}>
      <div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
        <h3 style={{margin:0, fontSize:'1rem'}}>Assignments</h3>
        <div style={{display:'flex', flexDirection:'column', gap:'.45rem'}}>
          {assignments.map(a => (
            <div key={a.id} style={{
              background:'#fff', 
              border:'1px solid #e1e6ef', 
              padding:'.7rem', 
              borderRadius:8, 
              fontSize:'.7rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => openSubmit(a)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '.25rem' }}>{a.title}</div>
              {a.dueDate && (
                <div style={{ fontSize: '.6rem', color: '#666' }}>
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </div>
              )}
              <div style={{ fontSize: '.6rem', color: '#007bff', marginTop: '.25rem' }}>
                Click to submit →
              </div>
            </div>
          ))}
          {assignments.length === 0 && <div style={{fontSize:'.6rem', color:'#5d6b85'}}>No assignments posted.</div>}
        </div>
      </div>

    </div>
  );

  return (
    <div className='page'>
      <div style={{display:'flex', alignItems:'baseline', gap:'.75rem', flexWrap:'wrap'}}>
        <h1 style={{marginTop:0}}>{cls ? cls.name : 'Class'}</h1>
        {!isTeacher && cls?.teacher?.name && <div style={{fontSize:'.65rem', color:'#5d6b85'}}>Teacher: <strong style={{color:'#384860'}}>{cls.teacher.name}</strong></div>}
      </div>
      {error && <div style={{color:'#c33131', fontSize:'.75rem'}}>{error}</div>}
      {isTeacher ? teacherView : studentView}
      {loading && <div style={{marginTop:'1rem', fontSize:'.65rem'}}>Loading...</div>}
      
      {/* Assignment Submission Modal */}
      {activeAssignmentForSubmit && user?.role === 'student' && (
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
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Submit: {activeAssignmentForSubmit.title}</h3>
              <button
                onClick={() => setActiveAssignmentForSubmit(null)}
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

            <form onSubmit={submitWork} className="form-col" style={{ gap: '1rem' }}>
              {/* Submission type choice for 'both' */}
              {(activeAssignmentForSubmit as any).submissionType === 'both' && (
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                    Choose submission method:
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="submissionChoice"
                        value="text"
                        checked={submissionChoice === 'text'}
                        onChange={(e) => setSubmissionChoice(e.target.value as 'text' | 'link')}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Text Answer
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="submissionChoice"
                        value="link"
                        checked={submissionChoice === 'link'}
                        onChange={(e) => setSubmissionChoice(e.target.value as 'text' | 'link')}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Link/URL
                    </label>
                  </div>
                </div>
              )}

              {/* Text submission field */}
              {((activeAssignmentForSubmit as any).submissionType === 'text' || 
                ((activeAssignmentForSubmit as any).submissionType === 'both' && submissionChoice === 'text')) && (
                <label>Answer / Text Response
                  <textarea 
                    value={myAnswer} 
                    onChange={e=>setMyAnswer(e.target.value)} 
                    placeholder="Enter your written response here..."
                    style={{ 
                      background:'#f9f9f9', 
                      border:'1px solid #ddd', 
                      color:'#333', 
                      padding:'.6rem .7rem', 
                      borderRadius:6, 
                      resize:'vertical', 
                      minHeight:120,
                      width: '100%'
                    }} 
                    required={(activeAssignmentForSubmit as any).submissionType === 'text' || submissionChoice === 'text'}
                  />
                </label>
              )}

              {/* Link submission field */}
              {((activeAssignmentForSubmit as any).submissionType === 'link' || 
                ((activeAssignmentForSubmit as any).submissionType === 'both' && submissionChoice === 'link')) && (
                <label>Submission Link/URL
                  <input 
                    type="url"
                    value={myLink} 
                    onChange={e=>setMyLink(e.target.value)} 
                    placeholder="https://example.com/your-work"
                    style={{ 
                      background:'#f9f9f9', 
                      border:'1px solid #ddd', 
                      color:'#333', 
                      padding:'.6rem .7rem', 
                      borderRadius:6,
                      width: '100%'
                    }} 
                    required={(activeAssignmentForSubmit as any).submissionType === 'link' || submissionChoice === 'link'}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                    Provide a link to your work (Google Docs, GitHub, portfolio, etc.)
                  </p>
                </label>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setActiveAssignmentForSubmit(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: submitLoading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {submitLoading ? 'Submitting...' : (mySubmission ? 'Resubmit' : 'Submit')}
                </button>
              </div>

              {mySubmission && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#e8f4f8', 
                  border: '1px solid #b8dce8', 
                  borderRadius: 6, 
                  color: '#2c3e50',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Previous Submission:</div>
                  <div>Submitted: {new Date(mySubmission.createdAt).toLocaleString()}</div>
                  {mySubmission.grade !== null && mySubmission.grade !== undefined && (
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      color: mySubmission.grade >= 70 ? '#28a745' : '#dc3545',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      Grade: {mySubmission.grade}%
                    </div>
                  )}
                  {mySubmission.feedback && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Feedback:</strong><br />
                      <div style={{
                        marginTop: '0.25rem',
                        padding: '0.5rem',
                        background: 'white',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {mySubmission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Submission Viewer Modal */}
      {showSubmissionViewer && selectedAssignmentForViewing && (
        <SubmissionViewer 
          assignmentId={selectedAssignmentForViewing}
          onClose={() => {
            setShowSubmissionViewer(false);
            setSelectedAssignmentForViewing(null);
          }}
        />
      )}

      {/* Assignment Creator Modal */}
      {showAssignmentCreator && (
        <AssignmentCreator
          classId={id!}
          onClose={() => setShowAssignmentCreator(false)}
          onSuccess={() => load()}
        />
      )}
    </div>
  );
};