import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';


const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Symptoms', href: '/symptoms', icon: '🩺' },
  { label: 'Prescriptions', href: '/prescriptions', icon: '💊' },
  { label: 'Hospitals', href: '/hospitals', icon: '🏥' },
  { label: 'Emergency', href: '/emergency', icon: '🚨' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loadUser } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (!user) loadUser();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile)
  // Not needed if we use bottom nav
  useEffect(() => {
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSOS = () => {
    navigate('/emergency');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // ── MOBILE BOTTOM NAV ──
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        fontFamily: "'Inter', sans-serif",
        display: 'flex', flexDirection: 'column',
        paddingBottom: '72px', // space for bottom nav
      }}>
        {/* Mobile header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, zIndex: 100,
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>🩺</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>MediBud</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '11px', fontWeight: 700,
            }}>{initials}</div>
            <button onClick={handleLogout} style={{
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
            }}>Sign Out</button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {children}
        </main>

        {/* Bottom nav bar */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,23,42,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '8px 0 10px', zIndex: 100,
        }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  padding: '4px 8px', borderRadius: '8px',
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* SOS floating button */}
        <button
          id="sos-button"
          onClick={handleSOS}
          style={{
            position: 'fixed', bottom: '84px', right: '16px', zIndex: 200,
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', color: '#fff', fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sosPulse 2s ease-in-out infinite',
          }}
        >SOS</button>

        <style>{`
          @keyframes sosPulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,0.5); }
            50% { box-shadow: 0 4px 30px rgba(239,68,68,0.8); }
          }
        `}</style>
      </div>
    );
  }

  // ── DESKTOP SIDEBAR LAYOUT ──
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', minHeight: '100vh',
        background: 'rgba(255,255,255,0.04)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0', position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>🩺</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>MediBud</span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: '10px', marginBottom: '4px', width: '100%',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))'
                    : 'transparent',
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 600 : 400, fontSize: '14px',
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* User info + Sign out */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', marginBottom: '8px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '13px', fontWeight: 700,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: '#fff', fontSize: '13px', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.name || 'User'}</div>
              <div style={{
                color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.email || ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
            fontFamily: 'inherit',
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>

      {/* SOS floating button */}
      <button
        id="sos-button"
        onClick={handleSOS}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          border: 'none', color: '#fff', fontSize: '13px', fontWeight: 800,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'sosPulse 2s ease-in-out infinite',
          letterSpacing: '0.5px',
        }}
      >SOS</button>

      <style>{`
        @keyframes sosPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,0.5); }
          50% { box-shadow: 0 4px 30px rgba(239,68,68,0.8); }
        }
      `}</style>
    </div>
  );
}
