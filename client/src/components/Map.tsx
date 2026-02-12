import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  lat: number;
  lng: number;
  zoom?: number;
  popupText?: string;
  className?: string;
}

function MapUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

export default function Map({ lat, lng, zoom = 13, popupText, className = "h-full w-full" }: MapProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl ${className}`}>
      <MapContainer 
        center={[lat, lng]} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {popupText && <Popup>{popupText}</Popup>}
        </Marker>
        <MapUpdater lat={lat} lng={lng} zoom={zoom} />
      </MapContainer>
    </div>
  );
}
