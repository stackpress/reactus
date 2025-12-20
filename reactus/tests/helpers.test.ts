//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import fs from 'node:fs/promises';
import path from 'node:path';
//modules
import React from 'react';
//reactus
import { id, renderJSX, writeFile } from '../src/helpers.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

describe('helpers', () => {
  describe('id()', () => {
    it('generates consistent hash for same content', () => {
      expect(id('hello')).to.equal(id('hello'));
    });

    it('generates different hashes for different content', () => {
      expect(id('hello')).to.not.equal(id('hello!'));
    });

    it('respects custom length parameter', () => {
      expect(id('hello', 8)).to.have.length(8);
      expect(id('hello', 12)).to.have.length(12);
    });

    it('generates valid Base62 characters', () => {
      const hash = id('hello');
      expect(hash).to.match(/^[0-9A-Za-z]+$/);
    });

    it('handles empty string', () => {
      const hash = id('');
      expect(hash).to.have.length.greaterThan(0);
      expect(hash).to.match(/^[0-9A-Za-z]+$/);
    });

    it('handles very long content', () => {
      const input = 'a'.repeat(100_000);
      expect(id(input)).to.have.length(32);
    });
  });

  describe('renderJSX()', () => {
    it('renders simple JSX element', () => {
      const html = renderJSX(() => React.createElement('div', null, 'Hello'));
      expect(html).to.include('Hello');
      expect(html).to.include('<div');
    });

    it('renders JSX element with props', () => {
      const Greeting = (props: { name: string }) => React.createElement('div', null, `Hi ${props.name}`);
      const html = renderJSX(Greeting, { name: 'Chris' });
      expect(html).to.include('Hi Chris');
    });

    it('returns empty string when element is undefined', () => {
      expect(renderJSX(undefined)).to.equal('');
    });

    it('returns empty string when element is null', () => {
      expect(renderJSX(null as unknown as React.ElementType | undefined)).to.equal('');
    });

    it('handles component with nested elements', () => {
      const Nested = () => React.createElement('section', null,
        React.createElement('h1', null, 'Title'),
        React.createElement('p', null, 'Body'),
      );
      const html = renderJSX(Nested);
      expect(html).to.include('Title');
      expect(html).to.include('Body');
      expect(html).to.include('<section');
    });

    it('handles empty props object', () => {
      const Component = (_props: Record<string, never>) => React.createElement('div', null, 'ok');
      const html = renderJSX(Component, {});
      expect(html).to.include('ok');
    });

    it('handles component that returns string content', () => {
      const Component = () => 'hello';
      const html = renderJSX(Component);
      expect(html).to.include('hello');
    });
  });

  describe('writeFile()', () => {
    let tempDir = '';

    afterEach(async () => {
      if (tempDir) await cleanupTempDir(tempDir);
    });

    it('writes file and returns file path', async () => {
      tempDir = await makeTempDir('write-file-');
      const file = path.join(tempDir, 'a', 'b', 'file.txt');
      const returned = await writeFile(file, 'hello');

      expect(returned).to.equal(file);
      expect(await fs.readFile(file, 'utf8')).to.equal('hello');
    });

    it('creates directory if it does not exist', async () => {
      tempDir = await makeTempDir('mkdir-');
      const file = path.join(tempDir, 'missing', 'dir', 'file.txt');
      await writeFile(file, 'x');

      const stat = await fs.stat(path.dirname(file));
      expect(stat.isDirectory()).to.equal(true);
    });

    it('does not create directory if it already exists', async () => {
      tempDir = await makeTempDir('mkdir-existing-');
      const dir = path.join(tempDir, 'exists');
      await fs.mkdir(dir, { recursive: true });

      // If writeFile incorrectly calls mkdir for an existing directory,
      // this patched implementation will fail the test.
      await withPatched(fs, 'mkdir', (async () => {
        throw new Error('mkdir should not be called');
      }) as typeof fs.mkdir, async () => {
        const file = path.join(dir, 'file.txt');
        await writeFile(file, 'x');
      });
    });

    it('handles Uint8Array content', async () => {
      tempDir = await makeTempDir('uint8-');
      const file = path.join(tempDir, 'bin.dat');
      const bytes = new Uint8Array([1, 2, 3]);
      await writeFile(file, bytes);

      const buf = await fs.readFile(file);
      expect(Array.from(buf.values())).to.deep.equal([1, 2, 3]);
    });

    it('propagates directory creation errors', async () => {
      tempDir = await makeTempDir('mkdir-error-');
      const file = path.join(tempDir, 'x', 'y', 'z.txt');

      const forced = new Error('mkdir failed');
      try {
        await withPatched(fs, 'mkdir', (async () => { throw forced; }) as typeof fs.mkdir, async () => {
          await writeFile(file, 'hello');
        });
        expect.fail('writeFile should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('propagates write errors', async () => {
      tempDir = await makeTempDir('write-error-');
      const file = path.join(tempDir, 'x.txt');

      const forced = new Error('write failed');
      try {
        await withPatched(fs, 'writeFile', (async () => { throw forced; }) as typeof fs.writeFile, async () => {
          await writeFile(file, 'hello');
        });
        expect.fail('writeFile should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });

  describe('integration', () => {
    it('generates consistent file names for same content', () => {
      const hash = id('same', 8);
      expect(hash).to.equal(id('same', 8));
    });

    it('renders components and generate hashes', () => {
      const Component = (props: { text: string }) => React.createElement('div', null, props.text);
      const html = renderJSX(Component, { text: 'hello' });
      expect(id(html, 8)).to.match(/^[0-9A-Za-z]{8}$/);
    });

    it('handles complex component rendering', () => {
      const App = (props: { items: string[] }) => React.createElement(
        'ul',
        null,
        props.items.map((item) => React.createElement('li', { key: item }, item))
      );

      const html = renderJSX(App, { items: ['a', 'b'] });
      expect(html).to.include('<ul');
      expect(html).to.include('a');
      expect(html).to.include('b');
    });
  });
});
