import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../state/authStore';

export const JoinClass: React.FC = () => {
  const { user } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const joinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await api.post('/api/classes/join', { code: joinCode.trim() });
      setResult(`✅ Successfully joined "${response.data.className}"`);
      setJoinCode('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setResult(`❌ ${err.response?.data?.error || 'Failed to join class'}`);
    }
    
    setLoading(false);
  };

  // Only show for students
  if (user?.role !== 'student') return null;

  return (
    <div style={{
      background: '#e8f4f8',
      border: '2px dashed #007bff',
      padding: '1.5rem',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#007bff' }}>🎓 Join a Class</h3>
      
      <form onSubmit={joinClass} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          placeholder="Enter join code (e.g., abc123)"
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid #007bff',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          disabled={loading || !joinCode.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: loading || !joinCode.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Joining...' : 'Join'}
        </button>
      </form>

      <small style={{ color: '#666' }}>
        Ask your teacher for the class join code
      </small>

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '4px',
          background: result.includes('❌') ? '#ffe6e6' : '#e6ffe6',
          color: result.includes('❌') ? '#cc0000' : '#006600',
          fontSize: '0.9rem'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};