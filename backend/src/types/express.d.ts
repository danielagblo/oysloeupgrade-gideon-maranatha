import 'express';

import type { AdminUser } from '../entities/AdminUser.js';
import type { User as AppUser } from '../entities/User.js';

declare global {
  namespace Express {
    interface User extends AppUser {
      wallet?: {
        id?: string;
        balance?: number;
        ledger?: unknown[];
      };
    }

    interface Request {
      user?: User;
      admin?: AdminUser;
      file?: Express.Multer.File;
      resource?: { userId?: string; [k: string]: unknown };
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
