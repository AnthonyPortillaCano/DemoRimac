import { StarWarsService } from './starWarsService';
import { WeatherService } from './weatherService';
import { FusedData } from '../types';
export declare class FusionService {
    private readonly starWarsService;
    private readonly weatherService;
    constructor(starWarsService: StarWarsService, weatherService: WeatherService);
    fuseCharacterWithWeather(): Promise<FusedData>;
    fuseMultipleCharacters(count?: number): Promise<FusedData[]>;
    processFusedData(fusedData: FusedData): FusedData;
    private normalizeHeight;
    private normalizeMass;
    private normalizeBirthYear;
    private normalizeDiameter;
    private normalizePopulation;
}
//# sourceMappingURL=fusionService.d.ts.map