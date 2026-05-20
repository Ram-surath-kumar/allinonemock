import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ 
      background: 'var(--bg-dark)', 
      borderTop: '1px solid var(--border)', 
      padding: '48px 0 24px 0', 
      marginTop: 'auto',
      fontSize: '0.9rem'
    }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
              <GraduationCap style={{ color: 'var(--primary)' }} size={28} />
              <span className="gradient-text-accent">SchoolSphere AI</span>
            </div>
            <p style={{ maxWidth: '320px', fontSize: '0.85rem' }}>
              Next-generation assessment engine mapping telemetry, speed traps, and fatigue profiles to maximize exam potential.
            </p>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Mocks</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>CAT Premium</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>XAT Intensive</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>GMAT Adaptive</a></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Engine Tech</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ color: 'var(--text-secondary)' }}>Velocity Vectoring</li>
              <li style={{ color: 'var(--text-secondary)' }}>Fatigue Modeling</li>
              <li style={{ color: 'var(--text-secondary)' }}>Cognitive Mapping</li>
            </ul>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid var(--border)', 
          paddingTop: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <span>© 2026 SchoolSphere Inc. Engineered with AntiGravity Vibe Stack.</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
