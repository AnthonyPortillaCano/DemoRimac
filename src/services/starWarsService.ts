import axios from 'axios';
import { StarWarsCharacter, StarWarsPlanet } from '../types';
import { logger } from '../utils/logger';

export class StarWarsService {
  private readonly baseUrl = 'https://swapi.dev/api';
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get a random Star Wars character
   */
  async getRandomCharacter(): Promise<StarWarsCharacter> {
    try {
      const cacheKey = 'random_character';
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.info('Returning cached random character');
        return cached as StarWarsCharacter;
      }

      // Get total count of characters with retry
      const countResponse = await this.getWithRetry(`${this.baseUrl}/people/`);
      const totalCount = countResponse.data.count || 83; // SWAPI default known size fallback
      
      // Generate random ID between 1 and total count
      const randomId = Math.floor(Math.random() * totalCount) + 1;
      
      const response = await this.getWithRetry(`${this.baseUrl}/people/${randomId}/`);
      const character = response.data as StarWarsCharacter;
      
      // Cache the result
      this.setCache(cacheKey, character);
      
      logger.info(`Fetched random character: ${character.name}`);
      return character;
    } catch (error) {
      // Offline/dev fallback
      if (process.env['IS_OFFLINE']) {
        logger.warn('SWAPI unavailable, returning fallback character');
        const fallback: StarWarsCharacter = {
          name: 'Luke Skywalker',
          height: '172',
          mass: '77',
          hair_color: 'blond',
          skin_color: 'fair',
          eye_color: 'blue',
          birth_year: '19BBY',
          gender: 'male',
          homeworld: 'https://swapi.dev/api/planets/1/',
          films: ['https://swapi.dev/api/films/1/'],
          species: [],
          vehicles: ['https://swapi.dev/api/vehicles/30/'],
          starships: ['https://swapi.dev/api/starships/12/'],
          created: '',
          edited: '',
          url: 'https://swapi.dev/api/people/1/'
        };
        return fallback;
      }
      logger.error('Error fetching random character:', error);
      throw new Error('Failed to fetch Star Wars character');
    }
  }

  /**
   * Get planet information by URL
   */
  async getPlanetByUrl(planetUrl: string): Promise<StarWarsPlanet> {
    try {
      const cacheKey = `planet_${planetUrl}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.info('Returning cached planet data');
        return cached as StarWarsPlanet;
      }

      const response = await this.getWithRetry(planetUrl);
      const planet = response.data as StarWarsPlanet;
      
      // Cache the result
      this.setCache(cacheKey, planet);
      
      logger.info(`Fetched planet: ${planet.name}`);
      return planet;
    } catch (error) {
      if (process.env['IS_OFFLINE']) {
        logger.warn('SWAPI planet unavailable, returning fallback planet');
        const fallback: StarWarsPlanet = {
          name: 'Tatooine',
          rotation_period: '23',
          orbital_period: '304',
          diameter: '10465',
          climate: 'arid',
          gravity: '1 standard',
          terrain: 'desert',
          surface_water: '1',
          population: '200000',
          residents: ['https://swapi.dev/api/people/1/'],
          films: ['https://swapi.dev/api/films/1/'],
          created: '',
          edited: '',
          url: planetUrl
        };
        return fallback;
      }
      logger.error('Error fetching planet:', error);
      throw new Error('Failed to fetch planet information');
    }
  }

  /**
   * Get multiple characters (for variety)
   */
  async getCharacters(count: number = 3): Promise<StarWarsCharacter[]> {
    try {
      const characters: StarWarsCharacter[] = [];
      const usedIds = new Set<number>();
      
      while (characters.length < count) {
        const character = await this.getRandomCharacter();
        const characterId = this.extractIdFromUrl(character.url);
        
        if (!usedIds.has(characterId)) {
          characters.push(character);
          usedIds.add(characterId);
        }
      }
      
      return characters;
    } catch (error) {
      logger.error('Error fetching multiple characters:', error);
      throw new Error('Failed to fetch multiple characters');
    }
  }

  /**
   * Simple GET with 2 retries
   */
  private async getWithRetry(url: string, attempts: number = 2): Promise<{ data: any }> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await axios.get(url);
      } catch (err) {
        lastError = err;
        await new Promise(res => setTimeout(res, 150));
      }
    }
    throw lastError;
  }

  /**
   * Extract ID from SWAPI URL
   */
  private extractIdFromUrl(url: string): number {
    const match = url.match(/\/(\d+)\/$/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get data from cache if it's still valid
   */
  private getFromCache(key: string): unknown | null {
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
  private setCache(key: string, data: unknown): void {
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
    logger.info('Star Wars service cache cleared');
  }
} 