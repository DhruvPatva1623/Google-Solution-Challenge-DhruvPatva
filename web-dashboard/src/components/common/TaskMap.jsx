import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  const isDark = theme === 'dark';
  
  // High detail map styles
  // Voyager for light mode, Dark Matter for dark mode
  const mapStyleUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const mapCenter = userLocation || DEFAULT_CENTER;

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-[var(--border-light)] shadow-xl" style={{ zIndex: 1 }}>
      {/* Inject custom styled Leaflet classes to ensure high contrast and matching theme */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'} !important;
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          border-radius: 12px !important;
          padding: 4px;
        }
        .leaflet-popup-tip {
          background: ${isDark ? '#0f172a' : '#ffffff'} !important;
        }
        .leaflet-popup-close-button {
          color: ${isDark ? '#94a3b8' : '#64748b'} !important;
          font-weight: bold;
        }
      `}</style>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', background: isDark ? '#020617' : '#f8fafc' }}
      >
        <ChangeView center={mapCenter} zoom={13} />
        <TileLayer
          attribution={attribution}
          url={mapStyleUrl}
        />

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
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' }}>You are here</div>
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
                <div className="p-1 min-w-[200px]" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white uppercase tracking-wider"
                      style={{ backgroundColor: color }}
                    >
                      {task.type}
                    </span>
                    <span className="text-xs font-bold" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{task.dist}</span>
                  </div>
                  <h4 className="font-extrabold text-sm mb-1" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>{task.title}</h4>
                  <p className="text-xs mb-3 font-semibold" style={{ color: isDark ? '#94a3b8' : '#475569' }}>Skills: {task.skills?.join(', ')}</p>
                  
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
