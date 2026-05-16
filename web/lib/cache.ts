import fs from 'fs';
import path from 'path';
import type { CacheEntry } from './types';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const TTL_MS = 60 * 60 * 1000;

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  ensureCacheDir();
  const file = cachePath(key);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): CacheEntry<T> {
  ensureCacheDir();
  const entry: CacheEntry<T> = { updatedAt: new Date().toISOString(), data };
  fs.writeFileSync(cachePath(key), JSON.stringify(entry));
  return entry;
}

export function isFresh(entry: CacheEntry<unknown>): boolean {
  return Date.now() - new Date(entry.updatedAt).getTime() < TTL_MS;
}
