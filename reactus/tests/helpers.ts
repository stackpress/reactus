import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Helper to create a temporary directory for isolated file system tests
export async function makeTempDir(prefix: string = 'test-') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tempDir = await fs.mkdtemp(path.join(__dirname, prefix));
  return tempDir;
}

// Helper to clean up a temporary directory
export async function cleanupTempDir(tempDir: string) {
  await fs.rm(tempDir, { recursive: true, force: true });
}

// Helper to create a simple spy function
export function createSpy<T extends (...args: any[]) => any>() {
  const calls: Parameters<T>[] = [];
  const spy = function(...args: Parameters<T>): ReturnType<T> {
    calls.push(args);
    return undefined as ReturnType<T>; // Default return, can be overridden
  } as T;
  (spy as any).calls = calls;
  return spy;
}

// Helper to create a simple stub function
export function createStub<T extends (...args: any[]) => any>(initialReturnValue?: ReturnType<T>) {
  const calls: Parameters<T>[] = [];
  let returnValue = initialReturnValue as ReturnType<T>;

  const stub = function(...args: Parameters<T>): ReturnType<T> {
    calls.push(args);
    return returnValue;
  } as T;

  (stub as any).returns = (val: ReturnType<T>) => {
    returnValue = val;
    return stub;
  };

  Object.defineProperty(stub, 'calls', { get: () => calls });

  return stub;
}

// Helper to temporarily patch an object's method and restore it
export async function withPatched<T extends object, K extends keyof T, R>(
  obj: T,
  key: K,
  value: T[K],
  fn: () => Promise<R> | R
): Promise<R> {
  const original = obj[key];
  obj[key] = value;
  try {
    return await fn();
  } finally {
    obj[key] = original;
  }
}
