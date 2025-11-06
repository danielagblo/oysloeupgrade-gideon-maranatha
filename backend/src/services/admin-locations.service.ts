import { AppDataSource } from '../config/database.js';
import { redisClient } from '../config/redis.js';
import { Region } from '../entities/Region.js';
import { Town } from '../entities/Town.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface CreateRegionInput {
  name: string;
  code: string;
}

export interface AddTownInput {
  name: string;
  coordinates?: { lat: number; lng: number };
}

export interface UpdateTownInput {
  name?: string;
  coordinates?: { lat: number; lng: number };
  isActive?: boolean;
}

export class AdminLocationsService {
  private get regionRepository() {
    return AppDataSource.getRepository(Region);
  }

  private get townRepository() {
    return AppDataSource.getRepository(Town);
  }

  private get cacheKey() {
    return 'admin:locations:all';
  }

  private async invalidateCache(): Promise<void> {
    try {
      await redisClient.del(this.cacheKey);
    } catch (error) {
      console.warn('Failed to invalidate locations cache:', error);
    }
  }

  async getLocations(): Promise<{ regions: Region[] }> {
    try {
      const cached = await redisClient.get(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache read failed:', error);
    }

    const regions = await this.regionRepository.find({
      relations: ['towns'],
      order: { name: 'ASC', towns: { name: 'ASC' } }
    });

    const result = { regions };

    try {
      await redisClient.setex(this.cacheKey, 3600, JSON.stringify(result));
    } catch (error) {
      console.warn('Redis cache write failed:', error);
    }

    return result;
  }

  async createRegion(input: CreateRegionInput): Promise<Region> {
    const existingRegion = await this.regionRepository.findOne({
      where: { code: input.code }
    });

    if (existingRegion) {
      throw new ValidationError('Region code already exists');
    }

    const region = this.regionRepository.create(input);
    const savedRegion = await this.regionRepository.save(region);

    await this.invalidateCache();

    return savedRegion;
  }

  async addTown(regionId: string, input: AddTownInput): Promise<Town> {
    const region = await this.regionRepository.findOne({
      where: { id: regionId }
    });

    if (!region) {
      throw new NotFoundError('Region not found');
    }

    const existingTown = await this.townRepository.findOne({
      where: { name: input.name, regionId }
    });

    if (existingTown) {
      throw new ValidationError('Town name already exists in this region');
    }

    const town = this.townRepository.create({
      ...input,
      regionId,
      region
    });

    const savedTown = await this.townRepository.save(town);

    await this.invalidateCache();

    return savedTown;
  }

  async updateTown(regionId: string, townId: string, input: UpdateTownInput): Promise<Town> {
    const town = await this.townRepository.findOne({
      where: { id: townId, regionId },
      relations: ['region']
    });

    if (!town) {
      throw new NotFoundError('Town not found in specified region');
    }

    if (input.name && input.name !== town.name) {
      const existingTown = await this.townRepository.findOne({
        where: { name: input.name, regionId }
      });

      if (existingTown) {
        throw new ValidationError('Town name already exists in this region');
      }
    }

    Object.assign(town, input);
    const savedTown = await this.townRepository.save(town);

    await this.invalidateCache();

    return savedTown;
  }
}


