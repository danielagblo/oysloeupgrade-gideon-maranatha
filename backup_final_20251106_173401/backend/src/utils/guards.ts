import type { Request } from "express";

export function requireAdminId(req: Request): string {
  const id = (req as any).admin?.id as string | undefined;
  if (!id) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return id;
}

export function requireUserId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return id;
}
