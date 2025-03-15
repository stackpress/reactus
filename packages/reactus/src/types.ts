//modules
import type { ElementType } from 'react';
import type { ViteDevServer, InlineConfig } from 'vite';
//stackpress
import type { 
  FileSystem, 
  FileLoader, 
  UnknownNest 
} from '@stackpress/lib';
//local
import type Build from './Build';
import type Manifest from './Manifest';

export type PageImport = { default: ElementType, Head?: ElementType };

export interface EngineInterface {
  //Returns the client script
  getClientScript(file: string): Promise<string|null>;
  //Returns the document markup
  getDocumentMarkup(
    entry: string, 
    clientScriptRoute: string, 
    documentTemplate: string,
    props?: UnknownNest
  ): Promise<string>;
  //Loads a tsx (server) file in runtime
  import<T = unknown>(url: string): Promise<T>;
  //Vite tsx (server) renderer
  render(entry: string, props?: UnknownNest): Promise<{
    head: string | undefined;
    body: string;
  }>
};

export type ViteEngineConfig = InlineConfig|ViteDevServer;
export type FileEngineConfig = {};

export type LoaderOptions = {
  cwd?: string,
  fs?: FileSystem
};

export type ManifestOptions = {
  clientPath: string,
  clientTemplate: string,
  documentPath: string,
  documentTemplate: string
};

export type ReactusDevOptions = ReactusLiveOptions & { vite?: ViteEngineConfig };
export type ReactusLiveOptions = LoaderOptions & Partial<ManifestOptions>;

export type ApiHandlers<E> = {
  manifest: Manifest,
  engine: E,
  loader: FileLoader,
  template: { client: string, document: string },
  builds: Set<Build>,
  //Returns true if the build is in development mode
  development: boolean,
  //Determines the mode of the build
  mode(): string,
  //Returns the size of the manifest
  size: number,
  //Create a new build
  add(entry: string): Build,
  //Returns the client script
  client(entry: string): Promise<string|null>,
  //Returns the document markup
  document(entry: string, props?: UnknownNest): Promise<string>,
  //Returns a list of map entries
  entries(): [string, Build][],
  //Find a build by id
  find(id: string): Build|null,
  //Loop through the manifest
  forEach(callback: (build: Build, index?: number) => unknown): void,
  //Get a build by entry
  get(entry: string): Build,
  //Loads a tsx (server) file in runtime
  import<T = unknown>(entry: string): Promise<T>,
  //Returns true if the build exists
  has(entry: string): boolean,
  //Loads the manifest from disk
  load(filename?: string): Promise<Manifest>,
  //Loop through the manifest
  map<T = unknown>(callback: (build: Build, index: number) => T): T[],
  //Vite tsx (server) renderer
  render(entry: string, props?: UnknownNest): Promise<{ head: string|undefined, body: string }>,
  //Saves the manifest to disk
  save(filename?: string): Promise<Manifest>,
  //Sets the manifest from hash
  set(hash: Record<string, string>): Manifest,
  //Converts the manifest to hash
  toJSON(): Record<string, string>,
  //Returns a list of builds
  values(): Build[]
};
