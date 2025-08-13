import { FusionService } from '../../src/services/fusionService';
import { StarWarsService } from '../../src/services/starWarsService';
import { WeatherService } from '../../src/services/weatherService';
import { FusedData, StarWarsCharacter, StarWarsPlanet, WeatherData } from '../../src/types';

// Mock the services
jest.mock('../../src/services/starWarsService');
jest.mock('../../src/services/weatherService');

describe('FusionService - BDD Tests', () => {
  let fusionService: FusionService;
  let mockStarWarsService: jest.Mocked<StarWarsService>;
  let mockWeatherService: jest.Mocked<WeatherService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStarWarsService = new StarWarsService() as jest.Mocked<StarWarsService>;
    mockWeatherService = new WeatherService() as jest.Mocked<WeatherService>;
    fusionService = new FusionService(mockStarWarsService, mockWeatherService);
  });

  describe('Feature: Data Fusion', () => {
    describe('Scenario: Successfully fuse Star Wars character with weather data', () => {
      it('Given a Star Wars character exists', async () => {
        // Given
        const mockCharacter: StarWarsCharacter = {
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
          created: '2014-12-09T13:50:51.644000Z',
          edited: '2014-12-20T21:17:56.891000Z',
          url: 'https://swapi.dev/api/people/1/'
        };

        mockStarWarsService.getRandomCharacter.mockResolvedValue(mockCharacter);

        // When
        const result = await fusionService.fuseCharacterWithWeather();

        // Then
        expect(result.character).toEqual(mockCharacter);
        expect(mockStarWarsService.getRandomCharacter).toHaveBeenCalledTimes(1);
      });

      it('And a planet exists for the character', async () => {
        // Given
        const mockCharacter: StarWarsCharacter = {
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
          created: '2014-12-09T13:50:51.644000Z',
          edited: '2014-12-20T21:17:56.891000Z',
          url: 'https://swapi.dev/api/people/1/'
        };

        const mockPlanet: StarWarsPlanet = {
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
          created: '2014-12-09T13:50:49.641000Z',
          edited: '2014-12-20T20:58:18.411000Z',
          url: 'https://swapi.dev/api/planets/1/'
        };

        mockStarWarsService.getRandomCharacter.mockResolvedValue(mockCharacter);
        mockStarWarsService.getPlanetByUrl.mockResolvedValue(mockPlanet);

        // When
        const result = await fusionService.fuseCharacterWithWeather();

        // Then
        expect(result.planet).toEqual(mockPlanet);
        expect(mockStarWarsService.getPlanetByUrl).toHaveBeenCalledWith(mockCharacter.homeworld);
      });

      it('And weather data exists for the planet', async () => {
        // Given
        const mockCharacter: StarWarsCharacter = {
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
          created: '2014-12-09T13:50:51.644000Z',
          edited: '2014-12-20T21:17:56.891000Z',
          url: 'https://swapi.dev/api/people/1/'
        };

        const mockPlanet: StarWarsPlanet = {
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
          created: '2014-12-09T13:50:49.641000Z',
          edited: '2014-12-20T20:58:18.411000Z',
          url: 'https://swapi.dev/api/planets/1/'
        };

        const mockWeather: WeatherData = {
          location: {
            name: 'Tunisia',
            region: 'Tunisia',
            country: 'Tunisia',
            lat: 36.8065,
            lon: 10.1815,
            tz_id: 'Africa/Tunis',
            localtime_epoch: 1703123456,
            localtime: '2023-12-21 15:30'
          },
          current: {
            last_updated_epoch: 1703123456,
            last_updated: '2023-12-21 15:30',
            temp_c: 25.5,
            temp_f: 77.9,
            is_day: 1,
            condition: {
              text: 'Sunny',
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
              code: 1000
            },
            wind_mph: 8.5,
            wind_kph: 13.7,
            wind_degree: 180,
            wind_dir: 'S',
            pressure_mb: 1013.0,
            pressure_in: 29.91,
            precip_mm: 0.0,
            precip_in: 0.0,
            humidity: 45,
            cloud: 0,
            feelslike_c: 26.2,
            feelslike_f: 79.2,
            vis_km: 10.0,
            vis_miles: 6.0,
            uv: 6.0,
            gust_mph: 12.5,
            gust_kph: 20.1
          }
        };

        mockStarWarsService.getRandomCharacter.mockResolvedValue(mockCharacter);
        mockStarWarsService.getPlanetByUrl.mockResolvedValue(mockPlanet);
        mockWeatherService.getWeatherForStarWarsPlanet.mockResolvedValue(mockWeather);

        // When
        const result = await fusionService.fuseCharacterWithWeather();

        // Then
        expect(result.weather).toEqual(mockWeather);
        expect(mockWeatherService.getWeatherForStarWarsPlanet).toHaveBeenCalledWith(mockPlanet.name);
      });

      it('Then the data should be successfully fused', async () => {
        // Given
        const mockCharacter: StarWarsCharacter = {
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
          created: '2014-12-09T13:50:51.644000Z',
          edited: '2014-12-20T21:17:56.891000Z',
          url: 'https://swapi.dev/api/people/1/'
        };

        const mockPlanet: StarWarsPlanet = {
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
          created: '2014-12-09T13:50:49.641000Z',
          edited: '2014-12-20T20:58:18.411000Z',
          url: 'https://swapi.dev/api/planets/1/'
        };

        const mockWeather: WeatherData = {
          location: {
            name: 'Tunisia',
            region: 'Tunisia',
            country: 'Tunisia',
            lat: 36.8065,
            lon: 10.1815,
            tz_id: 'Africa/Tunis',
            localtime_epoch: 1703123456,
            localtime: '2023-12-21 15:30'
          },
          current: {
            last_updated_epoch: 1703123456,
            last_updated: '2023-12-21 15:30',
            temp_c: 25.5,
            temp_f: 77.9,
            is_day: 1,
            condition: {
              text: 'Sunny',
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
              code: 1000
            },
            wind_mph: 8.5,
            wind_kph: 13.7,
            wind_degree: 180,
            wind_dir: 'S',
            pressure_mb: 1013.0,
            pressure_in: 29.91,
            precip_mm: 0.0,
            precip_in: 0.0,
            humidity: 45,
            cloud: 0,
            feelslike_c: 26.2,
            feelslike_f: 79.2,
            vis_km: 10.0,
            vis_miles: 6.0,
            uv: 6.0,
            gust_mph: 12.5,
            gust_kph: 20.1
          }
        };

        mockStarWarsService.getRandomCharacter.mockResolvedValue(mockCharacter);
        mockStarWarsService.getPlanetByUrl.mockResolvedValue(mockPlanet);
        mockWeatherService.getWeatherForStarWarsPlanet.mockResolvedValue(mockWeather);

        // When
        const result = await fusionService.fuseCharacterWithWeather();

        // Then
        expect(result).toBeDefined();
        expect(result.character).toEqual(mockCharacter);
        expect(result.planet).toEqual(mockPlanet);
        expect(result.weather).toEqual(mockWeather);
        expect(result.fusion_timestamp).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Handle Star Wars API failure', () => {
      it('Given the Star Wars API is unavailable', async () => {
        // Given
        const errorMessage = 'Star Wars API unavailable';
        mockStarWarsService.getRandomCharacter.mockRejectedValue(new Error(errorMessage));

        // When & Then
        await expect(fusionService.fuseCharacterWithWeather()).rejects.toThrow('Failed to fuse data from APIs');
      });
    });

    describe('Scenario: Handle Weather API failure', () => {
      it('Given the Weather API is unavailable', async () => {
        // Given
        const mockCharacter: StarWarsCharacter = {
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
          created: '2014-12-09T13:50:51.644000Z',
          edited: '2014-12-20T21:17:56.891000Z',
          url: 'https://swapi.dev/api/people/1/'
        };

        mockStarWarsService.getRandomCharacter.mockResolvedValue(mockCharacter);
        mockStarWarsService.getPlanetByUrl.mockRejectedValue(new Error('Weather API unavailable'));

        // When & Then
        await expect(fusionService.fuseCharacterWithWeather()).rejects.toThrow('Failed to fuse data from APIs');
      });
    });
  });

  describe('Feature: Data Normalization', () => {
    describe('Scenario: Normalize character data', () => {
      it('Given character data with string values', () => {
        // Given
        const fusedData: FusedData = {
          character: {
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
            created: '2014-12-09T13:50:51.644000Z',
            edited: '2014-12-20T21:17:56.891000Z',
            url: 'https://swapi.dev/api/people/1/'
          },
          planet: {
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
            created: '2014-12-09T13:50:49.641000Z',
            edited: '2014-12-20T20:58:18.411000Z',
            url: 'https://swapi.dev/api/planets/1/'
          },
          weather: {} as WeatherData,
          fusion_timestamp: Date.now()
        };

        // When
        const result = fusionService.processFusedData(fusedData);

        // Then
        expect(result.character.height).toBe(172);
        expect(result.character.mass).toBe(77);
        expect(result.character.birth_year).toBe('19 Before Battle of Yavin');
      });
    });

    describe('Scenario: Handle unknown values gracefully', () => {
      it('Given data with unknown values', () => {
        // Given
        const fusedData: FusedData = {
          character: {
            name: 'Unknown Character',
            height: 'unknown',
            mass: 'unknown',
            hair_color: 'unknown',
            skin_color: 'unknown',
            eye_color: 'unknown',
            birth_year: 'unknown',
            gender: 'unknown',
            homeworld: 'https://swapi.dev/api/planets/1/',
            films: [],
            species: [],
            vehicles: [],
            starships: [],
            created: '2014-12-09T13:50:51.644000Z',
            edited: '2014-12-20T21:17:56.891000Z',
            url: 'https://swapi.dev/api/people/1/'
          },
          planet: {
            name: 'Unknown Planet',
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
            created: '2014-12-09T13:50:49.641000Z',
            edited: '2014-12-20T21:17:56.891000Z',
            url: 'https://swapi.dev/api/planets/1/'
          },
          weather: {} as WeatherData,
          fusion_timestamp: Date.now()
        };

        // When
        const result = fusionService.processFusedData(fusedData);

        // Then
        expect(result.character.height).toBe(0);
        expect(result.character.mass).toBe(0);
        expect(result.planet.diameter).toBe(0);
        expect(result.planet.population).toBe(0);
        expect(result.character.birth_year).toBe('Unknown');
      });
    });
  });
}); 