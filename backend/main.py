from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
import sqlite3
from datetime import datetime

load_dotenv()

app = FastAPI()

# Разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://air-quality-site.onrender.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect('air_quality.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS air_quality_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  station_name TEXT,
                  lat REAL,
                  lon REAL,
                  aqi INTEGER,
                  pm25 REAL,
                  pm10 REAL,
                  no2 REAL,
                  so2 REAL,
                  timestamp DATETIME)''')
    conn.commit()
    conn.close()

# Функция для сохранения данных
def save_to_db(station_name, lat, lon, data):
    try:
        conn = sqlite3.connect('air_quality.db')
        c = conn.cursor()
        c.execute('''INSERT INTO air_quality_history 
                     (station_name, lat, lon, aqi, pm25, pm10, no2, so2, timestamp)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (station_name, lat, lon,
                   data['list'][0]['main']['aqi'],
                   data['list'][0]['components']['pm2_5'],
                   data['list'][0]['components']['pm10'],
                   data['list'][0]['components']['no2'],
                   data['list'][0]['components']['so2'],
                   datetime.now()))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка сохранения в БД: {e}")
        return False

# Вызываем создание таблицы
init_db()

@app.get("/")
def root():
    return {"message": "API мониторинга воздуха работает"}

@app.get("/air-quality/{lat}/{lon}")
def get_air_quality(lat: float, lon: float, station_name: str = "Unknown"):
    if not API_KEY:
        return {
            "list": [{
                "main": {"aqi": 2},
                "components": {
                    "pm2_5": 12.5,
                    "pm10": 23.0,
                    "no2": 15.3,
                    "so2": 5.2,
                    "co": 169.95
                }
            }]
        }
    
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        save_to_db(station_name, lat, lon, data)
        return data
    except requests.exceptions.RequestException as e:
        print(f"Ошибка API: {e}")
        return {
            "list": [{
                "main": {"aqi": 2},
                "components": {
                    "pm2_5": 12.5,
                    "pm10": 23.0,
                    "no2": 15.3,
                    "so2": 5.2,
                    "co": 169.95
                }
            }]
        }

@app.get("/weather/{lat}/{lon}")
def get_weather(lat: float, lon: float):
    if not API_KEY:
        return {"error": "API key not set"}
    
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=ru"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

@app.get("/stations")
def get_stations():
    return {
        "stations": [
            {"id": 1, "name": "Центральный район", "lat": 56.01839, "lon": 92.86717},
            {"id": 2, "name": "Свердловский район", "lat": 56.01500, "lon": 92.89600},
            {"id": 3, "name": "Октябрьский район", "lat": 56.02800, "lon": 92.88100},
            {"id": 4, "name": "Железнодорожный район", "lat": 56.03800, "lon": 92.89800},
            {"id": 5, "name": "Ленинский район", "lat": 56.00800, "lon": 92.90400},
            {"id": 6, "name": "Кировский район", "lat": 55.99800, "lon": 92.88700},
            {"id": 7, "name": "Советский район", "lat": 56.03000, "lon": 92.84500}
        ]
    }

@app.get("/history/{station_name}")
def get_history(station_name: str, limit: int = 10):
    conn = sqlite3.connect('air_quality.db')
    c = conn.cursor()
    c.execute('''SELECT * FROM air_quality_history 
                 WHERE station_name = ? 
                 ORDER BY timestamp DESC 
                 LIMIT ?''', (station_name, limit))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            'id': row[0],
            'station_name': row[1],
            'lat': row[2],
            'lon': row[3],
            'aqi': row[4],
            'pm25': row[5],
            'pm10': row[6],
            'no2': row[7],
            'so2': row[8],
            'timestamp': row[9]
        })
    return {'history': history}