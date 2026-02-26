import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MdSearch, MdLocationOn, MdRefresh, MdEco, MdWbSunny } from "react-icons/md";
import WeatherAnimation from "../../Components/UserComponents/WeatherAnimation";

const API_BASE = "http://localhost:5000/api/weather";

const formatTime = (unix) =>
  new Date(unix * 1000).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });

const getFarmingTip = (weather) => {
  const d = weather.description.toLowerCase();
  if (weather.humidity > 80) return "High humidity - watch for fungal diseases. Ensure ventilation in greenhouses.";
  if (weather.humidity < 40) return "Low humidity - consider irrigating crops and protecting moisture-sensitive plants.";
  if (d.includes("rain")) return "Rain expected - hold off on pesticide spraying. Good time for transplanting seedlings.";
  if (weather.temperature > 34) return "High temperature - water crops early morning or evening to reduce evaporation.";
  return "Conditions are favourable for most field activities today.";
};

const WeatherPage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Colombo");
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/cities`).then((r) => setCities(r.data.cities)).catch(() => {});
  }, []);

  const fetchWeather = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, fRes] = await Promise.all([
        axios.get(`${API_BASE}?city=${encodeURIComponent(city)}`),
        axios.get(`${API_BASE}/forecast?city=${encodeURIComponent(city)}`),
      ]);
      setWeather(wRes.data);
      setForecast(fRes.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch weather data.");
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-emerald-600 dark:text-emerald-400 font-['Sora']">
              Sri Lanka
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white font-['Sora'] mt-0.5">
              Weather
            </h1>
          </div>
          {weather && !loading && (
            <button
              onClick={() => fetchWeather(selectedCity)}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5">
            <MdSearch className="text-lg text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              placeholder="Search city..."
              className="flex-1 bg-transparent text-sm font-['Sora'] text-slate-800 dark:text-white placeholder-slate-400 outline-none"
            />
            <span className="flex items-center gap-0.5 text-xs text-slate-400 font-['Sora']">
              <MdLocationOn className="text-emerald-500" />
              {selectedCity}
            </span>
          </div>

          {showDropdown && filteredCities.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md max-h-52 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onMouseDown={() => { setSelectedCity(city); setSearch(""); setShowDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-['Sora'] transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                    city === selectedCity
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {showDropdown && <div className="fixed inset-0 z-9" onClick={() => setShowDropdown(false)} />}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-center text-sm text-red-500 dark:text-red-400 font-['Sora'] py-10">{error}</p>
        )}

        {/* Current weather */}
        {weather && !loading && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">

            {/* Top section */}
            <div className="px-6 pt-6 pb-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-['Sora'] capitalize">{weather.description}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-6xl font-semibold text-slate-900 dark:text-white font-['Sora'] leading-none tracking-tight">
                    {weather.temperature}&deg;
                  </span>
                  <span className="text-lg text-slate-400 font-['Sora'] mb-1">C</span>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-['Sora'] flex items-center gap-1">
                  <MdLocationOn className="text-emerald-500 text-base shrink-0" />
                  {weather.city}, Sri Lanka
                </p>
              </div>
              <WeatherAnimation description={weather.description} size={80} />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Stats grid */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
              {[
                { label: "Humidity", value: `${weather.humidity}%` },
                { label: "Wind", value: `${weather.windSpeed} m/s` },
                { label: "Feels like", value: `${weather.feelsLike}\u00B0C` },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 font-['Sora']">{s.label}</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-white font-['Sora'] mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Sun times */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                {/* Sunrise */}
                <div className="flex items-center gap-2.5">
                 
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-['Sora']">Sunrise</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white font-['Sora']">{formatTime(weather.sunrise)}</p>
                  </div>
                </div>
                {/* Sun icon center */}
                <MdWbSunny className="text-xl text-amber-400 opacity-60" />
                {/* Sunset */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-['Sora']">Sunset</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white font-['Sora']">{formatTime(weather.sunset)}</p>
                  </div>
                  
                </div>
              </div>
              {/* Sun arc progress */}
              <div className="relative h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                {(() => {
                  const now = Date.now() / 1000;
                  const pct = Math.min(100, Math.max(0, ((now - weather.sunrise) / (weather.sunset - weather.sunrise)) * 100));
                  return (
                    <>
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400"
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-slate-800 shadow"
                        style={{ left: `calc(${pct}% - 6px)` }}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 5-day forecast */}
        {forecast && !loading && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shadow-sm">
            <p className="px-5 pt-4 pb-3 text-xs font-medium uppercase tracking-widest text-slate-400 font-['Sora']">
              5-Day Forecast
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {forecast.forecast.map((day, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-['Sora'] w-28">{day.date}</p>
                  <div className="flex items-center gap-2 flex-1">
                    <WeatherAnimation description={day.description} size={36} />
                    <p className="text-xs text-slate-400 font-['Sora'] capitalize hidden sm:block">{day.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-['Sora']">
                    <span className="font-medium text-slate-800 dark:text-white">{day.maxTemp}&deg;</span>
                    <span className="text-slate-400">{day.minTemp}&deg;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farming insight */}
        {weather && !loading && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-md shadow-sm">
            <MdEco className="text-xl mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-['Sora'] leading-relaxed">
              {getFarmingTip(weather)}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default WeatherPage;
