import type { NextFunction, Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ZodError, type ZodTypeAny } from 'zod';

type Trio = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };
type Bundle = Trio | { shape: Trio } | ZodTypeAny;

const isZodSchema = (v: unknown): v is ZodTypeAny =>
  !!v && typeof v === 'object' && 'parseAsync' in (v as Record<string, unknown>);

const hasOwn = (o: object, k: string) => {
  return Object.hasOwn(o, k);
};

const isDirectTrio = (v: unknown): v is Trio =>
  !!v &&
  typeof v === 'object' &&
  (hasOwn(v as object, 'body') || hasOwn(v as object, 'query') || hasOwn(v as object, 'params'));

const isShapeBundle = (v: unknown): v is { shape: Trio } => {
  if (!v || typeof v !== 'object' || !hasOwn(v as object, 'shape')) {
    return false;
  }
  const obj = v as Record<string, unknown>;
  const shape = obj.shape;
  return (
    shape != null &&
    typeof shape === 'object' &&
    (hasOwn(shape as object, 'body') ||
      hasOwn(shape as object, 'query') ||
      hasOwn(shape as object, 'params'))
  );
};

export function validateRequest(bundle: Bundle) {
  if (isZodSchema(bundle) && !isDirectTrio(bundle) && !isShapeBundle(bundle)) {
    const schema = bundle;
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = await schema.parseAsync(req.body);
        next();
      } catch (err) {
        if (err instanceof ZodError) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.issues,
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ message: (err as Error).message }],
        });
      }
    };
  }

  const shape: Trio = isShapeBundle(bundle) ? bundle.shape : (bundle as Trio);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (shape.body) req.body = await shape.body.parseAsync(req.body);
      if (shape.query) req.query = (await shape.query.parseAsync(req.query || {})) as ParsedQs;
      if (shape.params)
        req.params = (await shape.params.parseAsync(req.params)) as ParamsDictionary;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.issues,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ message: (err as Error).message }],
      });
    }
  };
}

export { validateRequest as validate };

export function validateParams(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = (await schema.parseAsync(req.params)) as ParamsDictionary;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.issues,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ message: (err as Error).message }],
      });
    }
  };
}
