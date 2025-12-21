//modules
import type { 
  AppType, 
  ViteDevServer, 
  PluginOption, 
  InlineConfig,
  DepOptimizationOptions 
} from 'vite';
//common
import type Server from './Server.js';
import { css, file, hmr, vfs } from './plugins.js';
import { include } from '@stackpress/lib';

export type ResourceConfig = {
  //base path (used in vite)
  // - used in dev mode
  basePath: string,
  //original vite options (overrides other settings related to vite)
  config?: InlineConfig,
  //current working directory
  cwd: string,
  //vite optimization settings
  optimizeDeps?: DepOptimizationOptions,
  //vite plugins
  plugins: PluginOption[],
  //ignore files in watch mode
  // - used in dev mode
  watchIgnore?: string[]
};

export default class ServerResource {
  //base path (used in vite)
  public readonly base: string;
  //configuration for vite
  protected _config?: InlineConfig;
  //current working directory
  protected _cwd: string;
  //cached vite dev server
  protected _dev: ViteDevServer|null = null;
  //watch ignore patterns
  protected _ignore: string[];
  //vite optimization settings
  protected _optimize?: DepOptimizationOptions;
  //vite plugins
  protected _plugins: PluginOption[];
  //parent server
  protected _server: Server;

  /**
   * Returns the vite configuration
   */
  public get config() {
    return this._config ? Object.freeze(this._config): null;
  }

  /**
   * Sets the templates and vite configuration
   */
  public constructor(server: Server, config: ResourceConfig) {
    //current working directory
    this._cwd = config.cwd;
    //base path (used in vite)
    this.base = config.basePath || '/';
    //configuration for vite
    this._config = config.config;
    //watch ignore patterns
    this._ignore = config.watchIgnore || [];
    //vite optimization settings
    this._optimize = config.optimizeDeps;
    //vite plugins
    this._plugins = config.plugins;
    //parent server
    this._server = server;
  }

  /**
   * Tries to return the vite build callback
   */
  public async build(config: InlineConfig) {
    //rely on import cache
    const { build } = await import('vite');
    //shallow copy the vite config
    const settings = { ...config }; 
    //organize plugins
    settings.plugins = await this.plugins();
    //vite build now
    return build({ logLevel: 'silent', ...settings });
  }

  /**
   * Tries to return the vite dev server
   */
  public async dev() {
    if (!this._dev) {
      this._dev = await this._createServer();
      //add client asset middleware
      this._dev.middlewares.use(hmr(this._server));
    }
    return this._dev;
  }

  /**
   * Returns the middleware stack
   */
  public async middlewares() {
    const dev = await this.dev();
    return dev.middlewares;
  }

  /**
   * Returns the default vite plugins
   */
  public async plugins() {
    //add react plugin
    const react = await include('@vitejs/plugin-react');
    //add css?
    const injectCSS = this._server.paths.css 
      ? css(this._server.paths.css) 
      : null;
    //add the imfs plugin
    return [ 
      injectCSS,
      vfs(this._server.vfs), 
      file(this._server.loader), 
      react.default(),
      ...this._plugins,
    ] as PluginOption[];
  }

  /**
   * Create vite dev server logic
   */
  protected async _createServer() {
    const vite = {
      server: { 
        middlewareMode: true,
        watch: { ignored: this._ignore }
      },
      appType: 'custom' as AppType,
      base: this.base,
      root: this._cwd,
      mode: 'development',
      optimizeDeps: this._optimize,
      ...this._config
    };
    const { createServer } = await import('vite');
    //shallow copy the vite config
    const config = { ...vite }; 
    //organize plugins
    config.plugins = await this.plugins();
    //create the vite resource
    return await createServer(config);
  }
}