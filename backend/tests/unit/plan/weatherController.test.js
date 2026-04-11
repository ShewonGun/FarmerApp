// tests/plan/weatherController.test.js
// Unit tests for weatherController: getWeatherByCity, getWeatherForecast, getSriLankaCities

import {
  getWeatherByCity,
  getWeatherForecast,
  getSriLankaCities,
} from "../../../controllers/adminControllers/weatherController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("axios");
import axios from "axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeAxiosError = (status) => {
  const err = new Error("Axios error");
  err.response = { status };
  return err;
};

const MOCK_WEATHER_RESPONSE = {
  data: {
    name: "Colombo",
    sys: { country: "LK", sunrise: 1700000000, sunset: 1700043600 },
    main: { temp: 30.4, feels_like: 34.1, humidity: 78 },
    weather: [{ description: "light rain", icon: "10d" }],
    wind: { speed: 3.5 },
    visibility: 9000,
    coord: { lat: 6.9271, lon: 79.8612 },
  },
};

const MOCK_FORECAST_RESPONSE = {
  data: {
    city: { name: "Colombo", country: "LK" },
    list: [
      {
        dt: 1700000000,
        main: { temp: 30 },
        weather: [{ description: "light rain", icon: "10d" }],
      },
      {
        dt: 1700010800,
        main: { temp: 28 },
        weather: [{ description: "overcast clouds", icon: "04d" }],
      },
    ],
  },
};

// ─── getWeatherByCity ─────────────────────────────────────────────────────────
describe("getWeatherByCity", () => {
  test("should return 400 if city query param is missing", async () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "City name is required." })
    );
  });

  test("should return 500 if OPENWEATHER_API_KEY is not set", async () => {
    const original = process.env.OPENWEATHER_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OpenWeather API key is not configured." })
    );

    process.env.OPENWEATHER_API_KEY = original;
  });

  test("should return 200 with formatted weather data on success", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockResolvedValue(MOCK_WEATHER_RESPONSE);

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/weather"),
      expect.objectContaining({
        params: expect.objectContaining({ q: "Colombo,LK", units: "metric" }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Colombo",
        country: "LK",
        temperature: 30,
        feelsLike: 34,
        humidity: 78,
        description: "light rain",
        windSpeed: 3.5,
        visibility: 9,
        coordinates: { lat: 6.9271, lon: 79.8612 },
      })
    );
  });

  test("should include a valid iconUrl in the response", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockResolvedValue(MOCK_WEATHER_RESPONSE);

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.iconUrl).toMatch(/^https:\/\/openweathermap\.org\/img\/wn\/.+@2x\.png$/);
  });

  test("should return 404 if city is not found (axios 404)", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockRejectedValue(makeAxiosError(404));

    const req = mockRequest({ query: { city: "UnknownCity" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: `City "UnknownCity" not found in Sri Lanka.` })
    );
  });

  test("should return 401 if API key is invalid (axios 401)", async () => {
    process.env.OPENWEATHER_API_KEY = "bad-key";
    axios.get.mockRejectedValue(makeAxiosError(401));

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid OpenWeather API key." })
    );
  });

  test("should return 500 on unexpected axios error", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockRejectedValue(new Error("Network error"));

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to fetch weather data." })
    );
  });

  test("should set visibility to null when not provided", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    const responseWithoutVisibility = {
      data: {
        ...MOCK_WEATHER_RESPONSE.data,
        visibility: undefined,
      },
    };
    axios.get.mockResolvedValue(responseWithoutVisibility);

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherByCity(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.visibility).toBeNull();
  });
});

