import axios from "axios";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Popular cities in Sri Lanka for quick selection
const SRI_LANKA_CITIES = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Negombo",
  "Trincomalee",
  "Anuradhapura",
  "Polonnaruwa",
  "Kurunegala",
  "Ratnapura",
  "Matara",
  "Badulla",
  "Batticaloa",
  "Hambantota",
  "Nuwara Eliya",
  "Matale",
  "Ampara",
  "Vavuniya",
  "Mannar",
  "Kalutara",
];

// GET /api/weather?city=Colombo
export const getWeatherByCity = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ message: "City name is required." });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "OpenWeather API key is not configured." });
  }

  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: `${city},LK`,
        appid: apiKey,
        units: "metric",
      },
    });

    const data = response.data;

    const weather = {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      windSpeed: data.wind.speed,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
    };

    res.status(200).json(weather);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: `City "${city}" not found in Sri Lanka.` });
    }
    if (error.response?.status === 401) {
      return res.status(401).json({ message: "Invalid OpenWeather API key." });
    }
    res.status(500).json({ message: "Failed to fetch weather data.", error: error.message });
  }
};

// GET /api/weather/forecast?city=Colombo  (5-day / 3-hour forecast)
export const getWeatherForecast = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ message: "City name is required." });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "OpenWeather API key is not configured." });
  }

  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: `${city},LK`,
        appid: apiKey,
        units: "metric",
        cnt: 40,
      },
    });

    const data = response.data;

    // Group forecasts by day
    const dailyMap = {};
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString("en-LK", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          temps: [],
          descriptions: [],
          icons: [],
        };
      }
      dailyMap[date].temps.push(item.main.temp);
      dailyMap[date].descriptions.push(item.weather[0].description);
      dailyMap[date].icons.push(item.weather[0].icon);
    });

    const forecast = Object.values(dailyMap).slice(0, 5).map((day) => ({
      date: day.date,
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)],
      icon: day.icons[Math.floor(day.icons.length / 2)],
      iconUrl: `https://openweathermap.org/img/wn/${
        day.icons[Math.floor(day.icons.length / 2)]
      }@2x.png`,
    }));

    res.status(200).json({
      city: data.city.name,
      country: data.city.country,
      forecast,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: `City "${city}" not found in Sri Lanka.` });
    }
    if (error.response?.status === 401) {
      return res.status(401).json({ message: "Invalid OpenWeather API key." });
    }
    res.status(500).json({ message: "Failed to fetch forecast data.", error: error.message });
  }
};

// GET /api/weather/cities
export const getSriLankaCities = (req, res) => {
  res.status(200).json({ cities: SRI_LANKA_CITIES });
};
