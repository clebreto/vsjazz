// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { workspace } from 'vscode';

import {
  LanguageClientOptions,
  ServerOptions, VersionedTextDocumentIdentifier
} from 'vscode-languageclient/node';

import Client from './client';

let client: Client;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const config = workspace.getConfiguration('jasmin');

	let serverOptions: ServerOptions = {
		command: config.path,
		args: config.args
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'jasmin' }],
        initializationOptions: config
	};

	// Create the language client and start the client.
	client = new Client(
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();

	/*
    context.subscriptions.push(client);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jasmin-lang" is now active!');
	*/

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	/*
	let disposable = vscode.commands.registerCommand('jasmin-lang.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Jasmin Language!');
	});

	context.subscriptions.push(disposable);
	*/
}

// This method is called when your extension is deactivated
export function deactivate() {}
