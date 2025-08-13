import { StarWarsService } from './starWarsService';
import { WeatherService } from './weatherService';
import { FusedData, StarWarsCharacter, StarWarsPlanet, WeatherData } from '../types';
import { logger } from '../utils/logger';

export class FusionService {
  constructor(
    private readonly starWarsService: StarWarsService,
    private readonly weatherService: WeatherService
  ) {}

  /**
   * Fuse Star Wars character data with weather data from their homeworld
   */
  async fuseCharacterWithWeather(): Promise<FusedData> {
    try {
      logger.info('Starting data fusion process');
      
      // Get random Star Wars character
      const character = await this.starWarsService.getRandomCharacter();
      logger.info(`Selected character: ${character.name}`);
      
      // Get planet information (handle undefined return vs explicit rejection)
      let planet: StarWarsPlanet | undefined;
      try {
        planet = await this.starWarsService.getPlanetByUrl(character.homeworld);
      } catch (err) {
        logger.error('Error fetching planet information:', err);
        throw new Error('Failed to fuse data from APIs');
      }

      if (!planet) {
        logger.warn('Planet data undefined, using fallback planet');
        planet = {
          name: 'Unknown',
          rotation_period: 'unknown',
          orbital_period: 'unknown',
          diameter: 'unknown',
          climate: 'unknown',
          gravity: 'unknown',
          terrain: 'unknown',
          surface_water: 'unknown',
          population: 'unknown',
          residents: [],
          films: [],
          created: '',
          edited: '',
          url: character.homeworld
        };
      }
      logger.info(`Selected planet: ${planet.name}`);
      
      // Get weather data for the planet (mapped to real location). If undefined, fallback; if rejected, throw.
      let weather: WeatherData | undefined;
      try {
        weather = await this.weatherService.getWeatherForStarWarsPlanet(planet.name);
      } catch (err) {
        logger.error('Error fetching weather data:', err);
        throw new Error('Failed to fuse data from APIs');
      }

      if (!weather) {
        logger.warn('Weather data undefined, using fallback weather');
        weather = {
          location: {
            name: planet.name,
            region: planet.name,
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
            temp_c: 0,
            temp_f: 32,
            is_day: 1,
            condition: {
              text: 'Unknown',
              icon: '',
              code: 0
            },
            wind_mph: 0,
            wind_kph: 0,
            wind_degree: 0,
            wind_dir: 'N',
            pressure_mb: 0,
            pressure_in: 0,
            precip_mm: 0,
            precip_in: 0,
            humidity: 0,
            cloud: 0,
            feelslike_c: 0,
            feelslike_f: 32,
            vis_km: 0,
            vis_miles: 0,
            uv: 0,
            gust_mph: 0,
            gust_kph: 0
          }
        };
      }
      logger.info(`Fetched weather for ${planet.name}`);
      
      // Create fused data
      const fusedData: FusedData = {
        character,
        planet,
        weather,
        fusion_timestamp: Date.now()
      };
      
      logger.info('Data fusion completed successfully');
      return fusedData;
    } catch (error) {
      logger.error('Error in data fusion:', error);
      throw new Error('Failed to fuse data from APIs');
    }
  }

  /**
   * Fuse multiple characters with weather data
   */
  async fuseMultipleCharacters(count: number = 3): Promise<FusedData[]> {
    try {
      logger.info(`Starting fusion of ${count} characters`);
      
      const characters = await this.starWarsService.getCharacters(count);
      const fusedDataPromises = characters.map(async (character) => {
        const planet = await this.starWarsService.getPlanetByUrl(character.homeworld);
        const weather = await this.weatherService.getWeatherForStarWarsPlanet(planet.name);
        
        return {
          character,
          planet,
          weather,
          fusion_timestamp: Date.now()
        } as FusedData;
      });
      
      const results = await Promise.all(fusedDataPromises);
      logger.info(`Successfully fused ${results.length} characters`);
      
      return results;
    } catch (error) {
      logger.error('Error fusing multiple characters:', error);
      throw new Error('Failed to fuse multiple characters');
    }
  }

  /**
   * Process and normalize the fused data
   */
  processFusedData(fusedData: FusedData): FusedData {
    try {
      // Normalize character data
      const normalizedCharacter = {
        ...fusedData.character,
        height: this.normalizeHeight(String(fusedData.character.height)),
        mass: this.normalizeMass(String(fusedData.character.mass)),
        birth_year: this.normalizeBirthYear(fusedData.character.birth_year)
      };
      
      // Normalize planet data
      const normalizedPlanet = {
        ...fusedData.planet,
        diameter: this.normalizeDiameter(String(fusedData.planet.diameter)),
        population: this.normalizePopulation(String(fusedData.planet.population))
      };
      
      // Normalize weather data safely
      const hasCurrent = Boolean((fusedData.weather as any)?.current);
      const normalizedWeather = hasCurrent
        ? {
            ...fusedData.weather,
            current: {
              ...fusedData.weather.current,
              temp_c: Math.round(fusedData.weather.current.temp_c * 10) / 10,
              humidity: Math.round(fusedData.weather.current.humidity),
              pressure_mb: Math.round(fusedData.weather.current.pressure_mb)
            }
          }
        : fusedData.weather;
      
      return {
        character: normalizedCharacter,
        planet: normalizedPlanet,
        weather: normalizedWeather,
        fusion_timestamp: fusedData.fusion_timestamp
      };
    } catch (error) {
      logger.error('Error processing fused data:', error);
      // Instead of returning original data unmodified, attempt partial normalization fallbacks
      const safeCharacter = {
        ...fusedData.character,
        height: this.normalizeHeight(String(fusedData.character.height)),
        mass: this.normalizeMass(String(fusedData.character.mass)),
        birth_year: this.normalizeBirthYear(fusedData.character.birth_year)
      };
      const safePlanet = {
        ...fusedData.planet,
        diameter: this.normalizeDiameter(String(fusedData.planet.diameter)),
        population: this.normalizePopulation(String(fusedData.planet.population))
      };
      return {
        character: safeCharacter,
        planet: safePlanet,
        weather: fusedData.weather,
        fusion_timestamp: fusedData.fusion_timestamp
      };
    }
  }

  /**
   * Normalize height from string to number (cm)
   */
  private normalizeHeight(height: string): number {
    if (height.toLowerCase() === 'unknown') return 0;
    const heightNum = parseInt(height, 10);
    return isNaN(heightNum) ? 0 : heightNum;
  }

  /**
   * Normalize mass from string to number (kg)
   */
  private normalizeMass(mass: string): number {
    if (mass.toLowerCase() === 'unknown') return 0;
    const massNum = parseInt(mass, 10);
    return isNaN(massNum) ? 0 : massNum;
  }

  /**
   * Normalize birth year from BBY/ABY format
   */
  private normalizeBirthYear(birthYear: string): string {
    if (birthYear === 'unknown') return 'Unknown';
    return birthYear.replace('BBY', ' Before Battle of Yavin').replace('ABY', ' After Battle of Yavin');
  }

  /**
   * Normalize diameter from string to number (km)
   */
  private normalizeDiameter(diameter: string): number {
    if (diameter.toLowerCase() === 'unknown') return 0;
    const diameterNum = parseInt(diameter, 10);
    return isNaN(diameterNum) ? 0 : diameterNum;
  }

  /**
   * Normalize population from string to number
   */
  private normalizePopulation(population: string): number {
    if (population.toLowerCase() === 'unknown') return 0;
    const populationNum = parseInt(population, 10);
    return isNaN(populationNum) ? 0 : populationNum;
  }
} 