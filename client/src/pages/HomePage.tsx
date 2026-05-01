import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🩺',
    title: 'AI Symptom Checker',
    desc: 'Describe your symptoms and get instant AI-powered health insights, possible diagnoses, and over-the-counter medicine suggestions.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    icon: '💊',
    title: 'Prescription Manager',
    desc: 'Keep all your prescriptions organized in one place. Set reminders and never miss a dose again.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    border: 'rgba(14,165,233,0.25)',
  },
  {
    icon: '🏥',
    title: 'Hospital Finder',
    desc: 'Locate nearby hospitals, clinics, and pharmacies quickly. Get directions and contact information instantly.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)',
  },
  {
    icon: '🚨',
    title: 'Emergency SOS',
    desc: 'Store emergency contacts and access one-tap SOS features when every second counts.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
];

const STEPS = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds — no credit card required.' },
  { num: '02', title: 'Enter your symptoms', desc: 'Type symptoms one by one and add them as tags.' },
  { num: '03', title: 'Get AI analysis', desc: 'Receive diagnosis possibilities, medicines, and severity assessment.' },
  { num: '04', title: 'Stay on top of health', desc: 'Track history, manage prescriptions, find care.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0',
      overflowX: 'hidden',
    }}>
      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)',
        background: 'rgba(15,23,42,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>🩺</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>MediBud</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 20px', borderRadius: '10px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '8px 20px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{
        textAlign: 'center', padding: '100px 40px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative glow blobs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '30px',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '12px' }}>✨</span>
          <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 500 }}>
            Powered by GPT-4o
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900,
          lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px',
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 60%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Your AI Health<br />Assistant
        </h1>

        <p style={{
          fontSize: '18px', color: 'rgba(255,255,255,0.55)', maxWidth: '560px',
          margin: '0 auto 40px', lineHeight: 1.7,
        }}>
          Analyze symptoms, manage prescriptions, find hospitals, and stay prepared for emergencies — all in one place.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '14px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.4)'; }}
          >
            Start for Free →
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            Sign In
          </button>
        </div>

        {/* Trust badges */}
        <div style={{
          marginTop: '48px', display: 'flex', gap: '32px', justifyContent: 'center',
          flexWrap: 'wrap', color: 'rgba(255,255,255,0.35)', fontSize: '13px',
        }}>
          {['🔒 Secure & Private', '⚡ Instant AI Results', '🌐 Always Available', '📱 Works Everywhere'].map(b => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '36px', fontWeight: 800, letterSpacing: '-1px',
            color: '#fff', marginBottom: '12px',
          }}>
            Everything you need
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px' }}>
            A complete health toolkit built for modern life
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                padding: '28px 24px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${f.border}`,
                backdropFilter: 'blur(16px)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${f.bg}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: f.bg, border: `1px solid ${f.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '16px',
              }}>
                {f.icon}
              </div>
              <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section style={{
        padding: '80px 40px', maxWidth: '900px', margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', color: '#fff', marginBottom: '12px' }}>
            How it works
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px' }}>Get health insights in under 60 seconds</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px', margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                border: '1px solid rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a5b4fc', fontSize: '15px', fontWeight: 800,
              }}>
                {s.num}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', display: 'none', /* hidden on mobile */
                }} />
              )}
              <h3 style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section style={{ padding: '60px 40px', maxWidth: '900px', margin: '0 auto 60px' }}>
        <div style={{
          padding: '48px', borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))',
          border: '1px solid rgba(99,102,241,0.3)',
          textAlign: 'center', backdropFilter: 'blur(20px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '28px',
            background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.08), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{
            fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', marginBottom: '12px',
          }}>
            Ready to take control of your health?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '32px' }}>
            Join thousands who trust MediBud for their everyday health needs.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '14px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(99,102,241,0.45)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Create Free Account →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px', textAlign: 'center',
        color: 'rgba(255,255,255,0.25)', fontSize: '13px',
      }}>
        © {new Date().getFullYear()} MediBud. Not a substitute for professional medical advice.
      </footer>
    </div>
  );
}
