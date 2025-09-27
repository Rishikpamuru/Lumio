import React from 'react';
// Legacy dashboard retained; Home page now primary landing.
import { useAuthStore } from '../state/authStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome back {user?.name}. This is your overview.</p>
      <div className="grid tiles">
        <div className="tile">Classes<br /><strong>0</strong></div>
        <div className="tile">Assignments Due<br /><strong>0</strong></div>
        <div className="tile">Quizzes Pending<br /><strong>0</strong></div>
      </div>
    </div>
  );
};
