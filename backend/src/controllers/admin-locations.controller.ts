import type { NextFunction, Request, Response } from 'express';
import { AddTownSchema, CreateRegionSchema, UpdateTownSchema } from '../schemas/admin.js';
import { AdminLocationsService } from '../services/admin-locations.service.js';

type CreateRegionRequest = Zod.infer<typeof CreateRegionSchema>;
type AddTownRequest = Zod.infer<typeof AddTownSchema>;
type UpdateTownRequest = Zod.infer<typeof UpdateTownSchema>;

const locationsService = new AdminLocationsService();

export const getLocations = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await locationsService.getLocations();

    res.json({
      success: true,
      data: { regions: result.regions },
    });
  } catch (error) {
    next(error);
  }
};

export const createRegion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateRegionRequest = CreateRegionSchema.parse(req.body);
    const region = await locationsService.createRegion(body);

    res.json({
      success: true,
      data: { region },
    });
  } catch (error) {
    next(error);
  }
};

export const addTown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regionId = req.params.regionId;
    const body: AddTownRequest = AddTownSchema.parse(req.body);
    const town = await locationsService.addTown(regionId, body);

    res.json({
      success: true,
      data: { town },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regionId = req.params.regionId;
    const townId = req.params.townId;
    const body: UpdateTownRequest = UpdateTownSchema.parse(req.body);
    const town = await locationsService.updateTown(regionId, townId, body);

    res.json({
      success: true,
      data: { town },
    });
  } catch (error) {
    next(error);
  }
};
