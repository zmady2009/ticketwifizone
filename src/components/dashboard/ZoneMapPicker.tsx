'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface ZoneMapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

// Coordonnes par défaut (Ouagadougou)
const DEFAULT_LAT = 12.2383;
const DEFAULT_LNG = -1.5616;

export function ZoneMapPicker({
  latitude,
  longitude,
  onChange,
}: ZoneMapPickerProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Charger Leaflet (lazy loading)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      try {
        // Dynamically import leaflet
        const L = await import('leaflet');

        // Fix for default marker icons
        delete (L.Icon.Default.prototype as any)['_getIconUrl'];
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');

      const initialLat = latitude || userLocation?.lat || DEFAULT_LAT;
      const initialLng = longitude || userLocation?.lng || DEFAULT_LNG;

      // Créer la carte
      const mapElement = mapRef.current;
      if (!mapElement) return;

      const map = L.map(mapElement).setView([initialLat, initialLng], 13);

      // Ajouter le layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Ajouter le marqueur
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(map);

      // Mettre à jour les coordonnées quand le marqueur bouge
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });

      // Mettre à jour les coordonnées quand on clique sur la carte
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Nettoyage
      return () => {
        map.remove();
      };
    };

    const cleanup = initMap();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [mapLoaded, latitude, longitude, userLocation, onChange]);

  // Mettre à jour le marqueur si les coordonnées changent
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Géolocalisation utilisateur
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setUserLocation({ lat, lng });
          onChange(lat, lng);

          // Centrer la carte
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert(
            'Impossible de récupérer votre position. Veuillez autoriser la géolocalisation.'
          );
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  const currentLat = latitude || userLocation?.lat;
  const currentLng = longitude || userLocation?.lng;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Position sur la carte
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetLocation}
          className="gap-2"
        >
          <MapPin className="w-4 h-4" />
          Ma position
        </Button>
      </div>

      {/* Conteneur de la carte */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100"
      />

      {currentLat && currentLng && (
        <div className="flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Latitude:</span>{' '}
            <span className="font-mono">{currentLat.toFixed(6)}</span>
          </div>
          <div>
            <span className="font-medium">Longitude:</span>{' '}
            <span className="font-mono">{currentLng.toFixed(6)}</span>
          </div>
        </div>
      )}

      {!mapLoaded && (
        <div className="w-full h-64 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Chargement de la carte...</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Glissez le marqueur ou cliquez sur la carte pour définir la position
        exacte de votre zone WiFi.
      </p>
    </div>
  );
}
