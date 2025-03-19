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
    plugins: [ tailwindcss() ],
    //path where to save assets (css, images, etc)
    assetPath: path.join(cwd, 'public/assets'),
    //path where to save and load (live) the client scripts (js)
    clientPath: path.join(cwd, 'public/client'),
    //path where to save and load (live) the server script (js)
    pagePath: path.join(cwd, '.build/pages')
  });
  
  await engine.add('@/pages/home');
  await engine.add('@/pages/about');
  await engine.add('reactus-with-plugin/pages/how');
  await engine.add('reactus-with-plugin/pages/contact');

  const responses = [
    ...await engine.buildClient(),
    ...await engine.buildAssets(),
    ...await engine.buildPages()
  ].map(response => {
    const results = response.results;
    if (typeof results?.contents === 'string') {
      results.contents = results.contents.substring(0, 100) + ' ...';
    }
    return results;
  });

  //console.log(responses);
  //fix for unused variable :)
  if (responses.length) return;
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});