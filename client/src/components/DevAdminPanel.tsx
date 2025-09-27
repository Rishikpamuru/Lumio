import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CreatedUser {
  user: User;
  password: string;
}

export const DevAdminPanel: React.FC = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/api/auth/admin/users');
      // Ensure we always have an array
      const userData = Array.isArray(response.data) ? response.data : [];
      setUsers(userData);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]); // Set empty array on error
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);
    try {
            const response = await api.post('/api/auth/admin/create-user', { name, role });
      const data: CreatedUser = response.data;
      
      setResult(`✅ User created: ${data.user.email} / Password: ${data.password}`);
      setName('');
      await loadUsers(); // Refresh list
    } catch (err: any) {
      setResult(`❌ ${err.response?.data?.error || 'Error creating user'}`);
    }
    setLoading(false);
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/api/auth/admin/users/${userId}`);
      setResult(`✅ User "${userName}" deleted`);
      await loadUsers(); // Refresh list
    } catch (err: any) {
      setResult(`❌ ${err.response?.data?.error || 'Error deleting user'}`);
    }
  };

  const getDemoUsers = () => (Array.isArray(users) ? users.filter(u => ['1', '2', '3'].includes(u.id)) : []);
  const getCreatedUsers = () => (Array.isArray(users) ? users.filter(u => !['1', '2', '3'].includes(u.id)) : []);

  return (
    <div style={{ 
      border: '2px dashed #666', 
      padding: '1.5rem', 
      borderRadius: '8px', 
      margin: '1rem 0',
      background: '#f8f9fa'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>👑 Admin Panel - User Management</h3>
      
      {/* Create User Section */}
      <div style={{ 
        background: 'white', 
        padding: '1rem', 
        borderRadius: '6px', 
        marginBottom: '1rem',
        border: '1px solid #ddd'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Create New User</h4>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Full Name" 
            style={{ flex: 1, padding: '0.5rem' }}
            onKeyPress={e => e.key === 'Enter' && createUser()}
          />
          <select 
            value={role} 
            onChange={e => setRole(e.target.value as 'teacher' | 'student')}
            style={{ padding: '0.5rem' }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button 
            onClick={createUser} 
            disabled={loading || !name.trim()}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '...' : 'Create'}
          </button>
        </div>
        <small style={{ color: '#666' }}>
          Creates user with 8-digit ID and random password
        </small>
      </div>

      {/* Result Message */}
      {result && (
        <div style={{ 
          padding: '0.75rem', 
          margin: '0.5rem 0', 
          borderRadius: '4px',
          background: result.includes('❌') ? '#ffe6e6' : '#e6ffe6',
          color: result.includes('❌') ? '#cc0000' : '#006600',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}>
          {result}
        </div>
      )}

      {/* Users List */}
      <div style={{ 
        background: 'white', 
        padding: '1rem', 
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0 }}>All Users</h4>
          <button 
            onClick={loadUsers}
            disabled={loadingUsers}
            style={{ 
              padding: '0.25rem 0.5rem', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              fontSize: '0.8rem'
            }}
          >
            {loadingUsers ? '⟳' : '↻'}
          </button>
        </div>
        
        {/* Demo Users */}
        <div style={{ marginBottom: '1rem' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Demo Users (Cannot Delete)</h5>
          {getDemoUsers().map(user => (
            <div key={user.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem',
              background: '#f8f9fa',
              marginBottom: '0.25rem',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              <span>
                <strong>{user.name}</strong> ({user.email}) - {user.role}
              </span>
              <span style={{ color: '#999', fontSize: '0.8rem' }}>Protected</span>
            </div>
          ))}
        </div>

        {/* Created Users */}
        <div>
          <h5 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
            Created Users ({getCreatedUsers().length})
          </h5>
          {getCreatedUsers().length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic', margin: '0.5rem 0' }}>
              No users created yet. Create some users above!
            </p>
          ) : (
            getCreatedUsers().map(user => (
              <div key={user.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.5rem',
                background: '#fff',
                marginBottom: '0.25rem',
                borderRadius: '4px',
                border: '1px solid #eee',
                fontSize: '0.9rem'
              }}>
                <span>
                  <strong>{user.name}</strong> ({user.email}) - {user.role}
                </span>
                <button 
                  onClick={() => deleteUser(user.id, user.name)}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};