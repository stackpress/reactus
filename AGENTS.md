This repository is a yarn workspace made of 1 package `reactus`, which is already published to NPM as `reactus`. It supports both cjs and esm based projects by providing an `cjs` and `esm` folder made using a build script, then configuring the type (set to `module`), export map, import map, require map, and type maps in `reactus/package.json`.

## Public Files and Folders

The following folders and files are found in the root of the project.

- `docs` - The official documentation of the project.
- `examples` - Various working examples project templates
- `reactus` - The source code for the relative work involved.

## Private Files and Folders

Please ignore the following folders:

- `archives`
- `reactus/.nyc_output`
- `reactus/coverage`

## Scripts

In this project we use `yarn` to execute scripts. Please do not use `npm`.
We use `package.json` to call scripts from packages like so.

- `yarn build` - generates the esm and cjs versions of the reactus framework
- `yarn test` - runs the tests found in `reactus/tests`

Before running any scripts in terminal, make sure the session is using NodeJS 22. `nvm use 22`.

## Documentation

Great usage examples can be found in the following folders in the `examples` folder.

 - `examples/with-express/scripts`
 - `examples/with-fastify/scripts`
 - `examples/with-http/scripts`
 - `examples/with-tailwind/scripts`
 - `examples/with-unocss/scripts`

When creating documentation please use the root `docs` folder. Do not add documentation in the `reactus` folder.