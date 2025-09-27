import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../state/authStore';
import './Sidebar.css';
import logo from '../../assets/logo.jpg';

// Matte white stroke icon set (24x24 viewbox, stroke only)
const iconProps = { width: 20, height: 20, stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const ClassesIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M4 6h10v12H4z" />
    <path d="M14 8h6v10h-6" />
    <path d="M8 10h2M8 14h2" />
  </svg>
);

const AssignmentIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M6 4h9l3 3v13H6z" />
    <path d="M10 4v4h5" />
    <path d="M8 12h6M8 16h4" />
  </svg>
);

const GradesIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M4 20h16" />
    <path d="M7 16v-5" />
    <path d="M11 16V8" />
    <path d="M15 16v-7" />
    <path d="M19 16v-3" />
  </svg>
);

const AIIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const CalculatorIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M8 6h8M8 10h8M8 14h2M8 18h2M14 14h2M14 18h2" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M9 6V4h10v16H9v-2" />
    <path d="M13 12H3" />
    <path d="M6 9 3 12l3 3" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const { user, logout, adminSession, returnToAdmin } = useAuthStore();
  
  if (!user) return null;
  const isTeacher = user.role === 'teacher';
  const isStudent = user.role === 'student';
  
  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="Lumio Logo" className="logo-image" />
          <span className="logo-text">Lumio</span>
        </div>
        <nav>
          <NavLink to="/" end title="Home"><span className="icon"><HomeIcon /></span><span className="lbl">Home</span></NavLink>
          <NavLink to="/classes" title="Classes"><span className="icon"><ClassesIcon /></span><span className="lbl">Classes</span></NavLink>
          <NavLink to="/assignments" title="Assignments"><span className="icon"><AssignmentIcon /></span><span className="lbl">Assign</span></NavLink>
          <NavLink to="/grades" title="Grades"><span className="icon"><GradesIcon /></span><span className="lbl">Grades</span></NavLink>
          
          <NavLink to="/ai-assistant" title="AI Assistant">
            <span className="icon"><AIIcon /></span>
            <span className="lbl">AI Help</span>
          </NavLink>
          
          {isStudent && (
            <NavLink to="/grade-calculator" title="Grade Calculator">
              <span className="icon"><CalculatorIcon /></span>
              <span className="lbl">Calculator</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-role">{user.name} • {user.role}{adminSession && user.role !== 'admin' && ' (impersonating)'}</div>
          {adminSession && user.role !== 'admin' && (
            <button onClick={returnToAdmin}>Return Admin</button>
          )}
          <button className="logout-btn" onClick={logout} title="Logout">
            <span className="icon"><LogoutIcon /></span>
            <span className="lbl">Logout</span>
          </button>
        </div>
      </aside>
      

    </>
  );
};
