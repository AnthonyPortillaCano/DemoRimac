import { WeatherData } from '../types';
export declare class WeatherService {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly cache;
    private readonly cacheTTL;
    getWeatherByLocation(location: string): Promise<WeatherData>;
    getWeatherForMultipleLocations(locations: string[]): Promise<WeatherData[]>;
    getWeatherForStarWarsPlanet(planetName: string): Promise<WeatherData>;
    private getWithRetry;
    private fallbackWeather;
    private getFromCache;
    private setCache;
    clearCache(): void;
}
//# sourceMappingURL=weatherService.d.ts.map