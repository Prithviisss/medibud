export default function LoadingSpinner({ text = 'Loading...', size = 36 }: { text?: string; size?: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '16px', padding: '48px 24px',
    }}>
      <div style={{
        width: size, height: size,
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: '#8b5cf6',
        borderRadius: '50%',
        animation: 'spinnerRotate 0.8s linear infinite',
      }} />
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 500 }}>{text}</span>
      <style>{`@keyframes spinnerRotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
