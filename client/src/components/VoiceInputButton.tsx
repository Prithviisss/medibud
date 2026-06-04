import { useEffect, useRef, useCallback } from 'react';
import { useVoiceInput, UseVoiceInputReturn } from '../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  voiceHook?: UseVoiceInputReturn;
}

export default function VoiceInputButton({ onTranscript, voiceHook }: VoiceInputButtonProps) {
  const internalHook = useVoiceInput();
  const hook = voiceHook || internalHook;
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported, error } = hook;

  const calledRef = useRef(false);

  // When final transcript is received, call onTranscript
  useEffect(() => {
    if (transcript && !calledRef.current) {
      calledRef.current = true;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Reset the called ref when we start listening again
  useEffect(() => {
    if (isListening) {
      calledRef.current = false;
    }
  }, [isListening]);

  const handleClick = useCallback(() => {
    if (!isSupported) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, isListening, startListening, stopListening]);

  const liveText = isListening ? (interimTranscript || 'Speak now...') : '';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Floating transcript bubble */}
      {isListening && liveText && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: '12px', padding: '10px 16px', minWidth: '180px', maxWidth: '320px',
          color: '#c7d2fe', fontSize: '13px', fontStyle: 'italic', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.2s ease-out',
          whiteSpace: 'pre-wrap', zIndex: 10,
        }}>
          <div style={{
            position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: '12px', height: '12px', background: 'rgba(30,30,50,0.95)',
            border: '1px solid rgba(99,102,241,0.4)', borderTop: 'none', borderLeft: 'none',
          }} />
          "{liveText}"
        </div>
      )}

      {/* Mic button */}
      <button
        id="voice-input-button"
        onClick={handleClick}
        disabled={!isSupported}
        title={!isSupported ? 'Voice input not supported in this browser' : isListening ? 'Stop listening' : 'Speak your symptoms'}
        style={{
          position: 'relative',
          width: '52px', height: '52px', borderRadius: '50%',
          border: isListening ? '2px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.15)',
          background: isListening
            ? 'radial-gradient(circle, rgba(239,68,68,0.25), rgba(239,68,68,0.1))'
            : !isSupported
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(255,255,255,0.06)',
          cursor: !isSupported ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          opacity: !isSupported ? 0.35 : 1,
          animation: isListening ? 'micPulse 1.5s ease-in-out infinite' : 'none',
          overflow: 'visible',
          flexShrink: 0,
        }}
      >
        {/* Pulse ring when listening */}
        {isListening && (
          <div style={{
            position: 'absolute', inset: '-6px', borderRadius: '50%',
            border: '2px solid rgba(239,68,68,0.3)',
            animation: 'pulseRing 1.5s ease-out infinite',
          }} />
        )}

        {/* Mic icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#f87171' : !isSupported ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="1" width="6" height="12" rx="3" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="18" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Waveform animation when listening */}
      {isListening && (
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '8px', height: '16px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '3px', borderRadius: '2px',
              background: 'linear-gradient(180deg, #f87171, #ef4444)',
              animation: `waveBar 0.8s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}

      {/* Label */}
      <span style={{
        marginTop: isListening ? '4px' : '6px',
        fontSize: '11px', fontWeight: 500,
        color: isListening ? '#f87171' : error ? '#f87171' : 'rgba(255,255,255,0.4)',
        textAlign: 'center', maxWidth: '80px',
        transition: 'color 0.2s',
      }}>
        {error ? 'Error' : isListening ? 'Listening...' : 'Speak'}
      </span>

      {/* Error tooltip */}
      {error && !isListening && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 28px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '6px 12px', maxWidth: '220px',
          color: '#fca5a5', fontSize: '11px', textAlign: 'center', whiteSpace: 'normal',
          zIndex: 10,
        }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes micPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes waveBar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
