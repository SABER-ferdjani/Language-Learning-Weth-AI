import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/learn');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إنشاء الحساب');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <h2 className="auth-title">إنشاء حساب جديد</h2>
        <p className="auth-subtitle">ابدأ رحلتك في إتقان اللغة الإنجليزية.</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="الاسم الكامل" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength="6"
            />
          </div>
          
          <button type="submit" className="btn-primary w-full">تسجيل</button>
        </form>
        
        <div className="auth-footer">
          <span>لديك حساب بالفعل؟</span>
          <Link to="/login" className="auth-link">تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
