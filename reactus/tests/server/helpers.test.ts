//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//modules
import React from 'react';
//reactus
import { configure, id, renderJSX } from '../../src/server/helpers.js';
import { BASE62_ALPHABET, DOCUMENT_TEMPLATE, HASH_LENGTH } from '../../src/server/constants.js';
import NodeFS from '@stackpress/lib/NodeFS';

describe('server/helpers', () => {
  describe('configure()', () => {
    it('returns default configuration when no options are provided', () => {
      const config = configure({});
      expect(config.clientRoute).to.equal('/client');
      expect(config.cssRoute).to.equal('/assets');
      expect(config.documentTemplate).to.equal(DOCUMENT_TEMPLATE);
      expect(config.pagePath).to.include('.reactus/page');
    });

    it('merges provided options and freezes the result', () => {
      const fs = new NodeFS();
      const config = configure({
        cwd: '/tmp/project',
        clientRoute: '/scripts',
        cssRoute: '/styles',
        documentTemplate: '<html/>',
        pagePath: '/tmp/page',
        fs
      });

      expect(config.cwd).to.equal('/tmp/project');
      expect(config.clientRoute).to.equal('/scripts');
      expect(config.cssRoute).to.equal('/styles');
      expect(config.documentTemplate).to.equal('<html/>');
      expect(config.pagePath).to.equal('/tmp/page');
      expect(config.fs).to.equal(fs);
      expect(Object.isFrozen(config)).to.equal(true);
    });
  });

  describe('id()', () => {
    it('generates a consistent Base62 hash with the configured length', () => {
      const hash = id('hello');
      expect(hash).to.equal(id('hello'));
      expect(hash).to.have.length(HASH_LENGTH);
      expect(hash.split('').every(char => BASE62_ALPHABET.includes(char))).to.equal(true);
    });

    it('changes when the content or requested length changes', () => {
      expect(id('hello')).to.not.equal(id('hello!'));
      expect(id('hello', 8)).to.have.length(8);
      expect(id('', 8)).to.have.length(8);
    });
  });

  describe('renderJSX()', () => {
    it('renders JSX elements with props', () => {
      const Component = (props: { name: string }) => React.createElement('div', null, `Hi ${props.name}`);
      const html = renderJSX(Component, { name: 'Chris' });

      expect(html).to.include('Hi Chris');
      expect(html).to.include('<div');
    });

    it('returns an empty string when the element is missing', () => {
      expect(renderJSX(undefined)).to.equal('');
      expect(renderJSX(null as unknown as React.ElementType)).to.equal('');
    });
  });
});
