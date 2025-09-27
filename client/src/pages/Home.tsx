import React from 'react';
import { useAuthStore } from '../state/authStore';
import { DevAdminPanel } from '../components/DevAdminPanel';

export const Home: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="page">
      <h1>Welcome to Lumio</h1>
      <p>Hello, {user?.name}! You are logged in as a {user?.role}.</p>
      
      <div style={{marginTop:'2rem', padding:'1.5rem', background:'#f8f9fa', borderRadius:'8px', border:'1px solid #e9ecef'}}>
        <h3 style={{margin:'0 0 1rem 0', color:'#495057'}}>Getting Started</h3>
        {user?.role === 'teacher' && (
          <ul style={{margin:0, paddingLeft:'1.5rem', color:'#6c757d'}}>
            <li>Create and manage your classes</li>
            <li>Create assignments for your students</li>
            <li>Review student submissions and provide grades</li>
            <li>View class performance analytics</li>
          </ul>
        )}
        {user?.role === 'student' && (
          <ul style={{margin:0, paddingLeft:'1.5rem', color:'#6c757d'}}>
            <li>Join classes using class codes</li>
            <li>View and submit assignments</li>
            <li>Check your grades and feedback</li>
            <li>Track your academic progress</li>
          </ul>
        )}
        {user?.role === 'admin' && (
          <ul style={{margin:0, paddingLeft:'1.5rem', color:'#6c757d'}}>
            <li>Manage users and system settings</li>
            <li>Monitor platform usage</li>
            <li>Create teacher and student accounts</li>
          </ul>
        )}
      </div>
      
      {user?.role === 'admin' && <DevAdminPanel />}
    </div>
  );
};
