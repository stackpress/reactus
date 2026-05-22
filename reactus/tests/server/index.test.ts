//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//server
import * as serverIndex from '../../src/server/index.js';
import Document from '../../src/server/Document.js';
import Server from '../../src/server/Server.js';
import { BASE62_ALPHABET, DOCUMENT_TEMPLATE, HASH_LENGTH } from '../../src/server/constants.js';
import { configure, id, renderJSX } from '../../src/server/helpers.js';

describe('server/index', () => {
  it('re-exports the public server APIs', () => {
    expect(serverIndex.BASE62_ALPHABET).to.equal(BASE62_ALPHABET);
    expect(serverIndex.DOCUMENT_TEMPLATE).to.equal(DOCUMENT_TEMPLATE);
    expect(serverIndex.HASH_LENGTH).to.equal(HASH_LENGTH);
    expect(serverIndex.configure).to.equal(configure);
    expect(serverIndex.id).to.equal(id);
    expect(serverIndex.renderJSX).to.equal(renderJSX);
    expect(serverIndex.Document).to.equal(Document);
    expect(serverIndex.Server).to.equal(Server);
  });

  it('serve() creates a wrapper that delegates rendering through Document', async () => {
    const app = serverIndex.serve({});
    expect(app.server).to.be.instanceOf(Server);

    const originalRenderMarkup = Document.prototype.renderMarkup;
    try {
      Document.prototype.renderMarkup = async function(props: Record<string, unknown>) {
        return `rendered:${this.entry}:${props.message}`;
      };

      const html = await app.render('@/pages/home.tsx', { message: 'hello' });
      expect(html).to.equal('rendered:@/pages/home.tsx:hello');
    } finally {
      Document.prototype.renderMarkup = originalRenderMarkup;
    }
  });
});
