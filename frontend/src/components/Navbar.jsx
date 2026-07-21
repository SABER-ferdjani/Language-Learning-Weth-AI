import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, BookOpen, Clock } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/learn" className="logo">
            <span className="logo-text">تعلم الإنجليزية بذكاء</span>
          </Link>
        </div>

        <div className="navbar-links">
          <Link to="/learn" className="nav-link">
            <BookOpen size={18} />
            <span>التعلم</span>
          </Link>
          <Link to="/history" className="nav-link">
            <Clock size={18} />
            <span>التقدم</span>
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="cefr-badge">{user.currentLevel}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="تسجيل الخروج">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
