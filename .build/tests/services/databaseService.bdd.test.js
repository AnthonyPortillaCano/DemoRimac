"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databaseService_1 = require("../../src/services/databaseService");
describe('DatabaseService - BDD Tests', () => {
    let databaseService;
    beforeEach(() => {
        databaseService = new databaseService_1.DatabaseService();
    });
    describe('Feature: Data Storage', () => {
        describe('Scenario: Successfully store fused data', () => {
            it('Given valid fused data', async () => {
                const fusedData = {
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
                    weather: {
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
                    },
                    fusion_timestamp: Date.now()
                };
                const result = await databaseService.storeFusedData(fusedData);
                expect(result.success).toBe(true);
                expect(result.id).toBeDefined();
                expect(result.message).toBe('Fused data stored successfully');
            });
        });
        describe('Scenario: Successfully store custom data', () => {
            it('Given valid custom data', async () => {
                const customData = {
                    title: 'Test Custom Data',
                    description: 'This is a test custom data entry',
                    category: 'test',
                    tags: ['test', 'custom'],
                    metadata: {
                        author: 'Test User',
                        version: '1.0.0'
                    }
                };
                const result = await databaseService.storeCustomData(customData);
                expect(result.success).toBe(true);
                expect(result.id).toBeDefined();
                expect(result.message).toBe('Custom data stored successfully');
            });
        });
        describe('Scenario: Handle storage errors', () => {
            it('Given invalid data structure', async () => {
                const invalidData = null;
                const result = await databaseService.storeFusedData(invalidData);
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });
    describe('Feature: Data Retrieval', () => {
        describe('Scenario: Successfully retrieve fused data history', () => {
            it('Given stored fused data exists', async () => {
                const fusedData = {
                    character: {
                        name: 'Han Solo',
                        height: '180',
                        mass: '80',
                        hair_color: 'brown',
                        skin_color: 'fair',
                        eye_color: 'brown',
                        birth_year: '29BBY',
                        gender: 'male',
                        homeworld: 'https://swapi.dev/api/planets/22/',
                        films: ['https://swapi.dev/api/films/1/'],
                        species: [],
                        vehicles: [],
                        starships: ['https://swapi.dev/api/starships/10/'],
                        created: '2014-12-10T16:49:14.582000Z',
                        edited: '2014-12-20T21:17:50.334000Z',
                        url: 'https://swapi.dev/api/people/14/'
                    },
                    planet: {
                        name: 'Corellia',
                        rotation_period: '25',
                        orbital_period: '329',
                        diameter: '11000',
                        climate: 'temperate',
                        gravity: '1 standard',
                        terrain: 'plains, urban, hills, forests',
                        surface_water: '70',
                        population: '3000000000',
                        residents: ['https://swapi.dev/api/people/14/'],
                        films: [],
                        created: '2014-12-10T16:49:12.453000Z',
                        edited: '2014-12-20T20:58:18.458000Z',
                        url: 'https://swapi.dev/api/planets/22/'
                    },
                    weather: {
                        location: {
                            name: 'Corellia',
                            region: 'Corellia',
                            country: 'Corellia',
                            lat: 0,
                            lon: 0,
                            tz_id: 'UTC',
                            localtime_epoch: 1703123456,
                            localtime: '2023-12-21 15:30'
                        },
                        current: {
                            last_updated_epoch: 1703123456,
                            last_updated: '2023-12-21 15:30',
                            temp_c: 22.0,
                            temp_f: 71.6,
                            is_day: 1,
                            condition: {
                                text: 'Partly cloudy',
                                icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
                                code: 1003
                            },
                            wind_mph: 5.0,
                            wind_kph: 8.0,
                            wind_degree: 90,
                            wind_dir: 'E',
                            pressure_mb: 1015.0,
                            pressure_in: 29.97,
                            precip_mm: 0.0,
                            precip_in: 0.0,
                            humidity: 60,
                            cloud: 25,
                            feelslike_c: 22.5,
                            feelslike_f: 72.5,
                            vis_km: 10.0,
                            vis_miles: 6.0,
                            uv: 5.0,
                            gust_mph: 8.0,
                            gust_kph: 12.9
                        }
                    },
                    fusion_timestamp: Date.now()
                };
                await databaseService.storeFusedData(fusedData);
                const result = await databaseService.getFusedDataHistory(1, 10);
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data.length).toBeGreaterThan(0);
                expect(result.pagination).toBeDefined();
            });
            it('Given pagination parameters', async () => {
                const page = 1;
                const limit = 5;
                const result = await databaseService.getFusedDataHistory(page, limit);
                expect(result.success).toBe(true);
                expect(result.pagination.page).toBe(page);
                expect(result.pagination.limit).toBe(limit);
                expect(result.pagination.total).toBeGreaterThanOrEqual(0);
            });
        });
        describe('Scenario: Successfully retrieve custom data', () => {
            it('Given stored custom data exists', async () => {
                const customData = {
                    title: 'Retrieval Test',
                    description: 'Testing data retrieval',
                    category: 'test',
                    tags: ['retrieval', 'test'],
                    metadata: {
                        author: 'Test User',
                        version: '1.0.0'
                    }
                };
                await databaseService.storeCustomData(customData);
                const result = await databaseService.getCustomData(1, 10);
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data.length).toBeGreaterThan(0);
            });
        });
        describe('Scenario: Handle retrieval errors', () => {
            it('Given invalid pagination parameters', async () => {
                const invalidPage = -1;
                const invalidLimit = 0;
                const result = await databaseService.getFusedDataHistory(invalidPage, invalidLimit);
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });
    describe('Feature: Data Caching', () => {
        describe('Scenario: Cache fused data for 30 minutes', () => {
            it('Given recently stored fused data', async () => {
                const fusedData = {
                    character: {
                        name: 'Leia Organa',
                        height: '150',
                        mass: '49',
                        hair_color: 'brown',
                        skin_color: 'light',
                        eye_color: 'brown',
                        birth_year: '19BBY',
                        gender: 'female',
                        homeworld: 'https://swapi.dev/api/planets/2/',
                        films: ['https://swapi.dev/api/films/1/'],
                        species: [],
                        vehicles: [],
                        starships: [],
                        created: '2014-12-10T15:53:08.802000Z',
                        edited: '2014-12-20T21:17:50.313000Z',
                        url: 'https://swapi.dev/api/people/5/'
                    },
                    planet: {
                        name: 'Alderaan',
                        rotation_period: '24',
                        orbital_period: '364',
                        diameter: '12500',
                        climate: 'temperate',
                        gravity: '1 standard',
                        terrain: 'grasslands, mountains',
                        surface_water: '40',
                        population: '2000000000',
                        residents: ['https://swapi.dev/api/people/5/'],
                        films: ['https://swapi.dev/api/films/1/'],
                        created: '2014-12-10T11:35:48.479000Z',
                        edited: '2014-12-20T20:58:18.420000Z',
                        url: 'https://swapi.dev/api/planets/2/'
                    },
                    weather: {
                        location: {
                            name: 'Alderaan',
                            region: 'Alderaan',
                            country: 'Alderaan',
                            lat: 0,
                            lon: 0,
                            tz_id: 'UTC',
                            localtime_epoch: 1703123456,
                            localtime: '2023-12-21 15:30'
                        },
                        current: {
                            last_updated_epoch: 1703123456,
                            last_updated: '2023-12-21 15:30',
                            temp_c: 18.0,
                            temp_f: 64.4,
                            is_day: 1,
                            condition: {
                                text: 'Overcast',
                                icon: '//cdn.weatherapi.com/weather/64x64/day/122.png',
                                code: 1009
                            },
                            wind_mph: 3.0,
                            wind_kph: 4.8,
                            wind_degree: 45,
                            wind_dir: 'NE',
                            pressure_mb: 1018.0,
                            pressure_in: 30.06,
                            precip_mm: 0.0,
                            precip_in: 0.0,
                            humidity: 70,
                            cloud: 90,
                            feelslike_c: 17.5,
                            feelslike_f: 63.5,
                            vis_km: 8.0,
                            vis_miles: 5.0,
                            uv: 3.0,
                            gust_mph: 5.0,
                            gust_kph: 8.0
                        }
                    },
                    fusion_timestamp: Date.now()
                };
                await databaseService.storeFusedData(fusedData);
                const cachedResult = await databaseService.getCachedFusedData();
                expect(cachedResult.success).toBe(true);
                expect(cachedResult.data).toBeDefined();
                expect(cachedResult.fromCache).toBe(true);
            });
        });
        describe('Scenario: Cache expiration after 30 minutes', () => {
            it('Given expired cached data', async () => {
                const expiredTimestamp = Date.now() - (31 * 60 * 1000);
                const result = await databaseService.getCachedFusedData();
                expect(result.success).toBe(false);
                expect(result.error).toBe('Cache expired or no cached data available');
            });
        });
    });
    describe('Feature: Data Validation', () => {
        describe('Scenario: Validate data structure before storage', () => {
            it('Given data with missing required fields', async () => {
                const invalidData = {
                    character: {
                        name: 'Incomplete Character'
                    }
                };
                const result = await databaseService.storeFusedData(invalidData);
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
        describe('Scenario: Validate data types', () => {
            it('Given data with incorrect types', async () => {
                const invalidData = {
                    character: {
                        name: 123,
                        height: 'invalid',
                        mass: 'invalid',
                        hair_color: 'blond',
                        skin_color: 'fair',
                        eye_color: 'blue',
                        birth_year: '19BBY',
                        gender: 'male',
                        homeworld: 'https://swapi.dev/api/planets/1/',
                        films: 'not-an-array',
                        species: [],
                        vehicles: [],
                        starships: [],
                        created: '2014-12-09T13:50:51.644000Z',
                        edited: '2014-12-20T21:17:56.891000Z',
                        url: 'https://swapi.dev/api/people/1/'
                    },
                    planet: {},
                    weather: {},
                    fusion_timestamp: 'not-a-number'
                };
                const result = await databaseService.storeFusedData(invalidData);
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });
});
//# sourceMappingURL=databaseService.bdd.test.js.map