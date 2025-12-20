//tests
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
//modules
import type { ServerConfig } from '../../src/server/types.js';
import Server from '../../src/server/Server.js';
import FileLoader from '@stackpress/lib/FileLoader';

describe('server/Server', () => {
  beforeEach(() => {});

  afterEach(() => {});

  describe('constructor', () => {
    it('initializes FileLoader with correct parameters', () => {});

    it('sets up routes correctly', () => {});

    it('sets up paths correctly', () => {});

    it('sets up templates correctly', () => {});

    it('uses default cwd when not provided', () => {});
  });

  describe('getters', () => {
    describe('cwd', () => {});

    describe('fs', () => {});

    describe('paths', () => {});

    describe('routes', () => {});

    describe('templates', () => {});
  });

  describe('import()', () => {
    it('resolves and imports file with default extensions', async () => {});

    it('uses custom extensions when provided', async () => {});

    it('throws error when file cannot be resolved', async () => {});

    it('throws error when import fails', async () => {});

    it('returns typed import result', async () => {});
  });

  describe('resolve()', () => {
    beforeEach(() => {});

    it('resolves file and returns metadata with default extensions', async () => {});

    it('uses custom extensions when provided', async () => {});

    it('handles files without extensions', async () => {});

    it('throws error when file cannot be resolved', async () => {});

    it('handles complex file paths', async () => {});

    it('handles multiple extensions correctly', async () => {});
  });

  describe('integration scenarios', () => {
    it('import and resolve work together', async () => {});

    it('handles different server configurations', () => {});

    it('maintains immutability of configuration objects', () => {});

    it('handles file resolution with various path formats', async () => {});

    it('preserves loader configuration across operations', () => {});
  });
});
