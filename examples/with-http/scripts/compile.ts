//node
import path from 'node:path';
//modules
import tailwindcss from '@tailwindcss/vite';
//reactus
import reactus from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = reactus({
    cwd,
    //path where to save assets (css, images, etc)
    assetPath: path.join(cwd, 'public/assets'),
    //path where to save and load (live) the client scripts (js)
    clientPath: path.join(cwd, 'public/client'),
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute: '/client',
    //path where to save and load (live) the server script (js)
    pagePath: path.join(cwd, '.reactus')
  });
  
  engine.add('@/pages/home');
  engine.add('@/pages/about');

  const responses = [
    ...await engine.buildClient([ tailwindcss() ]),
    ...await engine.buildAssets([ tailwindcss() ]),
    ...await engine.buildPages([ tailwindcss() ])
  ].map(response => {
    const results = response.results;
    if (typeof results?.contents === 'string') {
      results.contents = results.contents.substring(0, 100) + ' ...';
    }
    return results;
  });

  console.log(responses);
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});