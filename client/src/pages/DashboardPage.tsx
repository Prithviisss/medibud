import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { symptomService } from '../services/symptomService';
import api from '../services/api';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Symptoms', href: '/symptoms', icon: '🩺' },
  { label: 'Prescriptions', href: '/prescriptions', icon: '💊' },
  { label: 'Hospitals', href: '/hospitals', icon: '🏥' },
  { label: 'Emergency', href: '/emergency', icon: '🚨' },
];

const QUICK_ACTIONS = [
  {
    label: 'Check Symptoms',
    desc: 'AI-powered analysis',
    href: '/symptoms',
    icon: '🩺',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    shadow: 'rgba(99,102,241,0.35)',
  },
  {
    label: 'Prescriptions',
    desc: 'Manage your meds',
    href: '/prescriptions',
    icon: '💊',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    shadow: 'rgba(14,165,233,0.35)',
  },
  {
    label: 'Find Hospitals',
    desc: 'Nearby facilities',
    href: '/hospitals',
    icon: '🏥',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    shadow: 'rgba(16,185,129,0.35)',
  },
  {
    label: 'Emergency',
    desc: 'SOS contacts',
    href: '/emergency',
    icon: '🚨',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    shadow: 'rgba(239,68,68,0.35)',
  },
];

interface Stats {
  totalChecks: number;
  prescriptions: number;
  appointments: number;
  emergencyContacts: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, loadUser } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalChecks: 0,
    prescriptions: 0,
    appointments: 0,
    emergencyContacts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) loadUser();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [symptomStats, meRes] = await Promise.allSettled([
        symptomService.getStats(),
        api.get('/auth/me'),
      ]);

      const checks = symptomStats.status === 'fulfilled' ? symptomStats.value.totalChecks : 0;
      const meData = meRes.status === 'fulfilled' ? meRes.value.data : null;

      setStats({
        totalChecks: checks,
        prescriptions: 0, // would be populated when prescriptions feature is built
        appointments: 0,  // would be populated when appointments feature is built
        emergencyContacts: meData?.emergencyContacts?.length ?? 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const STAT_CARDS = [
    {
      label: 'Symptom Checks',
      value: stats.totalChecks,
      icon: '🩺',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.2)',
      desc: 'Total AI analyses run',
    },
    {
      label: 'Prescriptions',
      value: stats.prescriptions,
      icon: '💊',
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.1)',
      border: 'rgba(14,165,233,0.2)',
      desc: 'Saved prescriptions',
    },
    {
      label: 'Appointments',
      value: stats.appointments,
      icon: '📅',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
      desc: 'Upcoming appointments',
    },
    {
      label: 'Emergency Contacts',
      value: stats.emergencyContacts,
      icon: '🚨',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)',
      desc: 'Contacts configured',
    },
  ];

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

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV_LINKS.map((link) => {
            const isActive = window.location.pathname === link.href;
            return (
              <a key={link.href} href={link.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '10px', marginBottom: '4px', textDecoration: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))' : 'transparent',
                color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 600 : 400, fontSize: '14px',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '13px', fontWeight: 700,
            }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{user?.name || 'User'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{user?.email || ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 4px 0' }}>
                {getGreeting()},
              </p>
              <h1 style={{
                color: '#fff', fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {user?.name || 'Welcome back'} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontSize: '14px' }}>
                Here's your health overview for today
              </p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: '30px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${card.border}`,
              borderRadius: '16px', padding: '20px',
              backdropFilter: 'blur(16px)', transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: card.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px',
                }}>{card.icon}</div>
              </div>
              <div style={{ color: card.color, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                {statsLoading ? (
                  <div style={{ height: '28px', width: '40px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', animation: 'shimmer 1.5s infinite' }} />
                ) : card.value}
              </div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{card.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px' }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.href}
                onClick={() => navigate(action.href)}
                style={{
                  padding: '20px 16px', borderRadius: '16px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'left', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = action.gradient;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${action.shadow}`;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '22px' }}>{action.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{action.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{action.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Health Tip Banner */}
        <div style={{
          padding: '20px 24px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ fontSize: '28px' }}>💡</div>
          <div>
            <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '14px' }}>Health Tip of the Day</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '4px' }}>
              Staying hydrated improves focus, energy levels, and helps your body flush out toxins. Aim for 8 glasses of water daily.
            </div>
          </div>
          <button
            onClick={() => navigate('/symptoms')}
            style={{
              marginLeft: 'auto', padding: '10px 18px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            Check Symptoms →
          </button>
        </div>

        <style>{`@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
      </main>
    </div>
  );
}
