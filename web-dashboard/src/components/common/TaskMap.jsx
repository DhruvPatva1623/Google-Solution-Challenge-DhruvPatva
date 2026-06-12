import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Activity, ShieldAlert, Navigation, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Center location (default to Ahmedabad, India)
const DEFAULT_CENTER = [23.0225, 72.5714];

// Dynamic map view updater
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom]);
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

export default function TaskMap({ theme = 'dark', tasks = [], userLocation, onAcceptTask, acceptedTasks = {} }) {
  const isDarkTheme = theme === 'dark';
  
  // States for dynamic layers and overlays
  const [mapType, setMapType] = useState(isDarkTheme ? 'dark' : 'default'); // 'default', 'dark', 'satellite', 'terrain'
  const [showCrisisZones, setShowCrisisZones] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync with main app theme changes initially
  useEffect(() => {
    setMapType(isDarkTheme ? 'dark' : 'default');
  }, [theme]);

  // Layer configurations
  const layers = {
    default: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
    }
  };

  const mapCenter = userLocation || DEFAULT_CENTER;

  // Mock transit stations for Ahmedabad (rendered when Transit Overlay is toggled)
  const transitStations = [
    { name: 'Ahmedabad Metro Station (Kalupur)', lat: 23.0300, lng: 72.6000 },
    { name: 'Gitamandir Bus Terminus', lat: 23.0160, lng: 72.5920 },
    { name: 'Metro Station (Paldi)', lat: 23.0140, lng: 72.5620 },
    { name: 'Ranip BRTS Hub', lat: 23.0760, lng: 72.5680 }
  ];

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-[var(--border-light)] shadow-xl" style={{ zIndex: 1 }}>
      
      {/* Floating Google-Maps-Style Layers Control Button & Panel */}
      <div className="absolute top-4 right-4 z-[999] flex flex-col items-end">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-white text-slate-800 dark:bg-slate-900 dark:text-white rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-xs"
        >
          <Layers size={18} className="text-orange-500 animate-pulse" />
          Map Options
        </button>

        {isMenuOpen && (
          <div className="mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white transition-all duration-200">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-sm">Map configurations</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold">✕</button>
            </div>

            {/* Map Types selection grid */}
            <div className="mb-4">
              <span className="block text-[11px] font-extrabold uppercase text-slate-400 mb-2 tracking-wider">Map Type</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'default', label: 'Default' },
                  { id: 'dark', label: 'Dark Sleek' },
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'terrain', label: 'Terrain' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMapType(t.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold text-center border transition-all ${
                      mapType === t.id 
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Details / Overlays toggles */}
            <div>
              <span className="block text-[11px] font-extrabold uppercase text-slate-400 mb-2 tracking-wider">Overlays & Details</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-500" />
                    <span className="text-xs font-bold">Crisis / Flood Zones</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showCrisisZones} 
                    onChange={(e) => setShowCrisisZones(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-blue-500" />
                    <span className="text-xs font-bold">Transit Station Overlays</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showTransit} 
                    onChange={(e) => setShowTransit(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inject custom styled Leaflet classes to ensure high contrast and matching theme */}
      <style>{`
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

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', background: mapType === 'dark' ? '#020617' : '#f8fafc' }}
      >
        <ChangeView center={mapCenter} zoom={13} />
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
