import { JSDOM } from 'jsdom';

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const globals = globalThis as any;

globals.window = dom.window;
globals.document = dom.window.document;
Object.defineProperty(globals, 'navigator', {
  value: { userAgent: 'node.js' },
  writable: true,
  configurable: true
});
