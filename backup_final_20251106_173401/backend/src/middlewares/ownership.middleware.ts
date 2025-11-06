import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/errors.js';

type ResourceLoader = (req: Request) => Promise<{ userId: string } | null>;

export const requireOwnership = (resourceLoader: ResourceLoader) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const resource = await resourceLoader(req);

      if (!resource) {
        return next(new ForbiddenError('Resource not found'));
      }

      const isOwner = req.user?.id === resource.userId;
      const isAdmin = req.user?.isStaff || req.user?.isSuperuser;

      if (!isOwner && !isAdmin) {
        return next(new ForbiddenError('You do not own this resource'));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};
