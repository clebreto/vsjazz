// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { workspace } from 'vscode';

import {
  LanguageClientOptions,
  ServerOptions,
  NotificationType
} from 'vscode-languageclient/node';

import Client from './client';

let client: Client;
let statusBarItem: vscode.StatusBarItem;

// Define the custom notification type for setting master file
const SetMasterFileNotification = new NotificationType<{ uri: string }>('jasmin/setMasterFile');

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

	// Create status bar item for master file display
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'jasmin.setMasterFile';
	statusBarItem.tooltip = 'Click to change master file';
	context.subscriptions.push(statusBarItem);

	// Start the client. This will also launch the server
	client.start().then(() => {
		console.log('Jasmin LSP client started');
		
		// Set master file from configuration once server is ready
		updateMasterFileFromConfig();
	});

	context.subscriptions.push(client);

	// Register command to set/change master file
	context.subscriptions.push(
		vscode.commands.registerCommand('jasmin.setMasterFile', async () => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			// Show file picker for .jazz files
			const fileUri = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'Jasmin Files': ['jazz']
				},
				defaultUri: workspaceFolder.uri,
				title: 'Select Master Jasmin File'
			});

			if (fileUri && fileUri[0]) {
				// Update the workspace configuration
				await vscode.workspace.getConfiguration('jasmin').update(
					'masterFile',
					vscode.workspace.asRelativePath(fileUri[0]),
					vscode.ConfigurationTarget.Workspace
				);
				
				// Send notification to LSP server
				await setMasterFile(fileUri[0].toString());
				
				vscode.window.showInformationMessage(`Master file set to: ${path.basename(fileUri[0].fsPath)}`);
			}
		})
	);

	// Watch for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('jasmin.masterFile')) {
				updateMasterFileFromConfig();
			}
		})
	);

	// Update status bar when active editor changes
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			updateStatusBar(editor);
		})
	);

	// Update status bar for current editor
	updateStatusBar(vscode.window.activeTextEditor);
}

async function updateMasterFileFromConfig() {
	if (!client) return;

	const config = vscode.workspace.getConfiguration('jasmin');
	const masterFile = config.get<string>('masterFile');

	if (masterFile) {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			// Resolve relative paths and variables
			let resolvedPath = masterFile.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
			
			if (!path.isAbsolute(resolvedPath)) {
				resolvedPath = path.resolve(workspaceFolder.uri.fsPath, resolvedPath);
			}

			const uri = vscode.Uri.file(resolvedPath).toString();
			await setMasterFile(uri);
		}
	}
	
	// Update status bar
	updateStatusBar(vscode.window.activeTextEditor);
}

async function setMasterFile(uri: string) {
	if (!client) return;

	try {
		await client.sendNotification(SetMasterFileNotification, { uri });
		console.log(`Master file set to: ${uri}`);
	} catch (error) {
		console.error('Failed to set master file:', error);
		vscode.window.showErrorMessage(`Failed to set master file: ${error}`);
	}
}

function updateStatusBar(editor: vscode.TextEditor | undefined) {
	if (!editor) {
		statusBarItem.hide();
		return;
	}

	const document = editor.document;
	const isJasminFile = document.languageId === 'jasmin' || 
		document.fileName.endsWith('.jazz') || 
		document.fileName.endsWith('.jinc');

	if (isJasminFile) {
		const config = vscode.workspace.getConfiguration('jasmin');
		const masterFile = config.get<string>('masterFile');
		
		if (masterFile) {
			const fileName = path.basename(masterFile);
			statusBarItem.text = `$(file) Master: ${fileName}`;
			statusBarItem.show();
		} else {
			statusBarItem.text = `$(warning) No Master File`;
			statusBarItem.show();
		}
	} else {
		statusBarItem.hide();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (statusBarItem) {
		statusBarItem.dispose();
	}
}
