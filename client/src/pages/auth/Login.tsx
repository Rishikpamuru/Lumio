import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/authStore';
import { AuthAPI } from '../../lib/api';
import logo from '../../assets/logo.jpg';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const data = await AuthAPI.login({ email, password });
      console.log('Login response:', data);
      login(data.user, data.token);
      console.log('Login successful, auth state updated');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <img src={logo} alt="Lumio Logo" className="logo-image large" />
        <h1>Lumio</h1>
        <p style={{ margin: 0, color:'#4b5875' }}>Login to your account</p>
        

        
        <form onSubmit={submit} className="form-col">
          <label>Username
            <input 
              required 
              type="text" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your username"
            />
          </label>
          <label>Password
            <input 
              required 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {error && <div style={{ color: '#ff6b6b', fontSize: '.75rem' }}>{error}</div>}
          <button disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        
       
        

      </div>
    </div>
  );
};
