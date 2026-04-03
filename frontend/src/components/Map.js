import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({ stations, onStationClick }) => {
  useEffect(() => {
    const map = L.map('map').setView([56.01839, 92.86717], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(map);

    stations.forEach(station => {
      const marker = L.marker([station.lat, station.lon]).addTo(map);
      marker.bindPopup(`<b>${station.name}</b><br>Нажмите для данных`);
      marker.on('click', () => onStationClick(station));
    });

    return () => map.remove();
  }, [stations, onStationClick]);

  return <div id="map" style={{ height: '100%', width: '100%' }} />;
};

export default Map;