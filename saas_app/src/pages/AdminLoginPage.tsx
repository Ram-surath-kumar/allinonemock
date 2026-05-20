import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { ShieldAlert, Lock, Info } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@schoolsphere.ai');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { login } = useExam();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@schoolsphere.ai' && password === 'admin123') {
      login(email, 'SUPERADMIN');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin credentials. Use the preset demo keys.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel-elevated" style={{ padding: '40px', width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'rgba(245, 158, 11, 0.15)', 
            padding: '12px', 
            borderRadius: '50%',
            marginBottom: '16px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: 'var(--accent-amber)'
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Sovereign Admin Panel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Isolated credential access point</p>
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-rose)', color: 'var(--accent-rose)', display: 'flex', gap: '8px', fontSize: '0.85rem', marginBottom: '20px', background: 'rgba(244, 63, 94, 0.05)' }}>
            <Lock size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Admin Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Access Security Code</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Demo Keys:<br/><strong>Email:</strong> admin@schoolsphere.ai<br/><strong>Password:</strong> admin123</span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Verify Cryptographic Signature
          </button>
        </form>
      </div>
    </div>
  );
};
