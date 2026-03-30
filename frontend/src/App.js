import React, { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import axios from 'axios';

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notification, setNotification] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Загружаем станции
  useEffect(() => {
    axios.get(`${apiUrl}/stations`)
      .then(response => setStations(response.data.stations))
      .catch(error => console.error('Ошибка загрузки станций:', error));
  }, [apiUrl]);

  // Функция загрузки данных о качестве воздуха
  const fetchAirQuality = async (station) => {
    setLoading(true);
    setSelectedStation(station);
    try {
      const response = await axios.get(
        `${apiUrl}/air-quality/${station.lat}/${station.lon}?station_name=${station.name}`
      );
      const newData = response.data;
      const aqi = newData.list[0].main.aqi;
      const oldAqi = airQuality?.list[0].main.aqi;
      
      // Проверка на ухудшение
      if (oldAqi && aqi > oldAqi) {
        setNotification({
          message: `⚠️ ВНИМАНИЕ! В районе ${station.name} качество воздуха ухудшилось!`,
          level: aqi
        });
        setTimeout(() => setNotification(null), 5000);
      }
      
      setAirQuality(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Сохраняем в историю
      setHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        aqi: aqi,
        pm25: newData.list[0].components.pm2_5
      }].slice(-10));
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
    setLoading(false);
  };

  // Загрузка погоды для Красноярска
  useEffect(() => {
    axios.get(`${apiUrl}/weather/56.01839/92.86717`)
      .then(response => setWeather(response.data))
      .catch(error => console.error('Ошибка загрузки погоды:', error));
  }, [apiUrl]);

  // Автообновление каждые 30 секунд
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

  const getRiskLevel = (aqi) => {
    switch(aqi) {
      case 1: return { text: 'Безопасно', color: '#00ff88' };
      case 2: return { text: 'Низкий риск', color: '#ffff44' };
      case 3: return { text: 'Средний риск', color: '#ffaa44' };
      case 4: return { text: 'Высокий риск', color: '#ff6644' };
      case 5: return { text: 'Опасность!', color: '#ff4444' };
      default: return { text: 'Нет данных', color: '#ffffff' };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌍 Мониторинг качества воздуха</h1>
        <h2 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>Красноярск — районы города</h2>
        
        {weather && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#88c0ff' }}>
            🌡 {Math.round(weather.main.temp)}°C | 💨 {weather.wind.speed} м/с | 💧 {weather.main.humidity}%
          </div>
        )}
        
        {lastUpdate && <div className="last-update">🔄 Обновлено: {lastUpdate}</div>}
        <div className="auto-refresh">⏱ Автообновление каждые 30 секунд</div>
      </header>
      
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          zIndex: 1000,
          animation: 'slideIn 0.5s ease'
        }}>
          {notification.message}
        </div>
      )}
      
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
              
              <div style={{ marginBottom: '10px' }}>
                <strong>⚠️ Уровень угрозы:</strong>{' '}
                <span style={{ color: getRiskLevel(airQuality.list[0].main.aqi).color }}>
                  {getRiskLevel(airQuality.list[0].main.aqi).text}
                </span>
              </div>
              
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
              
              {/* История замеров */}
              {history.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h4>📊 Последние замеры PM2.5</h4>
                  <div style={{ fontSize: '0.8rem' }}>
                    {history.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>{item.time}</span>
                        <span style={{ color: item.pm25 > 20 ? '#ff6644' : '#88c0ff' }}>
                          {item.pm25} мкг/м³
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;