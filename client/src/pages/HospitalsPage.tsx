import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { appointmentService } from '../services/appointmentService';
import { useToast } from '../components/Toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const libraries: ('places' | 'geometry' | 'drawing' | 'visualization')[] = ['places'];

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: google.maps.LatLng;
  };
  rating?: number;
  opening_hours?: {
    isOpen?: () => boolean;
  };
  types: string[];
}

interface FilterType {
  type: string;
  label: string;
}

const FILTERS: FilterType[] = [
  { type: 'all', label: 'All' },
  { type: 'hospital', label: 'Hospitals' },
  { type: 'clinic', label: 'Clinics' },
  { type: 'pharmacy', label: 'Pharmacies' },
];

export default function HospitalsPage() {
  const { showToast } = useToast();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Booking Modal State
  const [bookingPlace, setBookingPlace] = useState<PlaceResult | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
    setMap(null);
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current && userLocation) {
      searchNearbyPlaces(userLocation);
    }
  }, [isLoaded, userLocation, activeFilter]);

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          if (mapRef.current) {
             mapRef.current.panTo(loc);
             mapRef.current.setZoom(14);
          }
        },
        () => {
          showToast('Failed to get your location', 'error');
          setLoading(false);
        }
      );
    } else {
      showToast('Geolocation is not supported by this browser.', 'error');
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (!isLoaded || !mapRef.current || !searchQuery) return;
    setLoading(true);
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        setUserLocation(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(14);
        searchNearbyPlaces(loc);
      } else {
        showToast('Location not found', 'error');
        setLoading(false);
      }
    });
  };

  const searchNearbyPlaces = (location: { lat: number; lng: number }) => {
    if (!mapRef.current) return;
    setLoading(true);
    const service = new google.maps.places.PlacesService(mapRef.current);
    
    let type = 'hospital';
    if (activeFilter === 'pharmacy') type = 'pharmacy';
    
    const request = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: 5000,
      type: type,
    };

    service.nearbySearch(request, (results, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        let filteredResults = results as PlaceResult[];
        if (activeFilter === 'clinic') {
            filteredResults = filteredResults.filter(p => p.name.toLowerCase().includes('clinic') || p.types.includes('health'));
        }
        setPlaces(filteredResults);
      } else {
        setPlaces([]);
      }
    });
  };

  const calculateDistance = (placeLoc: google.maps.LatLng) => {
    if (!userLocation || !window.google) return '';
    const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, placeLoc);
    return (distance / 1000).toFixed(1) + ' km';
  };

  const handleBookAppointment = async () => {
    if (!bookingPlace || !date || !time) {
      showToast('Please fill all fields', 'warning');
      return;
    }
    setBookingLoading(true);
    try {
      await appointmentService.create({
        hospitalName: bookingPlace.name,
        doctorName: doctorName.trim() || undefined,
        date,
        time,
      });
      showToast('Appointment booked successfully!', 'success');
      setBookingPlace(null);
      setDoctorName('');
      setDate('');
      setTime('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to book appointment', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const glass = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', backdropFilter: 'blur(16px)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border 0.2s',
  };

  if (loadError) return <div style={{ color: 'red', padding: '20px' }}>Error loading Google Maps</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>🏥 Hospital Finder</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontSize: '14px' }}>
          Find nearby hospitals, clinics, and pharmacies
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: '600px', flexDirection: window.innerWidth < 1024 ? 'column' : 'row' }}>
        
        {/* LEFT SIDE - Search and List */}
        <div style={{ width: window.innerWidth < 1024 ? '100%' : '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ ...glass, padding: '20px' }}>
             <button
              onClick={getUserLocation}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
               📍 {loading && !searchQuery ? 'Getting location...' : 'Use My Location'}
            </button>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search city or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleManualSearch}
                disabled={loading}
                style={{
                  padding: '10px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600
                }}
              >
                🔍
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {FILTERS.map(f => (
                <button
                  key={f.type}
                  onClick={() => setActiveFilter(f.type)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
                    background: activeFilter === f.type ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeFilter === f.type ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: activeFilter === f.type ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                    fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer' }}>
               <input type="checkbox" checked={emergencyOnly} onChange={(e) => setEmergencyOnly(e.target.checked)} />
               <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>Emergency Only (24/7)</span>
            </label>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading && places.length === 0 && <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>Searching...</div>}
            {!loading && places.length === 0 && userLocation && <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>No results found</div>}
            
            {places.filter(p => !emergencyOnly || p.types.includes('hospital')).map((place) => {
              const isOpen = place.opening_hours?.isOpen ? place.opening_hours.isOpen() : null;
              
              return (
                <div key={place.place_id} style={{ ...glass, padding: '16px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => {
                    setSelectedPlace(place);
                    if (mapRef.current) {
                      mapRef.current.panTo(place.geometry.location);
                      mapRef.current.setZoom(16);
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>{place.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 8px 0' }}>{place.vicinity}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '12px' }}>
                    {place.rating && <span style={{ color: '#fbbf24', fontWeight: 600 }}>⭐ {place.rating}</span>}
                    {isOpen !== null && (
                       <span style={{ color: isOpen ? '#34d399' : '#f87171', fontWeight: 600 }}>
                         {isOpen ? 'Open Now' : 'Closed'}
                       </span>
                    )}
                    {userLocation && <span style={{ color: '#a5b4fc' }}>📍 {calculateDistance(place.geometry.location)}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookingPlace(place);
                        }}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px',
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                          color: '#a5b4fc', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                        }}
                     >Book Appointment</button>
                     <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: '8px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center'
                        }}
                     >🧭 Directions</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE - Map */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', minHeight: '400px' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={userLocation || { lat: 20.5937, lng: 78.9629 }} // Default to India
              zoom={userLocation ? 14 : 5}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                styles: [
                  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
                  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
                  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
                  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
                  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
                  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
                  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
                  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
                  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
                  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
                  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
                ],
                disableDefaultUI: false,
              }}
            >
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                />
              )}
              {places.filter(p => !emergencyOnly || p.types.includes('hospital')).map((place) => (
                <Marker
                  key={place.place_id}
                  position={place.geometry.location}
                  onClick={() => setSelectedPlace(place)}
                />
              ))}
              {selectedPlace && (
                <InfoWindow
                  position={selectedPlace.geometry.location}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div style={{ color: '#000', padding: '4px', maxWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{selectedPlace.name}</h3>
                    <p style={{ margin: '0', fontSize: '12px' }}>{selectedPlace.vicinity}</p>
                    <button
                      onClick={() => setBookingPlace(selectedPlace)}
                      style={{
                         marginTop: '8px', padding: '4px 8px', borderRadius: '4px',
                         background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px'
                      }}
                    >Book</button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Loading Map...
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingPlace && (
         <div style={{
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
           background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
         }}>
            <div style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
               <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Book Appointment</h2>
               <p style={{ color: '#a5b4fc', fontSize: '14px', margin: '0 0 20px', fontWeight: 600 }}>{bookingPlace.name}</p>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                       <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={handleBookAppointment}
                    disabled={bookingLoading || !date || !time}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                      color: '#fff', fontWeight: 600, cursor: bookingLoading || !date || !time ? 'not-allowed' : 'pointer',
                      opacity: bookingLoading || !date || !time ? 0.5 : 1
                    }}
                  >{bookingLoading ? 'Booking...' : 'Confirm Booking'}</button>
                  <button
                    onClick={() => setBookingPlace(null)}
                    style={{
                      padding: '12px 20px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >Cancel</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
