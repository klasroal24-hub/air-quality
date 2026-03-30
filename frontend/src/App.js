import React, { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import axios from 'axios';

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Загружаем станции
  useEffect(() => {
    axios.get(`${apiUrl}/stations`)
      .then(response => setStations(response.data.stations))
      .catch(error => console.error('Ошибка загрузки станций:', error));
  }, [apiUrl]);

  // Функция загрузки данных
  const fetchAirQuality = async (station) => {
    setLoading(true);
    setSelectedStation(station);
    try {
      const response = await axios.get(
        `${apiUrl}/air-quality/${station.lat}/${station.lon}?station_name=${station.name}`
      );
      setAirQuality(response.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
    setLoading(false);
  };

  // Автообновление каждые 30 секунд, если выбрана станция
  useEffect(() => {
    if (!selectedStation) return;
    const interval = setInterval(() => {
      fetchAirQuality(selectedStation);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedStation]);

  const getAQIColor = (aqi) => {
    switch(aqi) {
      case 1: return '#00ff88';
      case 2: return '#ffff44';
      case 3: return '#ffaa44';
      case 4: return '#ff6644';
      case 5: return '#ff4444';
      default: return '#ffffff';
    }
  };

  const getAQIText = (aqi) => {
    switch(aqi) {
      case 1: return 'Хорошо';
      case 2: return 'Умеренно';
      case 3: return 'Чувствительным вредно';
      case 4: return 'Вредно';
      case 5: return 'Опасно';
      default: return 'Нет данных';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌍 Мониторинг качества воздуха</h1>
        <h2 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>Красноярск — районы города</h2>
        {lastUpdate && <div className="last-update">🔄 Обновлено: {lastUpdate}</div>}
        <div className="auto-refresh">⏱ Автообновление каждые 30 секунд</div>
      </header>
      
      <div className="main-container">
        <div className="sidebar">
          <h2>📍 Районы Красноярска</h2>
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

          {loading && <div className="loading">Загрузка данных...</div>}

          {airQuality && (
            <div className="air-quality-info">
              <h3>
                {selectedStation?.name}
                <span 
                  className="aqi-badge"
                  style={{background: getAQIColor(airQuality.list[0].main.aqi)}}
                >
                  {getAQIText(airQuality.list[0].main.aqi)}
                </span>
              </h3>
              
              <div className="quality-grid">
                <div className="quality-card">
                  <div className="label">Индекс AQI</div>
                  <div className="value">{airQuality.list[0].main.aqi}/5</div>
                </div>
                <div className="quality-card">
                  <div className="label">PM2.5</div>
                  <div className="value">{airQuality.list[0].components.pm2_5} мкг/м³</div>
                </div>
                <div className="quality-card">
                  <div className="label">PM10</div>
                  <div className="value">{airQuality.list[0].components.pm10} мкг/м³</div>
                </div>
                <div className="quality-card">
                  <div className="label">NO₂</div>
                  <div className="value">{airQuality.list[0].components.no2} мкг/м³</div>
                </div>
                <div className="quality-card">
                  <div className="label">SO₂</div>
                  <div className="value">{airQuality.list[0].components.so2} мкг/м³</div>
                </div>
                <div className="quality-card">
                  <div className="label">CO</div>
                  <div className="value">{airQuality.list[0].components.co} мкг/м³</div>
                </div>
              </div>
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