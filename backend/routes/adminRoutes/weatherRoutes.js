import express from "express";
import {
  getWeatherByCity,
  getWeatherForecast,
  getSriLankaCities,
} from "../../controllers/adminControllers/weatherController.js";

const router = express.Router();

router.get("/", getWeatherByCity);
router.get("/forecast", getWeatherForecast);
router.get("/cities", getSriLankaCities);

export default router;
