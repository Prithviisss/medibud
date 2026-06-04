import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { prescriptionService, Prescription } from '../services/prescriptionService';

// ─── CUSTOM SVG ICON COMPONENTS ───────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const UploadCloudIcon = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const FileTextIcon = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const StethoscopeIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 9 5.2V21a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5.5A5.5 5.5 0 0 0 14 13" />
    <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);

const ClinicIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 21h18" />
    <path d="M3 7v1a3 3 0 0 0 6 0V4H3Z" />
    <path d="M9 7v1a3 3 0 0 0 6 0V4H9Z" />
    <path d="M15 7v1a3 3 0 0 0 6 0V4h-6Z" />
    <path d="M5 21V10.85" />
    <path d="M19 21V10.85" />
    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
  </svg>
);

const CalendarIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const SearchIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const PillIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const TrashIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const EyeIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ListIcon = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const ExternalLinkIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const AlertCircleIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const CheckCircleIcon = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────

export default function PrescriptionsPage() {
  const { user, loadUser } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<Prescription | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  useEffect(() => { if (!user) loadUser(); fetchPrescriptions(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingImageUrl(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try { setPrescriptions(await prescriptionService.getAll()); }
    catch { setError('Failed to load prescriptions'); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) { setUploadError('Only JPG, PNG and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File size must be under 5MB'); return; }
    setSelectedFile(file); setUploadError(''); setUploadResult(null);
    if (file.type.startsWith('image/')) { const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(file); } else setPreview('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); setUploadProgress(0); setUploadError('');
    try { const result = await prescriptionService.upload(selectedFile, setUploadProgress); setUploadResult(result); setSelectedFile(null); setPreview(''); setPrescriptions(prev => [result, ...prev]); }
    catch (err: any) { setUploadError(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try { await prescriptionService.delete(id); setPrescriptions(prev => prev.filter(p => p._id !== id)); setDeleteConfirm(null); if (expandedId === id) setExpandedId(null); }
    catch { setError('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' };
  const btn = (bg: string, shadow: string) => ({ padding: '10px 20px', borderRadius: '10px', background: bg, border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 as const, cursor: 'pointer', boxShadow: `0 4px 16px ${shadow}`, transition: 'all 0.2s', fontFamily: 'inherit' as const });

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg,#e2e8f0,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prescriptions</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 6, fontSize: 14 }}>Upload and manage your prescriptions with AI-powered reading</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* Upload Panel */}
        <div style={{ ...glass, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloudIcon size={16} color="#a5b4fc" />
            </span>
            Upload Prescription
          </h2>
          <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            style={{ border: `2px dashed ${dragOver ? '#8b5cf6' : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: '32px 16px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.01)', transition: 'all 0.3s', marginBottom: 16 }}
          >
            {preview ? <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} /> : (
              <>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '50%', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 12,
                  color: '#a5b4fc',
                  animation: dragOver ? 'none' : 'pulse-slow 3s infinite ease-in-out'
                }}>
                  <UploadCloudIcon size={24} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>Drop prescription here or click to browse</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>Supports JPG, PNG or PDF (Max 5MB)</div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
          </div>
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <FileTextIcon size={16} color="#a5b4fc" />
              <span style={{ color: '#a5b4fc', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{selectedFile.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{(selectedFile.size / 1024).toFixed(0)} KB</span>
            </div>
          )}
          {uploadError && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircleIcon size={16} color="#f87171" />
              <span>{uploadError}</span>
            </div>
          )}
          <button onClick={handleUpload} disabled={!selectedFile || uploading}
            style={{ ...btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'rgba(99,102,241,0.2)'), width: '100%', opacity: (!selectedFile || uploading) ? 0.5 : 1, position: 'relative', overflow: 'hidden' }}
          >
            {uploading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing... {uploadProgress}%</span> : 'Upload & Analyze'}
            {uploading && <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: '#a5b4fc', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />}
          </button>
          {uploadResult && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircleIcon size={16} color="#34d399" />
                <span style={{ color: '#34d399', fontWeight: 600, fontSize: 14 }}>Prescription analyzed successfully!</span>
              </div>
              {uploadResult.doctorName && (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StethoscopeIcon size={13} color="#a5b4fc" />
                  <span>Dr. {uploadResult.doctorName}</span>
                </div>
              )}
              {uploadResult.diagnosis && (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SearchIcon size={13} color="#a5b4fc" />
                  <span>{uploadResult.diagnosis}</span>
                </div>
              )}
              {uploadResult.medicines.length > 0 && (
                <>
                  <div style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PillIcon size={13} color="#a5b4fc" /> Extracted Medicines:
                  </div>
                  {uploadResult.medicines.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
                      <span style={{ color: '#8b5cf6', fontSize: 12, display: 'inline-flex' }}><PillIcon size={12} color="#8b5cf6" /></span>
                      <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1, fontWeight: 500 }}>{m.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{m.dosage}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* History Panel */}
        <div style={{ ...glass, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(14,165,233,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ListIcon size={16} color="#38bdf8" />
            </span>
            Prescription History
            <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 11, fontWeight: 600 }}>{prescriptions.length}</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading history...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AlertCircleIcon size={16} color="#f87171" />
              <span>{error}</span>
            </div>
          ) : prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <FileTextIcon size={44} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500 }}>No prescriptions uploaded yet</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>Upload your first prescription to get started</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {prescriptions.map(p => {
                const isExpanded = expandedId === p._id;
                return (
                  <div key={p._id} style={{ borderRadius: 12, background: isExpanded ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.01)', border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.25s', overflow: 'hidden' }}>
                    <div onClick={() => setExpandedId(isExpanded ? null : p._id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt="Prescription Thumbnail" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImageUrl(p.imageUrl || null);
                          }}
                          style={{ 
                            width: 44, 
                            height: 44, 
                            borderRadius: 8, 
                            objectFit: 'cover', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'zoom-in',
                            transition: 'transform 0.2s'
                          }} 
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                          <FileTextIcon size={20} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.doctorName ? `Dr. ${p.doctorName}` : 'Prescription Document'}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: 3 }}>
                          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CalendarIcon size={11} color="rgba(255,255,255,0.3)" /> {fmtDate(p.date || p.createdAt)}
                          </span>
                          {p.hospitalName && (
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <ClinicIcon size={11} color="rgba(255,255,255,0.3)" /> {p.hospitalName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd', fontSize: 11, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <PillIcon size={11} color="#c4b5fd" /> {p.medicines.length}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.005)' }}>
                        {p.diagnosis && (
                          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, padding: '12px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SearchIcon size={14} color="#a5b4fc" />
                            <span><strong style={{ color: '#a5b4fc', fontWeight: 600 }}>Diagnosis:</strong> {p.diagnosis}</span>
                          </div>
                        )}
                        {p.medicines.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 12 }}>
                            <thead>
                              <tr>
                                {['Medicine', 'Dosage', 'Frequency', 'Duration'].map(h => (
                                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#a5b4fc', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {p.medicines.map((m, i) => (
                                <tr key={i}>
                                  <td style={{ padding: '6px 8px', color: '#e2e8f0', fontWeight: 500 }}>{m.name}</td>
                                  <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.dosage || '—'}</td>
                                  <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.frequency || '—'}</td>
                                  <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.duration || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                          {p.imageUrl ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setViewingImageUrl(p.imageUrl || null); 
                              }} 
                              style={{ 
                                padding: '6px 14px', 
                                borderRadius: 8, 
                                background: 'rgba(99,102,241,0.12)', 
                                border: '1px solid rgba(99,102,241,0.25)', 
                                color: '#a5b4fc', 
                                fontSize: 12, 
                                fontWeight: 600,
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6,
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(99,102,241,0.22)';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                              }}
                            >
                              <EyeIcon size={12} color="#a5b4fc" /> View Prescription
                            </button>
                          ) : <div />}
                          
                          {deleteConfirm === p._id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Delete?</span>
                              <button onClick={() => handleDelete(p._id)} disabled={deleting} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>{deleting ? '...' : 'Yes'}</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>No</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeleteConfirm(p._id)} 
                              style={{ 
                                padding: '6px 14px', 
                                borderRadius: 8, 
                                background: 'rgba(239,68,68,0.04)', 
                                border: '1px solid rgba(239,68,68,0.18)', 
                                color: '#f87171', 
                                fontSize: 12, 
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.04)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)';
                              }}
                            >
                              <TrashIcon size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Premium Preview Modal */}
      {viewingImageUrl && (
        <div 
          onClick={() => setViewingImageUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(10, 10, 18, 0.82)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24,
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'rgba(20, 20, 35, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              padding: 24,
              maxWidth: '90%',
              maxHeight: '90%',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 80px rgba(99, 102, 241, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Header controls */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 40 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextIcon size={18} color="#a5b4fc" />
                <span>Prescription Document</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a 
                  href={viewingImageUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#a5b4fc',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <ExternalLinkIcon size={12} color="#a5b4fc" /> Open Original
                </a>
                <button 
                  onClick={() => setViewingImageUrl(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Image viewer */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 12, background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: 12 }}>
              {viewingImageUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={viewingImageUrl} 
                  title="Prescription PDF" 
                  style={{ width: '800px', height: '600px', border: 'none', borderRadius: 8 }} 
                />
              ) : (
                <img 
                  src={viewingImageUrl} 
                  alt="Prescription" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }} 
                />
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleUp{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.03); opacity: 1; }
        }
      `}</style>
    </>
  );
}
