import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '120px', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(99,102,241,0.2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-4px', marginBottom: '8px',
        }}>
          404
        </div>

        <h1 style={{
          color: '#fff', fontSize: '28px', fontWeight: 700,
          marginBottom: '12px', letterSpacing: '-0.5px',
        }}>
          Page not found
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: '15px',
          maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
          >
            Go to Dashboard →
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
