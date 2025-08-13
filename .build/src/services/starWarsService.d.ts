import { StarWarsCharacter, StarWarsPlanet } from '../types';
export declare class StarWarsService {
    private readonly baseUrl;
    private readonly cache;
    private readonly cacheTTL;
    getRandomCharacter(): Promise<StarWarsCharacter>;
    getPlanetByUrl(planetUrl: string): Promise<StarWarsPlanet>;
    getCharacters(count?: number): Promise<StarWarsCharacter[]>;
    private getWithRetry;
    private extractIdFromUrl;
    private getFromCache;
    private setCache;
    clearCache(): void;
}
//# sourceMappingURL=starWarsService.d.ts.map