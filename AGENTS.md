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

Before running any scripts in terminal, make sure the session is using NodeJS 22 or above.

## Node Setup

Before running `yarn build`, `yarn test`, or any other project script, make sure the shell is using Node.js `22` or newer.

Use the following lookup order:

1. Check whether `nvm` is installed.
2. If `nvm` is installed, try to locate the `nvm` directory that contains the Node binaries and use a Node 22+ binary from there.
3. If the `nvm` directory cannot be located, try to switch the shell directly with `nvm use 22`.
4. If `nvm` is not available or cannot provide Node 22+, try common OS-specific Node install paths.
5. If Node is still not found, inspect environment variables such as `PATH`, `NVM_DIR`, `NODE_HOME`, or similar variables that may point to the installation.
6. If after all of the above Node 22+ still cannot be found, stop the task and ask the user for the Node installation location.

Preferred process:

- First try to detect `nvm` with commands such as `command -v nvm` or by checking `NVM_DIR`.
- If `nvm` exists, prefer Node binaries under the `nvm` installation, commonly under:
  - `$NVM_DIR/versions/node/`
  - `~/.nvm/versions/node/`
- If a Node 22+ binary is found there, use that runtime for subsequent commands.
- If the folder cannot be resolved cleanly, fall back to `nvm use 22`.
- If `nvm` is unavailable, check common Node locations based on the OS, such as:
  - `/usr/local/bin/node`
  - `/opt/homebrew/bin/node`
  - `/usr/bin/node`
  - Windows `Program Files` Node.js install paths when relevant
- If needed, inspect environment variables and the active `PATH` to find a usable `node` binary.
- Do not proceed with project scripts unless Node 22+ has been confirmed.

## Documentation

Great usage examples can be found in the following folders in the `examples` folder.

 - `examples/with-express/scripts`
 - `examples/with-fastify/scripts`
 - `examples/with-http/scripts`
 - `examples/with-tailwind/scripts`
 - `examples/with-unocss/scripts`

When creating documentation please use the root `docs` folder. Do not add documentation in the `reactus` folder.
