// src/App.js
import "regenerator-runtime/runtime"; // ensures async/await works across environments
import React, { useState, useRef, useEffect } from "react";
import "../styles/App.css";

const API_KEY = process.env.REACT_APP_API_KEY;
console.log("🔑 API KEY:", process.env.REACT_APP_API_KEY);


function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  useEffect(() => {
    // cleanup on unmount: abort any running fetch
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const fetchWeather = async () => {
    if (!query.trim()) {
      setError("Please enter a city name.");
      return;
    }

    if (!API_KEY) {
      setError(
        "API key is missing. Make sure you created .env with REACT_APP_API_KEY and restarted the dev server."
      );
      return;
    }

    setError("");
    setWeather(null);

    // AbortController so we can cancel if component unmounts or user triggers another request
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        query
      )}&appid=${API_KEY}&units=metric`;

      const res = await fetch(url, { signal });

      // If API returns non-2xx, parse and show message
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.message || `Error fetching weather (status ${res.status})`;
        setError(msg);
        return;
      }

      const data = await res.json();
      setWeather(data);
    } catch (err) {
      if (err.name === "AbortError") {
        // fetch was aborted — ignore
        console.log("Fetch aborted");
      } else {
        console.error(err);
        setError("Network error. Try again later.");
      }
    } finally {
      controllerRef.current = null;
    }
  };

  return (
    <div className="app">
      <h1>🌤 City Weather</h1>

      {/* NOTE: assignment asked to use class name 'search' for search input */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="search"
          type="text"
          placeholder="Enter city name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchWeather();
          }}
        />
        <button onClick={fetchWeather}>Search</button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* NOTE: assignment asked to use class name 'weather' for weather block */}
      {weather && weather.main && weather.weather && weather.sys && (
        <div className="weather">
          <h2>
            {weather.name}
            {weather.sys && weather.sys.country ? `, ${weather.sys.country}` : ""}
          </h2>
          <p className="temp">{Math.round(weather.main.temp)}°C</p>
          <p className="desc">{weather.weather[0].description}</p>
          <img
            alt={weather.weather[0].description}
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          />
        </div>
      )}
    </div>
  );
}

export default App;
