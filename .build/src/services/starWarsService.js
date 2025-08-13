"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarWarsService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class StarWarsService {
    baseUrl = 'https://swapi.dev/api';
    cache = new Map();
    cacheTTL = 30 * 60 * 1000;
    async getRandomCharacter() {
        try {
            const cacheKey = 'random_character';
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger_1.logger.info('Returning cached random character');
                return cached;
            }
            const countResponse = await this.getWithRetry(`${this.baseUrl}/people/`);
            const totalCount = countResponse.data.count || 83;
            const randomId = Math.floor(Math.random() * totalCount) + 1;
            const response = await this.getWithRetry(`${this.baseUrl}/people/${randomId}/`);
            const character = response.data;
            this.setCache(cacheKey, character);
            logger_1.logger.info(`Fetched random character: ${character.name}`);
            return character;
        }
        catch (error) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('SWAPI unavailable, returning fallback character');
                const fallback = {
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
            logger_1.logger.error('Error fetching random character:', error);
            throw new Error('Failed to fetch Star Wars character');
        }
    }
    async getPlanetByUrl(planetUrl) {
        try {
            const cacheKey = `planet_${planetUrl}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger_1.logger.info('Returning cached planet data');
                return cached;
            }
            const response = await this.getWithRetry(planetUrl);
            const planet = response.data;
            this.setCache(cacheKey, planet);
            logger_1.logger.info(`Fetched planet: ${planet.name}`);
            return planet;
        }
        catch (error) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('SWAPI planet unavailable, returning fallback planet');
                const fallback = {
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
            logger_1.logger.error('Error fetching planet:', error);
            throw new Error('Failed to fetch planet information');
        }
    }
    async getCharacters(count = 3) {
        try {
            const characters = [];
            const usedIds = new Set();
            while (characters.length < count) {
                const character = await this.getRandomCharacter();
                const characterId = this.extractIdFromUrl(character.url);
                if (!usedIds.has(characterId)) {
                    characters.push(character);
                    usedIds.add(characterId);
                }
            }
            return characters;
        }
        catch (error) {
            logger_1.logger.error('Error fetching multiple characters:', error);
            throw new Error('Failed to fetch multiple characters');
        }
    }
    async getWithRetry(url, attempts = 2) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
            try {
                return await axios_1.default.get(url);
            }
            catch (err) {
                lastError = err;
                await new Promise(res => setTimeout(res, 150));
            }
        }
        throw lastError;
    }
    extractIdFromUrl(url) {
        const match = url.match(/\/(\d+)\/$/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
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
        logger_1.logger.info('Star Wars service cache cleared');
    }
}
exports.StarWarsService = StarWarsService;
//# sourceMappingURL=starWarsService.js.map