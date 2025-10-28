import "express";

import type { User as AppUser } from "../entities/User.js";

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
      resource?: { userId?: string; [k: string]: unknown };
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
