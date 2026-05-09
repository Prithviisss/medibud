import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { prescriptionService, Prescription } from '../services/prescriptionService';

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

  useEffect(() => { if (!user) loadUser(); fetchPrescriptions(); }, []);

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
  const glass = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', backdropFilter: 'blur(16px)' };
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
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📤</span>
            Upload Prescription
          </h2>
          <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            style={{ border: `2px dashed ${dragOver ? '#8b5cf6' : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.3s', marginBottom: 16 }}
          >
            {preview ? <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} /> : (
              <><div style={{ fontSize: 40, marginBottom: 8, opacity: 0.6 }}>📋</div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Drop prescription image here or click to browse</div><div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 6 }}>JPG, PNG or PDF • Max 5MB</div></>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
          </div>
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ color: '#a5b4fc', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{(selectedFile.size / 1024).toFixed(0)} KB</span>
            </div>
          )}
          {uploadError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)' }}>⚠️ {uploadError}</div>}
          <button onClick={handleUpload} disabled={!selectedFile || uploading}
            style={{ ...btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'rgba(99,102,241,0.3)'), width: '100%', opacity: (!selectedFile || uploading) ? 0.5 : 1, position: 'relative', overflow: 'hidden' }}
          >
            {uploading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing... {uploadProgress}%</span> : 'Upload & Analyze'}
            {uploading && <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: '#a5b4fc', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />}
          </button>
          {uploadResult && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>✅</span><span style={{ color: '#34d399', fontWeight: 600, fontSize: 14 }}>Prescription analyzed successfully!</span></div>
              {uploadResult.doctorName && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>👨‍⚕️ Dr. {uploadResult.doctorName}</div>}
              {uploadResult.diagnosis && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>🔍 {uploadResult.diagnosis}</div>}
              {uploadResult.medicines.length > 0 && (
                <><div style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Extracted Medicines:</div>
                {uploadResult.medicines.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 4 }}>
                    <span style={{ color: '#8b5cf6', fontSize: 12 }}>💊</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{m.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{m.dosage}</span>
                  </div>
                ))}</>
              )}
            </div>
          )}
        </div>

        {/* History Panel */}
        <div style={{ ...glass, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📜</span>
            Prescription History
            <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 12, fontWeight: 500 }}>{prescriptions.length}</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#f87171', fontSize: 13 }}>⚠️ {error}</div>
          ) : prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>📋</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No prescriptions yet</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>Upload your first prescription to get started</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
              {prescriptions.map(p => {
                const isExpanded = expandedId === p._id;
                return (
                  <div key={p._id} style={{ borderRadius: 12, background: isExpanded ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.25s', overflow: 'hidden' }}>
                    <div onClick={() => setExpandedId(isExpanded ? null : p._id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} /> :
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.doctorName ? `Dr. ${p.doctorName}` : 'Prescription'}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>📅 {fmtDate(p.date || p.createdAt)}</span>
                          {p.hospitalName && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>🏥 {p.hospitalName}</span>}
                        </div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', fontSize: 11, whiteSpace: 'nowrap' }}>💊 {p.medicines.length}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {p.diagnosis && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '10px 0 6px' }}>🔍 <strong style={{ color: '#a5b4fc' }}>Diagnosis:</strong> {p.diagnosis}</div>}
                        {p.medicines.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 12 }}>
                            <thead><tr>{['Medicine', 'Dosage', 'Frequency', 'Duration'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#a5b4fc', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>)}</tr></thead>
                            <tbody>{p.medicines.map((m, i) => (
                              <tr key={i}><td style={{ padding: '6px 8px', color: '#e2e8f0' }}>{m.name}</td><td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.dosage || '—'}</td><td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.frequency || '—'}</td><td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.duration || '—'}</td></tr>
                            ))}</tbody>
                          </table>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          {deleteConfirm === p._id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Delete?</span>
                              <button onClick={() => handleDelete(p._id)} disabled={deleting} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>{deleting ? '...' : 'Yes'}</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(p._id)} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑 Delete</button>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
