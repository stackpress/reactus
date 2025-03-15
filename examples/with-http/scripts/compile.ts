//node
import path from 'node:path';
import fs from 'node:fs/promises';
//reactus
import reactus from 'reactus';

async function compile() {
  const cwd = process.cwd();
  const docs = path.join(cwd, '.reactus');
  const document = path.join(cwd, 'assets/document.html');

  const build = reactus('build', {
    documentTemplate: await fs.readFile(document, 'utf8'),
    connect: async () => {
      const { createServer } = await import('vite');
      return await createServer( {
        server: { middlewareMode: true },
        appType: 'custom',
        base: '/',
        root: cwd,
        mode: 'development',
        publicDir: path.join(cwd, 'public'),
      });
    }
  });

  const resource = await build.resource();
  if (!resource) {
    throw new Error('Failed to create resource');
  }

  const home = build.add('@/pages/home');
  const about = build.add('@/pages/about');

  await build.buildPages();
  await build.buildClient();

  await home.saveMarkup(path.join(docs, 'home.html'));
  await about.saveMarkup(path.join(docs, 'about.html'));
}

compile()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

