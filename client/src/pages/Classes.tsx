import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassAPI } from '../lib/api';
import { useAuthStore } from '../state/authStore';
import { JoinClass } from '../components/JoinClass';

interface ClassRec { id: string; name: string; joinCode?: string; }

export const Classes: React.FC = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassRec[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<string|null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try { const data = await ClassAPI.list(); setClasses(data); } catch (e: any) { setError(e.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await ClassAPI.create({ name: newName });
      setNewName(''); setCreateOpen(false);
      load(); 
    } catch(e:any){ 
      setError(e.response?.data?.error || 'Create failed'); 
    }
  };

  const deleteClass = async (classId: string, className: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!confirm(`Are you sure you want to delete "${className}"? This will permanently remove the class and all its assignments, submissions, and enrollments.`)) {
      return;
    }
    
    try {
      await ClassAPI.delete(classId);
      setError(null);
      load(); // Refresh the class list
    } catch(e: any) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className='page'>
      <h1>Classes</h1>
      {error && <div style={{ color:'red', fontSize:'.75rem' }}>{error}</div>}
      
      {/* Student Join Class Component */}
      <JoinClass />
      
      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}>
        {user?.role === 'teacher' && <button 
          onClick={() => setCreateOpen(o=>!o)}
          className="btn-primary"
        >
          {createOpen ? 'Cancel' : 'New Class'}
        </button>}
        <button 
          onClick={load} 
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
      
      {createOpen && user?.role === 'teacher' && (
        <form onSubmit={createClass} className="form-col" style={{ maxWidth:400, marginBottom:'1rem' }}>
          <label>Name<input required value={newName} onChange={e=>setNewName(e.target.value)} /></label>
          <button>Create</button>
        </form>
      )}
      
      <div className="grid tiles" style={{ marginTop:'1rem' }}>
        {classes.map(c => (
          <div key={c.id} className="tile" style={{cursor:'pointer', position:'relative'}} onClick={()=>navigate(`/classes/${c.id}`)}>
            <strong style={{ fontSize:'1rem' }}>{c.name}</strong>
            {user?.role === 'teacher' && c.joinCode && <div style={{ fontSize:'.6rem', marginTop:'.5rem', color:'#c7b8ff' }}>Code: {c.joinCode}</div>}
            {user?.role === 'teacher' && (
              <button
                onClick={(e) => deleteClass(c.id, c.name, e)}
                className="btn-primary"
                style={{ 
                  position: 'absolute', 
                  top: '0.5rem', 
                  right: '0.5rem', 
                  fontSize: '0.7rem', 
                  padding: '0.3rem 0.5rem',
                  background: '#dc3545',
                  border: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                title={`Delete ${c.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};