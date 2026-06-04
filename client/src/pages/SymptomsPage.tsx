import { useState, KeyboardEvent, useRef, useEffect, useCallback } from 'react';
import { symptomService, SymptomAnalysisResult } from '../services/symptomService';
import VoiceInputButton from '../components/VoiceInputButton';
import LanguageSelector from '../components/LanguageSelector';
import { useVoiceInput } from '../hooks/useVoiceInput';

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Voice input
  const voiceHook = useVoiceInput('en-IN');
  const [heardText, setHeardText] = useState('');
  const [showHeard, setShowHeard] = useState(false);
  const heardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => { if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [result]);

  // Clean up heard timeout on unmount
  useEffect(() => {
    return () => {
      if (heardTimeoutRef.current) clearTimeout(heardTimeoutRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const addSymptom = () => { const t = inputValue.trim(); if (t && !symptoms.includes(t)) setSymptoms(p => [...p, t]); setInputValue(''); };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } else if (e.key === 'Backspace' && !inputValue && symptoms.length > 0) setSymptoms(p => p.slice(0, -1)); };
  const removeSymptom = (sym: string) => setSymptoms(p => p.filter(s => s !== sym));

  // Parse voice transcript into individual symptoms
  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return;

    // Show "Heard: ..." label
    setHeardText(text);
    setShowHeard(true);
    if (heardTimeoutRef.current) clearTimeout(heardTimeoutRef.current);
    heardTimeoutRef.current = setTimeout(() => setShowHeard(false), 3000);

    // Split on common separators
    const parts = text
      .split(/\s*(?:,|\band\b|\balso\b|\bplus\b|\baur\b|\baur\s+bhi\b)\s*/i)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 1);

    const newSymptoms = [...symptoms];
    for (const part of parts) {
      if (!newSymptoms.includes(part)) {
        newSymptoms.push(part);
      }
    }
    setSymptoms(newSymptoms);
  }, [symptoms]);

  // Text-to-Speech for diagnosis
  const speakDiagnosis = useCallback(() => {
    if (!result || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    let textToSpeak = `Diagnosis: ${result.diagnosis}.`;
    if (result.medicines && result.medicines.length > 0) {
      textToSpeak += ` Suggested medicine: ${result.medicines[0].name}, ${result.medicines[0].dosage}.`;
    }
    if (result.seeDoctor) {
      textToSpeak += ' It is strongly recommended to see a doctor.';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find an en-IN voice, fallback to any English voice
    const voices = window.speechSynthesis.getVoices();
    const enINVoice = voices.find(v => v.lang === 'en-IN');
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enINVoice) utterance.voice = enINVoice;
    else if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [result]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const handleAnalyze = async () => {
    if (symptoms.length === 0) { setError('Please add at least one symptom before analyzing.'); return; }
    setError(''); setIsLoading(true); setResult(null); setSaved(false);
    try {
      const payload: { symptoms: string[]; patientAge?: number; patientGender?: string } = { symptoms };
      if (patientAge) payload.patientAge = parseInt(patientAge, 10);
      if (patientGender) payload.patientGender = patientGender;
      const data = await symptomService.analyze(payload);
      setResult(data); setSaved(true);
    } catch (err: any) { setError(err.response?.data?.message || 'Analysis failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleClear = () => { setSymptoms([]); setInputValue(''); setPatientAge(''); setPatientGender(''); setResult(null); setError(''); setSaved(false); setShowHeard(false); stopSpeaking(); inputRef.current?.focus(); };

  const severityConfig = {
    mild: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Mild', emoji: '🟢' },
    moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Moderate', emoji: '🟡' },
    severe: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Severe', emoji: '🔴' },
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>🩺 AI Symptom Checker</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontSize: '14px' }}>Describe your symptoms and get an AI-powered health analysis in seconds</p>
      </div>

      {/* Input Card */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', marginBottom: '24px', backdropFilter: 'blur(16px)' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Enter Your Symptoms</h2>
        <div onClick={() => inputRef.current?.focus()} style={{ minHeight: '64px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', cursor: 'text' }}>
          {symptoms.map(sym => (
            <span key={sym} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '20px', padding: '4px 10px', color: '#c7d2fe', fontSize: '13px', fontWeight: 500 }}>
              {sym}
              <button onClick={e => { e.stopPropagation(); removeSymptom(sym); }} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '15px', marginLeft: '2px' }}>×</button>
            </span>
          ))}
          <input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={addSymptom}
            placeholder={symptoms.length === 0 ? 'Type a symptom and press Enter (e.g., headache, fever, nausea...)' : 'Add more...'}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: '#e2e8f0', fontSize: '14px', minWidth: '200px', flex: 1 }}
          />
        </div>

        {/* Voice input row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '14px' }}>
          <VoiceInputButton onTranscript={handleVoiceTranscript} voiceHook={voiceHook} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
            <LanguageSelector value={voiceHook.lang} onChange={voiceHook.setLang} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
              🎙️ Speak your symptoms — they'll be added automatically
            </p>
          </div>
        </div>

        {/* Heard transcript label */}
        {showHeard && heardText && (
          <div style={{
            marginTop: '12px', padding: '8px 14px', borderRadius: '10px',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            color: 'rgba(165,180,252,0.8)', fontSize: '13px',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            🎤 Heard: <em>"{heardText}"</em>
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '8px' }}>
          Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>Enter</kbd> after each symptom, or use the mic to speak
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Age (optional)</label>
            <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 28" min={1} max={120}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Gender (optional)</label>
            <select value={patientGender} onChange={e => setPatientGender(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: patientGender ? '#e2e8f0' : 'rgba(255,255,255,0.35)', fontSize: '14px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {error && <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '14px' }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleAnalyze} disabled={isLoading || symptoms.length === 0}
            style={{ flex: 1, padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: isLoading || symptoms.length === 0 ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.2s',
              background: isLoading || symptoms.length === 0 ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', boxShadow: isLoading || symptoms.length === 0 ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', fontFamily: 'inherit',
            }}
          >{isLoading ? '⏳ Analyzing...' : '🔬 Analyze Symptoms'}</button>
          <button onClick={handleClear} style={{ padding: '14px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}>↺ Clear</button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '40px 28px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', margin: '0 4px', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>MediBud AI is analyzing your symptoms...</p>
          <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {saved && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontSize: '13px', fontWeight: 500, width: 'fit-content' }}>
              ✅ Analysis saved to your history
            </div>
          )}

          {result.seeDoctor && (
            <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🚨</span>
              <div>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '15px' }}>See a Doctor Urgently</div>
                <div style={{ color: 'rgba(248,113,113,0.8)', fontSize: '13px', marginTop: '2px' }}>Based on your symptoms, it is strongly recommended that you consult a medical professional as soon as possible.</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Severity</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', fontWeight: 700, fontSize: '16px',
                background: severityConfig[result.severity]?.bg || 'rgba(255,255,255,0.1)',
                color: severityConfig[result.severity]?.color || '#fff',
                border: `1px solid ${severityConfig[result.severity]?.color || '#fff'}33`,
              }}>{severityConfig[result.severity]?.emoji} {severityConfig[result.severity]?.label}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ color: 'rgba(165,180,252,0.7)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likely Diagnosis</div>
                {/* TTS Speaker button */}
                <button
                  id="tts-diagnosis-button"
                  onClick={isSpeaking ? stopSpeaking : speakDiagnosis}
                  title={isSpeaking ? 'Stop reading' : 'Read diagnosis aloud'}
                  style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: isSpeaking ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                    border: isSpeaking ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  {isSpeaking ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>{result.diagnosis}</p>
            </div>
          </div>

          {result.medicines && result.medicines.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 600, margin: 0 }}>💊 Suggested Over-the-Counter Medicines</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Medicine', 'Dosage', 'Frequency', 'Notes'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{result.medicines.map((med, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '12px 16px', color: '#a5b4fc', fontWeight: 600, fontSize: '14px' }}>{med.name}</td>
                      <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '14px' }}>{med.dosage}</td>
                      <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '14px' }}>{med.frequency}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{med.notes}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>⚕️ {result.disclaimer}</p>
          </div>

          <button onClick={handleClear} style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', width: 'fit-content', fontFamily: 'inherit' }}>↺ Clear &amp; Start Over</button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
