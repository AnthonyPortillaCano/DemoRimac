"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class WeatherService {
    baseUrl = 'http://api.weatherapi.com/v1';
    apiKey = process.env.WEATHER_API_KEY || 'demo-key';
    cache = new Map();
    cacheTTL = 30 * 60 * 1000;
    async getWeatherByLocation(location) {
        try {
            const cacheKey = `weather_${location}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger_1.logger.info('Returning cached weather data');
                return cached;
            }
            if (!this.apiKey || this.apiKey === 'demo-key') {
                if (process.env['IS_OFFLINE']) {
                    logger_1.logger.warn('WEATHER_API_KEY missing, returning fallback weather');
                    const fallback = this.fallbackWeather(location);
                    this.setCache(cacheKey, fallback);
                    return fallback;
                }
            }
            const response = await this.getWithRetry(`${this.baseUrl}/current.json`, {
                key: this.apiKey,
                q: location,
                aqi: 'no'
            });
            const weatherData = response.data;
            this.setCache(cacheKey, weatherData);
            logger_1.logger.info(`Fetched weather for: ${location}`);
            return weatherData;
        }
        catch (error) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('WeatherAPI unavailable, returning fallback weather');
                const fallback = this.fallbackWeather(location);
                this.setCache(`weather_${location}`, fallback);
                return fallback;
            }
            logger_1.logger.error('Error fetching weather data:', error);
            throw new Error('Failed to fetch weather data');
        }
    }
    async getWeatherForMultipleLocations(locations) {
        try {
            const weatherPromises = locations.map(location => this.getWeatherByLocation(location));
            const weatherData = await Promise.all(weatherPromises);
            logger_1.logger.info(`Fetched weather for ${locations.length} locations`);
            return weatherData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching multiple weather data:', error);
            throw new Error('Failed to fetch multiple weather data');
        }
    }
    async getWeatherForStarWarsPlanet(planetName) {
        const planetMappings = {
            'Tatooine': 'Tunisia',
            'Hoth': 'Antarctica',
            'Endor': 'Redwood National Park',
            'Coruscant': 'New York',
            'Naboo': 'Italy',
            'Kamino': 'Scotland',
            'Mustafar': 'Hawaii',
            'Dagobah': 'Amazon Rainforest',
            'Bespin': 'Switzerland',
            'Alderaan': 'Sweden'
        };
        const realLocation = planetMappings[planetName] || 'London';
        return this.getWeatherByLocation(realLocation);
    }
    async getWithRetry(url, params, attempts = 2) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
            try {
                return await axios_1.default.get(url, { params });
            }
            catch (err) {
                lastError = err;
                await new Promise(res => setTimeout(res, 150));
            }
        }
        throw lastError;
    }
    fallbackWeather(location) {
        return {
            location: {
                name: location,
                region: location,
                country: 'Unknown',
                lat: 0,
                lon: 0,
                tz_id: 'UTC',
                localtime_epoch: Math.floor(Date.now() / 1000),
                localtime: new Date().toISOString()
            },
            current: {
                last_updated_epoch: Math.floor(Date.now() / 1000),
                last_updated: new Date().toISOString(),
                temp_c: 24.5,
                temp_f: 76.1,
                is_day: 1,
                condition: {
                    text: 'Sunny',
                    icon: '',
                    code: 1000
                },
                wind_mph: 5,
                wind_kph: 8,
                wind_degree: 90,
                wind_dir: 'E',
                pressure_mb: 1015,
                pressure_in: 29.97,
                precip_mm: 0,
                precip_in: 0,
                humidity: 55,
                cloud: 10,
                feelslike_c: 25,
                feelslike_f: 77,
                vis_km: 10,
                vis_miles: 6,
                uv: 5,
                gust_mph: 8,
                gust_kph: 13
            }
        };
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('Weather service cache cleared');
    }
}
exports.WeatherService = WeatherService;
//# sourceMappingURL=weatherService.js.map