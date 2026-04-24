import React from 'react';
import Layout from '../components/Layout';
import { Calendar, Scissors, Users } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const stats = [
    { label: 'Citas Hoy', value: '12', icon: Calendar, color: 'var(--accent)' },
    { label: 'Servicios Activos', value: '8', icon: Scissors, color: 'var(--success)' },
    { label: 'Equipo', value: '4', icon: Users, color: 'var(--danger)' },
  ];

  return (
    <Layout title="Dashboard">
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>Bienvenido al Sistema de Gestión</h2>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Aquí tendrás un resumen de tu actividad diaria.
        </p>
        
        <div style={{ 
          marginTop: '3rem', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="glass-panel"
              style={{ 
                padding: '2rem', 
                borderRadius: 'var(--border-radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
                animation: `slideUp 0.5s ${i * 0.1 + 0.2}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                opacity: 0,
                transform: 'translateY(20px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              <div>
                <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.label}
                </span>
                <h2 style={{ 
                  margin: '1rem 0 0 0', 
                  fontSize: '3rem', 
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-2px'
                }}>
                  {stat.value}
                </h2>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--border-radius-md)',
                background: `linear-gradient(135deg, ${stat.color} 0%, rgba(255,255,255,0.1) 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 8px 16px -4px ${stat.color}40`
              }}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
