import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { appointmentService } from '../services/appointmentService';
import { useToast } from '../components/Toast';

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>',
  className: '', iconSize: [22, 22], iconAnchor: [11, 11],
});

const hospitalIcon = new L.DivIcon({
  html: '<div style="width:12px;height:12px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(239,68,68,0.5)"></div>',
  className: '', iconSize: [16, 16], iconAnchor: [8, 8],
});

const pharmacyIcon = new L.DivIcon({
  html: '<div style="width:12px;height:12px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(16,185,129,0.5)"></div>',
  className: '', iconSize: [16, 16], iconAnchor: [8, 8],
});

interface Place {
  id: string; name: string; lat: number; lng: number;
  address: string; type: string; distance?: number;
  phone?: string; opening_hours?: string;
}

const FILTERS = [
  { type: 'all', label: '🏥 All' },
  { type: 'hospital', label: '🏥 Hospitals' },
  { type: 'clinic', label: '🩺 Clinics' },
  { type: 'pharmacy', label: '💊 Pharmacies' },
];

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? '00' : '30';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function searchOverpass(lat: number, lng: number, filter: string): Promise<Place[]> {
  const radius = 5000;
  let amenityFilter = '';
  if (filter === 'hospital') amenityFilter = '["amenity"="hospital"]';
  else if (filter === 'clinic') amenityFilter = '["amenity"="clinic"]';
  else if (filter === 'pharmacy') amenityFilter = '["amenity"="pharmacy"]';
  else amenityFilter = '["amenity"~"hospital|clinic|pharmacy|doctors"]';

  const query = `[out:json][timeout:15];(node${amenityFilter}(around:${radius},${lat},${lng});way${amenityFilter}(around:${radius},${lat},${lng}););out center body 40;`;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await resp.json();

  const places: Place[] = (data.elements || [])
    .filter((e: any) => e.tags?.name)
    .map((e: any) => {
      const plat = e.lat ?? e.center?.lat;
      const plng = e.lon ?? e.center?.lon;
      const amenity = e.tags?.amenity || 'hospital';
      return {
        id: String(e.id),
        name: e.tags.name,
        lat: plat, lng: plng,
        address: [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || 'Address not available',
        type: amenity,
        phone: e.tags.phone || e.tags['contact:phone'],
        opening_hours: e.tags.opening_hours,
        distance: haversine(lat, lng, plat, plng), // fallback straight-line
      };
    });

  // Get actual road distances via free OSRM table API (single batch request)
  if (places.length > 0) {
    try {
      const coords = [`${lng},${lat}`, ...places.map(p => `${p.lng},${p.lat}`)].join(';');
      const osrmResp = await fetch(
        `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`
      );
      const osrmData = await osrmResp.json();
      if (osrmData.code === 'Ok' && osrmData.distances?.[0]) {
        const distances = osrmData.distances[0]; // distances from user to each place
        places.forEach((p, i) => {
          const roadDist = distances[i + 1]; // +1 because index 0 is the user location
          if (roadDist != null && roadDist > 0) {
            p.distance = roadDist / 1000; // convert meters to km
          }
        });
      }
    } catch {
      // OSRM failed — keep haversine fallback distances
    }
  }

  return places.sort((a, b) => (a.distance || 99) - (b.distance || 99));
}

async function geocodeSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
    headers: { 'User-Agent': 'MediBud-App' },
  });
  const data = await resp.json();
  if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px', backdropFilter: 'blur(16px)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function HospitalsPage() {
  const { showToast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [places, setPlaces] = useState<Place[]>([]);
  const [, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Booking state
  const [bookingPlace, setBookingPlace] = useState<Place | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const doSearch = useCallback(async (lat: number, lng: number, filter: string) => {
    setLoading(true);
    try {
      const results = await searchOverpass(lat, lng, filter);
      setPlaces(results);
    } catch {
      showToast('Failed to search nearby places', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (userLocation) doSearch(userLocation.lat, userLocation.lng, activeFilter);
  }, [userLocation, activeFilter, doSearch]);

  const getUserLocation = async () => {
    setLoading(true);

    // Try browser GPS first
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
        });
      });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(14);
      showToast('📍 Location found via GPS', 'success');
      return;
    } catch (geoErr: any) {
      console.warn('GPS failed, trying IP fallback:', geoErr.message);
    }

    // Fallback: IP-based location (less accurate but always works)
    try {
      const resp = await fetch('https://ip-api.com/json/?fields=lat,lon,city,status');
      const data = await resp.json();
      if (data.status === 'success') {
        const loc = { lat: data.lat, lng: data.lon };
        setUserLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(13);
        showToast(`📍 Location estimated from IP (${data.city}). For better accuracy, allow GPS or search manually.`, 'info');
        return;
      }
    } catch {
      console.warn('IP geolocation also failed');
    }

    showToast('Could not determine your location. Please search manually.', 'error');
    setLoading(false);
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const loc = await geocodeSearch(searchQuery);
      if (loc) {
        setUserLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(14);
      } else {
        showToast('Location not found', 'error');
        setLoading(false);
      }
    } catch {
      showToast('Search failed', 'error');
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingPlace || !date || !time) { showToast('Please fill date and time', 'warning'); return; }
    setBookingLoading(true);
    try {
      await appointmentService.create({ hospitalName: bookingPlace.name, doctorName: doctorName.trim() || undefined, date, time, notes: notes.trim() || undefined });
      showToast('Appointment booked successfully!', 'success');
      setBookingPlace(null); setDoctorName(''); setDate(''); setTime(''); setNotes('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to book appointment', 'error');
    } finally { setBookingLoading(false); }
  };

  const filteredPlaces = emergencyOnly ? places.filter(p => p.type === 'hospital') : places;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>🏥 Hospital Finder</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontSize: '14px' }}>
          Find nearby hospitals, clinics, and pharmacies — powered by OpenStreetMap
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: '600px' }} id="hospital-layout">
        {/* LEFT — Search + List */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          <div style={{ ...glass, padding: '20px' }}>
            <button onClick={getUserLocation} disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            }}>📍 {loading && places.length === 0 ? 'Getting location...' : 'Use My Location'}</button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" placeholder="Search city or area..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleManualSearch} disabled={loading} style={{
                padding: '10px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer', fontWeight: 600,
              }}>🔍</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {FILTERS.map(f => (
                <button key={f.type} onClick={() => setActiveFilter(f.type)} style={{
                  padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
                  background: activeFilter === f.type ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeFilter === f.type ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: activeFilter === f.type ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}>{f.label}</button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={emergencyOnly} onChange={e => setEmergencyOnly(e.target.checked)} />
              <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>Emergency Only (Hospitals)</span>
            </label>
          </div>

          {/* Results list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px' }}>
            {loading && places.length === 0 && <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>Searching nearby places...</div>}
            {!loading && places.length === 0 && userLocation && <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>No results found nearby</div>}
            {!userLocation && !loading && <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>📍 Use your location or search an area to find hospitals</div>}

            {filteredPlaces.map(place => (
              <div key={place.id} style={{ ...glass, padding: '16px', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => { setSelectedPlace(place); setMapCenter([place.lat, place.lng]); setMapZoom(16); }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: place.type === 'pharmacy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                  }}>{place.type === 'pharmacy' ? '💊' : place.type === 'clinic' ? '🩺' : '🏥'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 8px' }}>{place.address}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#a5b4fc', fontWeight: 600 }}>🚗 {place.distance?.toFixed(1)} km</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '10px', fontWeight: 600,
                        background: place.type === 'hospital' ? 'rgba(239,68,68,0.12)' : place.type === 'pharmacy' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                        color: place.type === 'hospital' ? '#f87171' : place.type === 'pharmacy' ? '#34d399' : '#a5b4fc',
                      }}>{place.type}</span>
                      {place.opening_hours && <span style={{ color: 'rgba(255,255,255,0.35)' }}>🕐 {place.opening_hours}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={e => { e.stopPropagation(); setBookingPlace(place); }} style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>📅 Book Appointment</button>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                    }}>🧭 Directions</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Map */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', minHeight: '400px' }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%', minHeight: '600px' }}
            zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup><span style={{ fontWeight: 600 }}>📍 You are here</span></Popup>
                </Marker>
                <Circle center={[userLocation.lat, userLocation.lng]} radius={5000}
                  pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1 }} />
              </>
            )}

            {filteredPlaces.map(place => (
              <Marker key={place.id} position={[place.lat, place.lng]}
                icon={place.type === 'pharmacy' ? pharmacyIcon : hospitalIcon}
                eventHandlers={{ click: () => setSelectedPlace(place) }}>
                <Popup>
                  <div style={{ maxWidth: 200 }}>
                    <strong>{place.name}</strong><br />
                    <span style={{ fontSize: 12, color: '#666' }}>{place.address}</span><br />
                    <button onClick={() => setBookingPlace(place)}
                      style={{ marginTop: 6, padding: '4px 10px', borderRadius: 4, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                      Book
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingPlace && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>📅 Book Appointment</h2>
            <p style={{ color: '#a5b4fc', fontSize: '14px', margin: '0 0 20px', fontWeight: 600 }}>{bookingPlace.name}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Doctor Name (Optional)</label>
                <input type="text" placeholder="Dr. Smith" value={doctorName} onChange={e => setDoctorName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Time</label>
                  <select value={time} onChange={e => setTime(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer', background: 'rgba(15,23,42,0.9)', color: time ? '#e2e8f0' : 'rgba(255,255,255,0.35)' }}>
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Notes (Optional)</label>
                <textarea placeholder="Any notes for the doctor..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleBookAppointment} disabled={bookingLoading || !date || !time}
                style={{ flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: bookingLoading || !date || !time ? 'not-allowed' : 'pointer',
                  opacity: bookingLoading || !date || !time ? 0.5 : 1, fontFamily: 'inherit',
                }}>{bookingLoading ? 'Booking...' : '✓ Confirm Booking'}</button>
              <button onClick={() => setBookingPlace(null)} style={{
                padding: '12px 20px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          #hospital-layout { flex-direction: column !important; }
          #hospital-layout > div:first-child { width: 100% !important; }
        }
        .leaflet-container { background: #1a1a2e !important; }
      `}</style>
    </div>
  );
}
