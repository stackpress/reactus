import type { UnknownNest } from '@stackpress/lib/types';
import type { ServerConfig, DocumentImport } from './types.js';
import Document from './Document.js';
import Server from './Server.js';
import {
  BASE62_ALPHABET,
  HASH_LENGTH,
  DOCUMENT_TEMPLATE
} from './constants.js';
import { 
  configure,
  id,
  renderJSX
} from './helpers.js';

export type { UnknownNest, ServerConfig, DocumentImport };

export {
  BASE62_ALPHABET,
  HASH_LENGTH,
  DOCUMENT_TEMPLATE,
  configure,
  id,
  renderJSX,
  Document, 
  Server
};

export function serve(options: Partial<ServerConfig>) {
  const config = configure({ ...options });
  const server = new Server(config);
  return {
    //----------------------------------------------------------------//
    // Settings

    //the final configuration
    config,
    //Returns the paths
    paths: server.paths,
    //Returns the route prefixes
    routes: server.routes,
    //Returns the templates
    templates: server.templates,

    //----------------------------------------------------------------//
    // Class Instances

    server,

    //----------------------------------------------------------------//
    // Document Server Methods
    
    /**
     * Returns the final document markup (html)
     */
    render: async (
      entry: string, 
      props: UnknownNest = {}
    ) => {
      const document = new Document(entry, server);
      return await document.renderMarkup(props);
    }
  };
}