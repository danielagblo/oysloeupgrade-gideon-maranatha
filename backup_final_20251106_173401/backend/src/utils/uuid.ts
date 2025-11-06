import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { config } from '../config/env.js';

export const generateUUID = (): string => {
  return uuidv4();
};

export const mapLegacyId = (table: string, legacyId: number): string => {
  const name = `${table}:${legacyId}`;
  return uuidv5(name, config.uuid.namespace);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const generateStableRoomId = (email1: string, email2: string): string => {
  const sorted = [email1, email2].sort();
  const name = `${sorted[0]}:${sorted[1]}`;
  return uuidv5(name, config.uuid.namespace);
};
