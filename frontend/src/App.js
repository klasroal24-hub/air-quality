import React, { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import axios from 'axios';

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:8000/stations')
      .then(response => setStations(response.data.stations))
      .catch(error => console.error('Ошибка загрузки станций:', error));
  }, []);

  const fetchAirQuality = async (station) => {
    setLoading(true);
    setSelectedStation(station);
    try {
      const response = await axios.get(
        `http://localhost:8000/air-quality/${station.lat}/${station.lon}?station_name=${station.name}`
      );
      setAirQuality(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
    setLoading(false);
  };

  const getAQIColor = (aqi) => {
    switch(aqi) {
      case 1: return '#00ff00';
      case 2: return '#ffff00';
      case 3: return '#ff9900';
      case 4: return '#ff0000';
      case 5: return '#990000';
      default: return '#808080';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌍 Мониторинг качества воздуха — Красноярск</h1>
      </header>
      
      <div className="main-container">
        <div className="sidebar">
          <h2>Станции мониторинга</h2>
          <ul className="stations-list">
            {stations.map(station => (
              <li 
                key={station.id}
                onClick={() => fetchAirQuality(station)}
                className={selectedStation?.id === station.id ? 'selected' : ''}
              >
                📍 {station.name}
              </li>
            ))}
          </ul>

          {loading && <p>Загрузка данных...</p>}

          {airQuality && (
            <div className="air-quality-info">
              <h3>Качество воздуха: {selectedStation?.name}</h3>
              <p>Индекс: 
                <span 
                  className="aqi-value"
                  style={{color: getAQIColor(airQuality.list[0].main.aqi)}}
                >
                  {airQuality.list[0].main.aqi}/5
                </span>
              </p>
              <p>PM2.5: {airQuality.list[0].components.pm2_5} мкг/м³</p>
              <p>PM10: {airQuality.list[0].components.pm10} мкг/м³</p>
              <p>NO2: {airQuality.list[0].components.no2} мкг/м³</p>
              <p>SO2: {airQuality.list[0].components.so2} мкг/м³</p>
            </div>
          )}
        </div>

        <div className="map-container">
          <Map 
            stations={stations}
            onStationClick={fetchAirQuality}
          />
        </div>
      </div>
    </div>
  );
}

export default App;