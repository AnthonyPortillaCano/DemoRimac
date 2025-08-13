export interface StarWarsCharacter {
    name: string;
    height: string | number;
    mass: string | number;
    hair_color: string;
    skin_color: string;
    eye_color: string;
    birth_year: string;
    gender: string;
    homeworld: string;
    films: string[];
    species: string[];
    vehicles: string[];
    starships: string[];
    created: string;
    edited: string;
    url: string;
}
export interface StarWarsPlanet {
    name: string;
    rotation_period: string;
    orbital_period: string;
    diameter: string | number;
    climate: string;
    gravity: string;
    terrain: string;
    surface_water: string;
    population: string | number;
    residents: string[];
    films: string[];
    created: string;
    edited: string;
    url: string;
}
export interface WeatherData {
    location: {
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
        tz_id: string;
        localtime_epoch: number;
        localtime: string;
    };
    current: {
        last_updated_epoch: number;
        last_updated: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
            text: string;
            icon: string;
            code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        vis_km: number;
        vis_miles: number;
        uv: number;
        gust_mph: number;
        gust_kph: number;
    };
}
export interface FusedData {
    character: StarWarsCharacter;
    planet: StarWarsPlanet;
    weather: WeatherData;
    fusion_timestamp: number;
}
export interface CustomData {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    metadata: Record<string, unknown>;
    created_at: number;
    updated_at: number;
}
export interface DatabaseItem {
    id: string;
    type: 'fused' | 'custom';
    timestamp: number;
    data: FusedData | CustomData;
    ttl?: number;
}
export interface CacheItem {
    key: string;
    data: unknown;
    timestamp: number;
    ttl: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string | undefined;
    timestamp: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface QueryParams {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    startDate?: number;
    endDate?: number;
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
}
//# sourceMappingURL=index.d.ts.map