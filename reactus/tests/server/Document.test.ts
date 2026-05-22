//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//modules
import React from 'react';
//reactus
import Document from '../../src/server/Document.js';
import { id } from '../../src/server/helpers.js';

describe('server/Document', () => {
  function makeServer() {
    return {
      paths: { page: '/tmp/page' },
      routes: { client: '/client', css: '/assets' },
      templates: {
        document: '<html><head><!--document-head--></head><body><!--document-body--><script><!--document-props--></script><script src="<!--document-client-->"></script></body></html>'
      },
      import: async (_file: string) => ({
        default: (props: { message?: string }) => React.createElement('div', null, props.message || 'hello'),
        Head: (props: { styles?: string[] }) => React.createElement('head', null, (props.styles || []).join(',')),
        styles: ['site.css']
      })
    } as any;
  }

  describe('id getter', () => {
    it('generates IDs using the entry basename and hash', () => {
      const document = new Document('@/pages/home.tsx', makeServer());
      expect(document.id).to.equal(`home.tsx-${id('@/pages/home.tsx', 8)}`);
    });
  });

  describe('import()', () => {
    it('imports the generated page file from the server page path', async () => {
      let imported = '';
      const server = {
        ...makeServer(),
        import: async (file: string) => {
          imported = file;
          return { default: 'page' };
        }
      } as any;
      const document = new Document('@/pages/home.tsx', server);

      expect(await document.import()).to.deep.equal({ default: 'page' });
      expect(imported).to.equal(`/tmp/page/${document.id}.js`);
    });
  });

  describe('renderMarkup()', () => {
    it('renders document markup, props, client route, and css routes', async () => {
      const document = new Document('@/pages/home.tsx', makeServer());
      const html = await document.renderMarkup({ message: 'hello "world"' });

      expect(html).to.include('hello &quot;world&quot;');
      expect(html).to.include('/client/' + document.id + '.js');
      expect(html).to.include('/assets/site.css');
      expect(html).to.include('{"message":"hello \\"world\\""}');
    });

    it('handles missing Head and styles gracefully', async () => {
      const server = {
        ...makeServer(),
        import: async () => ({
          default: () => React.createElement('div', null, 'body')
        })
      } as any;
      const document = new Document('@/pages/home.tsx', server);
      const html = await document.renderMarkup();

      expect(html).to.include('body');
      expect(html).to.not.include('/assets/');
    });
  });
});
