interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

const LANGUAGES = [
  { value: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { value: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ta-IN', label: 'Tamil', flag: '🇮🇳' },
  { value: 'te-IN', label: 'Telugu', flag: '🇮🇳' },
  { value: 'kn-IN', label: 'Kannada', flag: '🇮🇳' },
  { value: 'ml-IN', label: 'Malayalam', flag: '🇮🇳' },
  { value: 'mr-IN', label: 'Marathi', flag: '🇮🇳' },
  { value: 'bn-IN', label: 'Bengali', flag: '🇮🇳' },
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
      <select
        id="voice-language-selector"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          padding: '8px 32px 8px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#c7d2fe',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          minWidth: '140px',
        }}
      >
        {LANGUAGES.map(lang => (
          <option
            key={lang.value}
            value={lang.value}
            style={{ background: '#1e1e2e', color: '#e2e8f0' }}
          >
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div style={{
        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '10px',
      }}>
        ▾
      </div>
    </div>
  );
}
