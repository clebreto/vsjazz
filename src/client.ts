import * as vscode from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient/node';

export default class Client extends LanguageClient {

  constructor(
    serverOptions: ServerOptions,
    clientOptions: LanguageClientOptions,
  ) {
    super(
            'jasmin-language-server',
            'Jasmin Language Server',
            serverOptions,
            clientOptions
    );
  }

}
