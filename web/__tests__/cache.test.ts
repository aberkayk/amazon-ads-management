import fs from 'fs';
import path from 'path';

const TEST_CACHE_DIR = path.join(__dirname, 'tmp-cache');

jest.mock('../lib/cache', () => {
  const actual = jest.requireActual('../lib/cache');
  return actual;
});

// We'll point the module to a test directory by mocking process.cwd
const originalCwd = process.cwd;
beforeAll(() => {
  process.cwd = () => path.join(__dirname, '..');
});
afterAll(() => {
  process.cwd = originalCwd;
});

import { readCache, writeCache, isFresh } from '../lib/cache';

afterEach(() => {
  const cacheDir = path.join(__dirname, '..', 'cache');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
  }
});

test('readCache returns null when file does not exist', () => {
  expect(readCache('nonexistent')).toBeNull();
});

test('writeCache creates a file and readCache reads it back', () => {
  const data = [{ id: 1, name: 'test' }];
  writeCache('test-key', data);
  const entry = readCache<typeof data>('test-key');
  expect(entry).not.toBeNull();
  expect(entry!.data).toEqual(data);
  expect(entry!.updatedAt).toBeTruthy();
});

test('isFresh returns true for a just-written cache entry', () => {
  const entry = writeCache('fresh-key', { value: 42 });
  expect(isFresh(entry)).toBe(true);
});

test('isFresh returns false for an entry older than 1 hour', () => {
  const entry = {
    updatedAt: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
    data: {},
  };
  expect(isFresh(entry)).toBe(false);
});

test('readCache returns null when JSON is corrupt', () => {
  const cacheDir = path.join(__dirname, '..', 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(path.join(cacheDir, 'bad-key.json'), 'not json');
  expect(readCache('bad-key')).toBeNull();
});
