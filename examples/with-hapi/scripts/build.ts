//node
import path from 'node:path';
//reactus
import { build } from 'reactus';

async function builder() {
  const cwd = process.cwd();
  const engine = build({
    cwd,
    //path where to save assets (css, images, etc)
    assetPath: path.join(cwd, 'public/assets'),
    //path where to save and load (live) the client scripts (js)
    clientPath: path.join(cwd, 'public/client'),
    //path where to save and load (live) the server script (js)
    pagePath: path.join(cwd, '.build/pages')
  });
  
  await engine.set('@/pages/home');
  await engine.set('@/pages/about');

  const responses = [
    ...await engine.buildAllClients(),
    ...await engine.buildAllAssets(),
    ...await engine.buildAllPages()
  ].map(response => {
    const results = response.results;
    if (typeof results?.contents === 'string') {
      results.contents = results.contents.substring(0, 100) + ' ...';
    }
    return results;
  });

  //fix for unused variable :)
  if (responses.length) return;
}

builder().catch(e => {
  console.error(e);
  process.exit(1);
});