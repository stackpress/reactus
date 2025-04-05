//node
import path from 'node:path';
//document
import DocumentBuilder from './DocumentBuilder';
import DocumentLoader from './DocumentLoader';
import DocumentRender from './DocumentRender';
//local
import type Server from './Server';
import { id } from './helpers';

export default class Document {
  //builder methods
  public readonly builder: DocumentBuilder;
  //loader methods
  public readonly loader: DocumentLoader;
  //render methods
  public readonly render: DocumentRender;
  //server parent
  public readonly server: Server;
  //entry file formats
  // - @/path/to/file
  // - module/path/to/file
  public readonly entry: string;

  /**
   * Generates an id for the entry file
   */
  public get id() {
    const hash = id(this.entry, 8)
    const basename = path.basename(this.entry);
    return `${basename}-${hash}`;
  }

  /**
   * Sets the manifest and entry file
   */
  public constructor(entry: string, server: Server) {
    this.entry = entry;
    this.server = server;
    this.builder = new DocumentBuilder(this);
    this.loader = new DocumentLoader(this);
    this.render = new DocumentRender(this);
  }
}