// ─── getWeatherForecast ───────────────────────────────────────────────────────
describe("getWeatherForecast", () => {
  test("should return 400 if city query param is missing", async () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "City name is required." })
    );
  });

  test("should return 500 if OPENWEATHER_API_KEY is not set", async () => {
    const original = process.env.OPENWEATHER_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OpenWeather API key is not configured." })
    );

    process.env.OPENWEATHER_API_KEY = original;
  });

  test("should return 200 with grouped forecast data on success", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockResolvedValue(MOCK_FORECAST_RESPONSE);

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/forecast"),
      expect.objectContaining({
        params: expect.objectContaining({ q: "Colombo,LK", units: "metric", cnt: 40 }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toMatchObject({
      city: "Colombo",
      country: "LK",
    });
    expect(Array.isArray(jsonArg.forecast)).toBe(true);
  });

  test("each forecast day should contain required fields", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockResolvedValue(MOCK_FORECAST_RESPONSE);

    const req = mockRequest({ query: { city: "Kandy" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    const { forecast } = res.json.mock.calls[0][0];
    forecast.forEach((day) => {
      expect(day).toHaveProperty("date");
      expect(day).toHaveProperty("minTemp");
      expect(day).toHaveProperty("maxTemp");
      expect(day).toHaveProperty("description");
      expect(day).toHaveProperty("icon");
      expect(day).toHaveProperty("iconUrl");
      expect(day.iconUrl).toMatch(/^https:\/\/openweathermap\.org\/img\/wn\/.+@2x\.png$/);
    });
  });

  test("minTemp should be <= maxTemp for each forecast day", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockResolvedValue(MOCK_FORECAST_RESPONSE);

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    const { forecast } = res.json.mock.calls[0][0];
    forecast.forEach((day) => {
      expect(day.minTemp).toBeLessThanOrEqual(day.maxTemp);
    });
  });

  test("should return 404 if city is not found (axios 404)", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockRejectedValue(makeAxiosError(404));

    const req = mockRequest({ query: { city: "UnknownCity" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: `City "UnknownCity" not found in Sri Lanka.` })
    );
  });

  test("should return 401 if API key is invalid (axios 401)", async () => {
    process.env.OPENWEATHER_API_KEY = "bad-key";
    axios.get.mockRejectedValue(makeAxiosError(401));

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid OpenWeather API key." })
    );
  });

  test("should return 500 on unexpected axios error", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    axios.get.mockRejectedValue(new Error("Network timeout"));

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to fetch forecast data." })
    );
  });

  test("should limit forecast to at most 5 days", async () => {
    process.env.OPENWEATHER_API_KEY = "test-api-key";

    // Build 6 days worth of forecast items (8 items each, one per 3h)
    const now = Math.floor(Date.now() / 1000);
    const list = [];
    for (let day = 0; day < 6; day++) {
      for (let i = 0; i < 8; i++) {
        list.push({
          dt: now + day * 86400 + i * 10800,
          main: { temp: 28 + day },
          weather: [{ description: "clear sky", icon: "01d" }],
        });
      }
    }

    axios.get.mockResolvedValue({
      data: { city: { name: "Colombo", country: "LK" }, list },
    });

    const req = mockRequest({ query: { city: "Colombo" } });
    const res = mockResponse();

    await getWeatherForecast(req, res);

    const { forecast } = res.json.mock.calls[0][0];
    expect(forecast.length).toBeLessThanOrEqual(5);
  });
});

// ─── getSriLankaCities ────────────────────────────────────────────────────────
describe("getSriLankaCities", () => {
  test("should return 200 with a cities array", () => {
    const req = mockRequest();
    const res = mockResponse();

    getSriLankaCities(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty("cities");
    expect(Array.isArray(jsonArg.cities)).toBe(true);
  });

  test("should include known Sri Lanka cities", () => {
    const req = mockRequest();
    const res = mockResponse();

    getSriLankaCities(req, res);

    const { cities } = res.json.mock.calls[0][0];
    expect(cities).toContain("Colombo");
    expect(cities).toContain("Kandy");
    expect(cities).toContain("Galle");
  });

  test("should return a non-empty cities list", () => {
    const req = mockRequest();
    const res = mockResponse();

    getSriLankaCities(req, res);

    const { cities } = res.json.mock.calls[0][0];
    expect(cities.length).toBeGreaterThan(0);
  });
});

