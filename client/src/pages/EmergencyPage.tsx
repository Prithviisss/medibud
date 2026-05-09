import { useState, useEffect, useRef, useCallback } from 'react';
import { emergencyService, EmergencyContact } from '../services/emergencyService';
import { useToast } from '../components/Toast';

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Sibling', 'Friend', 'Other'];

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px', backdropFilter: 'blur(16px)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border 0.2s',
};

export default function EmergencyPage() {
  const { showToast } = useToast();

  // Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add contact form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+91 ');
  const [formRelation, setFormRelation] = useState('');

  // SOS state
  const [sosState, setSosState] = useState<'idle' | 'countdown' | 'locating' | 'sending' | 'sent' | 'error'>('idle');
  const [countdown, setCountdown] = useState(5);
  const [sosResult, setSosResult] = useState<{ contactsNotified: number } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchContacts();
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await emergencyService.getContacts();
      setContacts(data.emergencyContacts || []);
    } catch {
      showToast('Failed to load emergency contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!formName.trim() || !formPhone.trim() || !formRelation) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (contacts.length >= 3) {
      showToast('Maximum 3 contacts allowed', 'warning');
      return;
    }

    const newContacts = [...contacts, { name: formName.trim(), phone: formPhone.trim(), relation: formRelation }];
    setSaving(true);
    try {
      await emergencyService.updateContacts(newContacts);
      setContacts(newContacts);
      setFormName(''); setFormPhone('+91 '); setFormRelation('');
      setShowForm(false);
      showToast('Contact added successfully', 'success');
    } catch {
      showToast('Failed to save contact', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await emergencyService.updateContacts(newContacts);
      setContacts(newContacts);
      showToast('Contact removed', 'info');
    } catch {
      showToast('Failed to remove contact', 'error');
    } finally {
      setSaving(false);
    }
  };

  // SOS Flow
  const startSOS = () => {
    if (contacts.length === 0) {
      showToast('Add emergency contacts first to use SOS', 'warning');
      return;
    }
    setSosState('countdown');
    setCountdown(5);
    setSosResult(null);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSosState('idle');
    setCountdown(5);
  };

  const triggerSOS = useCallback(async () => {
    setSosState('locating');

    let lat: number | undefined;
    let lng: number | undefined;

    // Try GPS
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS failed — continue without location
      console.warn('Geolocation denied or failed, sending SOS without precise location');
    }

    if (lat && lng) setUserCoords({ lat, lng });

    setSosState('sending');
    try {
      const result = await emergencyService.sendSOS(lat, lng);
      setSosResult(result);
      setSosState('sent');
      showToast(`🚨 SOS sent! ${result.contactsNotified} contact(s) notified`, 'success');
    } catch (err: any) {
      setSosState('error');
      showToast(err.response?.data?.error || 'Failed to send SOS', 'error');
    }
  }, [contacts]);

  const resetSOS = () => {
    setSosState('idle');
    setSosResult(null);
    setUserCoords(null);
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #e2e8f0, #f87171)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>🚨 Emergency SOS</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontSize: '14px' }}>
          Manage emergency contacts and send SOS alerts instantly
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* LEFT — Emergency Contacts */}
        <div style={{ ...glass, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📱</span>
              Emergency Contacts
              <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11 }}>{contacts.length}/3</span>
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading...</div>
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>👤</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No emergency contacts yet</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>Add contacts to enable SOS alerts</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f87171', fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>{c.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>📞 {c.phone}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>• {c.relation}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(i)}
                    disabled={saving}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171', fontSize: 11, cursor: 'pointer', flexShrink: 0,
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add Contact */}
          {!showForm && contacts.length < 3 && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Add Contact</button>
          )}

          {contacts.length >= 3 && !showForm && (
            <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' }}>
              ⚠️ Maximum 3 contacts reached
            </div>
          )}

          {showForm && (
            <div style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Full Name" style={inputStyle}
                />
                <input
                  value={formPhone} onChange={e => setFormPhone(e.target.value)}
                  placeholder="+91 9876543210" style={inputStyle}
                />
                <select
                  value={formRelation} onChange={e => setFormRelation(e.target.value)}
                  style={{ ...inputStyle, color: formRelation ? '#e2e8f0' : 'rgba(255,255,255,0.35)', cursor: 'pointer', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Relation</option>
                  {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddContact} disabled={saving}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
                      color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{saving ? 'Saving...' : 'Save Contact'}</button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: '10px 16px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — SOS Button */}
        <div style={{ ...glass, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🆘</span>
            SOS Alert
          </h2>

          {contacts.length === 0 && !loading && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', width: '100%',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24', fontSize: '13px', textAlign: 'center',
            }}>⚠️ Add emergency contacts first to use SOS</div>
          )}

          {/* IDLE State */}
          {sosState === 'idle' && (
            <>
              <button
                id="sos-main-button"
                onClick={startSOS}
                disabled={contacts.length === 0}
                style={{
                  width: '160px', height: '160px', borderRadius: '50%',
                  background: contacts.length === 0
                    ? 'rgba(239,68,68,0.2)'
                    : 'radial-gradient(circle at 40% 40%, #ef4444, #b91c1c)',
                  border: contacts.length === 0 ? '3px solid rgba(239,68,68,0.15)' : '4px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '36px', fontWeight: 900, cursor: contacts.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: contacts.length === 0 ? 'none' : '0 0 60px rgba(239,68,68,0.4), inset 0 -4px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s', fontFamily: 'inherit',
                  opacity: contacts.length === 0 ? 0.4 : 1,
                  animation: contacts.length > 0 ? 'sosGlow 2s ease-in-out infinite' : 'none',
                }}
              >SOS</button>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
                Press the button to send an emergency alert<br />to all your contacts with your location
              </p>
            </>
          )}

          {/* COUNTDOWN State */}
          {sosState === 'countdown' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '160px', height: '160px', borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, #ef4444, #b91c1c)',
                border: '4px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                boxShadow: '0 0 60px rgba(239,68,68,0.5)',
                animation: 'sosPulseHard 1s ease-in-out infinite',
                margin: '0 auto',
              }}>
                <div style={{ color: '#fff', fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>{countdown}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>SENDING IN</div>
              </div>
              <button
                onClick={cancelSOS}
                style={{
                  marginTop: '20px', padding: '12px 32px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >✕ Cancel SOS</button>
            </div>
          )}

          {/* LOCATING / SENDING State */}
          {(sosState === 'locating' || sosState === 'sending') && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, border: '4px solid rgba(239,68,68,0.2)',
                borderTopColor: '#ef4444', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
              }} />
              <div style={{ color: '#f87171', fontSize: '15px', fontWeight: 600 }}>
                {sosState === 'locating' ? '📍 Getting your location...' : '📤 Sending SOS alerts...'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
                Please wait, do not close this page
              </div>
            </div>
          )}

          {/* SENT State */}
          {sosState === 'sent' && sosResult && (
            <div style={{ textAlign: 'center', padding: '10px 0', width: '100%' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', margin: '0 auto 16px',
              }}>✅</div>
              <div style={{ color: '#34d399', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>SOS Sent!</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>
                {sosResult.contactsNotified} contact(s) notified
              </div>
              {userCoords && (
                <a
                  href={`https://www.google.com/maps/search/hospitals+near+me/@${userCoords.lat},${userCoords.lng},15z`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', padding: '12px 24px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                    fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: '12px',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  }}
                >🗺️ Open Google Maps — Nearby Hospitals</a>
              )}
              <br />
              <button
                onClick={resetSOS}
                style={{
                  marginTop: '8px', padding: '10px 24px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Done</button>
            </div>
          )}

          {/* ERROR State */}
          {sosState === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
              <div style={{ color: '#f87171', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>SOS Failed</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
                Could not send the alert. Please try again or call emergency services directly.
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={startSOS}
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >Retry SOS</button>
                <a
                  href="tel:112"
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                  }}
                >📞 Call 112</a>
              </div>
            </div>
          )}

          {/* Quick dial */}
          <div style={{
            marginTop: '24px', width: '100%', padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Dial Emergency
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '🚑 Ambulance', num: '108' },
                { label: '👮 Police', num: '100' },
                { label: '🚒 Fire', num: '101' },
                { label: '🆘 Emergency', num: '112' },
              ].map(s => (
                <a key={s.num} href={`tel:${s.num}`} style={{
                  padding: '6px 14px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', fontSize: '12px', fontWeight: 500, textDecoration: 'none',
                }}>{s.label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sosGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(239,68,68,0.3), inset 0 -4px 12px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 0 70px rgba(239,68,68,0.5), inset 0 -4px 12px rgba(0,0,0,0.2); }
        }
        @keyframes sosPulseHard {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(239,68,68,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 80px rgba(239,68,68,0.7); }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
