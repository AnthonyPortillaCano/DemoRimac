import axios from 'axios';
import { WeatherData } from '../types';
import { logger } from '../utils/logger';

export class WeatherService {
  private readonly baseUrl = 'http://api.weatherapi.com/v1';
  private readonly apiKey = process.env.WEATHER_API_KEY || 'demo-key';
  private readonly cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get weather data for a specific location
   */
  async getWeatherByLocation(location: string): Promise<WeatherData> {
    try {
      const cacheKey = `weather_${location}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.info('Returning cached weather data');
        return cached;
      }

      if (!this.apiKey || this.apiKey === 'demo-key') {
        if (process.env['IS_OFFLINE']) {
          logger.warn('WEATHER_API_KEY missing, returning fallback weather');
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

      const weatherData = response.data as WeatherData;
      
      // Cache the result
      this.setCache(cacheKey, weatherData);
      
      logger.info(`Fetched weather for: ${location}`);
      return weatherData;
    } catch (error) {
      if (process.env['IS_OFFLINE']) {
        logger.warn('WeatherAPI unavailable, returning fallback weather');
        const fallback = this.fallbackWeather(location);
        this.setCache(`weather_${location}`, fallback);
        return fallback;
      }
      logger.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather data for multiple locations
   */
  async getWeatherForMultipleLocations(locations: string[]): Promise<WeatherData[]> {
    try {
      const weatherPromises = locations.map(location => 
        this.getWeatherByLocation(location)
      );
      
      const weatherData = await Promise.all(weatherPromises);
      logger.info(`Fetched weather for ${locations.length} locations`);
      
      return weatherData;
    } catch (error) {
      logger.error('Error fetching multiple weather data:', error);
      throw new Error('Failed to fetch multiple weather data');
    }
  }

  /**
   * Get weather data for Star Wars planets (using fictional coordinates)
   */
  async getWeatherForStarWarsPlanet(planetName: string): Promise<WeatherData> {
    // Map Star Wars planets to real-world locations for weather data
    const planetMappings: Record<string, string> = {
      'Tatooine': 'Tunisia', // Desert climate
      'Hoth': 'Antarctica', // Ice planet
      'Endor': 'Redwood National Park', // Forest moon
      'Coruscant': 'New York', // City planet
      'Naboo': 'Italy', // Beautiful landscapes
      'Kamino': 'Scotland', // Oceanic
      'Mustafar': 'Hawaii', // Volcanic
      'Dagobah': 'Amazon Rainforest', // Swamp
      'Bespin': 'Switzerland', // Gas giant (mountainous)
      'Alderaan': 'Sweden' // Peaceful, destroyed
    };

    const realLocation = planetMappings[planetName] || 'London';
    return this.getWeatherByLocation(realLocation);
  }

  /**
   * Simple GET with 2 retries
   */
  private async getWithRetry(url: string, params: Record<string, string>, attempts: number = 2): Promise<{ data: any }> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await axios.get(url, { params });
      } catch (err) {
        lastError = err;
        await new Promise(res => setTimeout(res, 150));
      }
    }
    throw lastError;
  }

  /**
   * Fallback weather when offline/missing key
   */
  private fallbackWeather(location: string): WeatherData {
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

  /**
   * Get data from cache if it's still valid
   */
  private getFromCache(key: string): WeatherData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: WeatherData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Weather service cache cleared');
  }
} 