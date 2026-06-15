import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Layers, ShieldAlert, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Center location (default to Ahmedabad, India)
const DEFAULT_CENTER = [23.0225, 72.5714];

// Dynamic map view updater
function ChangeView({ center, zoom, tasksCount }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [center, zoom, map, tasksCount]);
  return null;
}

// Function to create a custom stylish HTML marker icon based on task type/color
function createCustomIcon(type, color) {
  const isCritical = type === 'CRITICAL' || type === 'SOS';
  const ringHtml = isCritical 
    ? `<div class="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></div>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${ringHtml}
        <div class="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg" style="background-color: ${color || '#f97316'}">
          <span style="font-size: 10px; color: white;">📍</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

export default function TaskMap({ theme = 'dark', tasks = [], userLocation, onAcceptTask, acceptedTasks = {}, height = '400px' }) {
  const isDark = theme === 'dark';
  
  // States for dynamic layers and overlays
  const [mapType, setMapType] = useState(isDark ? 'dark' : 'default');
  const [showCrisisZones, setShowCrisisZones] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync with main app theme changes initially
  useEffect(() => {
    setMapType(isDark ? 'dark' : 'default');
  }, [theme]);

  // Layer configurations
  const layers = {
    default: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map &copy; OpenTopoMap'
    }
  };

  const mapCenter = userLocation || DEFAULT_CENTER;

  // Mock transit stations for Ahmedabad
  const transitStations = [
    { name: 'Ahmedabad Metro Station (Kalupur)', lat: 23.0300, lng: 72.6000 },
    { name: 'Gitamandir Bus Terminus', lat: 23.0160, lng: 72.5920 },
    { name: 'Metro Station (Paldi)', lat: 23.0140, lng: 72.5620 },
    { name: 'Ranip BRTS Hub', lat: 23.0760, lng: 72.5680 }
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border-light)] shadow-xl" style={{ height: height, zIndex: 1 }}>
      
      {/* Inject custom isolated CSS for map controls */}
      <style>{`
        .map-config-panel {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 1000;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .map-config-btn {
          background: ${isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          color: ${isDark ? '#f8fafc' : '#0f172a'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)'};
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .map-config-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .map-config-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 270px;
          background: ${isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)'};
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 35px rgba(0,0,0,0.35);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
          transition: all 0.2s ease;
        }
        .map-section-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: ${isDark ? '#94a3b8' : '#64748b'};
          margin-bottom: 8px;
          display: block;
        }
        .map-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .map-type-option {
          padding: 10px 8px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'};
          background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'};
          color: ${isDark ? '#f8fafc' : '#0f172a'};
          transition: all 0.2s ease;
        }
        .map-type-option:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
        }
        .map-type-option.active {
          background: rgba(249, 115, 22, 0.15);
          border-color: #f97316;
          color: #f97316;
        }
        .map-overlay-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .map-overlay-item {
          display: flex;
          align-items: center;
          justify-content: justify;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
          background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .map-overlay-item:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
        }
        .map-overlay-checkbox {
          accent-color: #f97316;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        /* Popups styles */
        .leaflet-popup-content-wrapper {
          background: ${mapType === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          color: ${mapType === 'dark' ? '#f8fafc' : '#0f172a'} !important;
          border: 1px solid ${mapType === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'} !important;
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          border-radius: 12px !important;
          padding: 4px;
        }
        .leaflet-popup-tip {
          background: ${mapType === 'dark' ? '#0f172a' : '#ffffff'} !important;
        }
        .leaflet-popup-close-button {
          color: ${mapType === 'dark' ? '#94a3b8' : '#64748b'} !important;
          font-weight: bold;
        }
      `}</style>

      {/* Floating config panel placed outside MapContainer to avoid Leaflet positioning conflicts */}
      <div className="map-config-panel">
        <button className="map-config-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Layers size={16} />
          <span>Map Details</span>
        </button>

        {isMenuOpen && (
          <div className="map-config-dropdown">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px' }}>Map Configurations</span>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            {/* Map Types selection grid */}
            <div>
              <span className="map-section-title">Map Type</span>
              <div className="map-type-grid">
                {[
                  { id: 'default', label: 'Default' },
                  { id: 'dark', label: 'Dark Sleek' },
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'terrain', label: 'Terrain' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMapType(t.id)}
                    className={`map-type-option ${mapType === t.id ? 'active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Details / Overlays toggles */}
            <div>
              <span className="map-section-title">Overlays & Details</span>
              <div className="map-overlay-list">
                <div className="map-overlay-item" onClick={() => setShowCrisisZones(!showCrisisZones)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} color="#ef4444" />
                    <span>Crisis / Flood Zones</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showCrisisZones} 
                    onChange={() => {}} // Handled by div click
                    className="map-overlay-checkbox"
                  />
                </div>

                <div className="map-overlay-item" onClick={() => setShowTransit(!showTransit)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={16} color="#3b82f6" />
                    <span>Transit Stations</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showTransit} 
                    onChange={() => {}} // Handled by div click
                    className="map-overlay-checkbox"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', background: mapType === 'dark' ? '#020617' : '#f8fafc' }}
      >
        <ChangeView center={mapCenter} zoom={13} tasksCount={tasks.length} />
        <TileLayer
          attribution={layers[mapType].attribution}
          url={layers[mapType].url}
        />

        {/* Crisis Zones Visual overlay (Red Pulsing Circles around critical task coordinates) */}
        {showCrisisZones && tasks.map(t => {
          if (t.type === 'CRITICAL' && t.lat && t.lng) {
            return (
              <React.Fragment key={`zone-${t.id}`}>
                <Circle 
                  center={[t.lat, t.lng]}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2 }}
                  radius={800} // 800 meters radius
                />
                <Circle 
                  center={[t.lat, t.lng]}
                  pathOptions={{ color: '#ef4444', weight: 1, dashArray: '5, 10' }}
                  radius={1200}
                />
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Transit overlays */}
        {showTransit && (
          <>
            {transitStations.map((station, i) => (
              <Marker
                key={`transit-${i}`}
                position={[station.lat, station.lng]}
                icon={L.divIcon({
                  className: 'transit-station-marker',
                  html: `
                    <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white border-2 border-white shadow-md text-[10px] font-extrabold">
                      🚇
                    </div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div className="p-1 text-slate-800 font-extrabold text-xs">
                    🚇 {station.name}
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* Draw a mock metro/BRTS line connecting the points */}
            <Polyline 
              positions={transitStations.map(s => [s.lat, s.lng])} 
              pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.6 }}
            />
          </>
        )}

        {/* User's Location Marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-icon',
              html: `
                <div class="relative flex items-center justify-center w-8 h-8">
                  <div class="absolute inset-0 rounded-full bg-blue-500 opacity-40 animate-ping"></div>
                  <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: mapType === 'dark' ? '#f8fafc' : '#0f172a' }}>You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Task and Event Markers */}
        {tasks.map((task) => {
          if (!task.lat || !task.lng) return null;

          const color = task.type === 'CRITICAL' ? '#ef4444' : task.type === 'URGENT' ? '#f97316' : '#10b981';
          const accepted = acceptedTasks[task.id];

          return (
            <Marker 
              key={task.id} 
              position={[task.lat, task.lng]}
              icon={createCustomIcon(task.type, color)}
            >
              <Popup>
                <div className="p-1 min-w-[200px]" style={{ color: mapType === 'dark' ? '#f8fafc' : '#0f172a' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white uppercase tracking-wider"
                      style={{ backgroundColor: color }}
                    >
                      {task.type}
                    </span>
                    <span className="text-xs font-bold" style={{ color: mapType === 'dark' ? '#94a3b8' : '#64748b' }}>{task.dist}</span>
                  </div>
                  <h4 className="font-extrabold text-sm mb-1" style={{ color: mapType === 'dark' ? '#f8fafc' : '#1e293b' }}>{task.title}</h4>
                  <p className="text-xs mb-3 font-semibold" style={{ color: mapType === 'dark' ? '#94a3b8' : '#475569' }}>Skills: {task.skills?.join(', ')}</p>
                  
                  {onAcceptTask && (
                    <button
                      onClick={() => onAcceptTask(task)}
                      disabled={accepted}
                      className={`w-full py-2 rounded text-xs font-extrabold text-white transition-all shadow-md ${
                        accepted 
                          ? 'bg-emerald-600 cursor-default shadow-none' 
                          : 'bg-orange-500 hover:bg-orange-600 active:scale-95 hover:shadow-lg'
                      }`}
                    >
                      {accepted ? '✓ Mission Accepted' : 'Accept Mission'}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
