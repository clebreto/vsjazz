// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { workspace } from 'vscode';

import {
  LanguageClientOptions,
  ServerOptions,
  NotificationType,
  RequestType
} from 'vscode-languageclient/node';

import Client from './client';

let client: Client;
let statusBarItem: vscode.StatusBarItem;

// Define the custom notification type for setting master file
const SetMasterFileNotification = new NotificationType<{ uri: string }>('jasmin/setMasterFile');

// Define namespace path types
interface NamespacePath {
  namespace: string;
  path: string;
}

interface GetRequiredNamespacesResponse {
  namespaces: string[];
}

// Define custom LSP messages for namespace configuration
const GetRequiredNamespacesRequest = new RequestType<{}, GetRequiredNamespacesResponse, void>('jasmin/getRequiredNamespaces');
const SetNamespacePathsNotification = new NotificationType<{ paths: NamespacePath[] }>('jasmin/setNamespacePaths');

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
		initializationOptions: config,
		synchronize: {
			// Notify the server about file changes to '.jazz' and '.jinc' files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.{jazz,jinc}'),
			// Configuration sections to synchronize
			configurationSection: 'jasmin'
		},
		diagnosticCollectionName: 'jasmin',
		middleware: {
			handleDiagnostics: (uri, diagnostics, next) => {
				console.log(`Received ${diagnostics.length} diagnostics for ${uri.toString()}`);
				next(uri, diagnostics);
			}
		}
	};

	// Create the language client and start the client.
	client = new Client(
		serverOptions,
		clientOptions
	);

	// Create status bar item for master file display
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'jasmin.showConfiguration';
	statusBarItem.tooltip = 'Jasmin LSP Configuration';
	context.subscriptions.push(statusBarItem);

	// Start the client. This will also launch the server
	client.start().then(async () => {
		console.log('Jasmin LSP client started');
		
		// Initialize configuration from settings
		await initializeConfigurationFromSettings();
	});

	context.subscriptions.push(client);

	// Register command to show configuration menu
	context.subscriptions.push(
		vscode.commands.registerCommand('jasmin.showConfiguration', async () => {
			await showConfigurationMenu();
		})
	);

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
				
				// Query and configure namespaces after master file is set
				await queryAndConfigureNamespaces();
				
				vscode.window.showInformationMessage(`Master file set to: ${path.basename(fileUri[0].fsPath)}`);
			}
		})
	);

	// Register command to configure namespace path
	context.subscriptions.push(
		vscode.commands.registerCommand('jasmin.configureNamespace', async (namespaceName?: string) => {
			await configureNamespacePath(namespaceName);
		})
	);

	// Watch for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('jasmin.masterFile')) {
				updateMasterFileFromConfig();
			}
			if (e.affectsConfiguration('jasmin.namespacePaths')) {
				updateNamespacePathsFromConfig();
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

async function initializeConfigurationFromSettings() {
	if (!client) return;

	const config = vscode.workspace.getConfiguration('jasmin');
	const masterFile = config.get<string>('masterFile');
	const namespacePaths = config.get<Record<string, string>>('namespacePaths') || {};
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

	console.log('Initializing configuration from settings...');
	console.log('Master file:', masterFile);
	console.log('Namespace paths:', namespacePaths);

	// If master file is configured, send it to LSP
	if (masterFile && workspaceFolder) {
		// Resolve relative paths and variables
		let resolvedPath = masterFile.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
		
		if (!path.isAbsolute(resolvedPath)) {
			resolvedPath = path.resolve(workspaceFolder.uri.fsPath, resolvedPath);
		}

		const uri = vscode.Uri.file(resolvedPath).toString();
		await setMasterFile(uri);
		console.log('Master file sent to LSP:', uri);
	}

	// If namespace paths are configured, send them to LSP
	if (Object.keys(namespacePaths).length > 0 && workspaceFolder) {
		// Convert configuration object to array of NamespacePath objects
		const paths: NamespacePath[] = Object.entries(namespacePaths).map(([namespace, pathStr]) => {
			// Resolve relative paths and variables
			let resolvedPath = pathStr.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
			
			if (!path.isAbsolute(resolvedPath)) {
				resolvedPath = path.resolve(workspaceFolder.uri.fsPath, resolvedPath);
			}

			return {
				namespace,
				path: resolvedPath
			};
		});

		try {
			await client.sendNotification(SetNamespacePathsNotification, { paths });
			console.log('Namespace paths sent to LSP:', paths);
		} catch (error) {
			console.error('Failed to send namespace paths to LSP:', error);
		}
	}

	// Update status bar
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
			
			// Query and configure namespaces after master file is set
			await queryAndConfigureNamespaces();
		}
	}
	
	// Update status bar
	updateStatusBar(vscode.window.activeTextEditor);
}

async function queryAndConfigureNamespaces() {
	if (!client) return;

	try {
		// Query required namespaces from LSP
		const response = await client.sendRequest(GetRequiredNamespacesRequest, {});
		console.log('Required namespaces:', response.namespaces);
		
		// Update namespace paths from configuration
		await updateNamespacePathsFromConfig();
	} catch (error) {
		console.error('Failed to query required namespaces:', error);
	}
}

async function updateNamespacePathsFromConfig() {
	if (!client) return;

	const config = vscode.workspace.getConfiguration('jasmin');
	const namespacePaths = config.get<Record<string, string>>('namespacePaths') || {};
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

	if (!workspaceFolder) return;

	// Convert configuration object to array of NamespacePath objects
	const paths: NamespacePath[] = Object.entries(namespacePaths).map(([namespace, pathStr]) => {
		// Resolve relative paths and variables
		let resolvedPath = pathStr.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
		
		if (!path.isAbsolute(resolvedPath)) {
			resolvedPath = path.resolve(workspaceFolder.uri.fsPath, resolvedPath);
		}

		return {
			namespace,
			path: resolvedPath
		};
	});

	try {
		await client.sendNotification(SetNamespacePathsNotification, { paths });
		console.log('Namespace paths configured:', paths);
	} catch (error) {
		console.error('Failed to set namespace paths:', error);
	}

	// Update status bar
	updateStatusBar(vscode.window.activeTextEditor);
}

async function configureNamespacePath(namespaceName?: string) {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	// If no namespace name provided, ask user to select or enter one
	if (!namespaceName) {
		// Try to get required namespaces from LSP
		let availableNamespaces: string[] = [];
		try {
			const response = await client.sendRequest(GetRequiredNamespacesRequest, {});
			availableNamespaces = response.namespaces;
		} catch (error) {
			console.error('Failed to get required namespaces:', error);
		}

		if (availableNamespaces.length > 0) {
			// Show quick pick with available namespaces
			namespaceName = await vscode.window.showQuickPick(
				[...availableNamespaces, '$(add) Add Custom Namespace...'],
				{
					placeHolder: 'Select namespace to configure'
				}
			);

			if (!namespaceName) return;

			// If user selected custom namespace option
			if (namespaceName.startsWith('$(add)')) {
				namespaceName = await vscode.window.showInputBox({
					prompt: 'Enter namespace name',
					placeHolder: 'e.g., Common, Crypto, Utils'
				});

				if (!namespaceName) return;
			}
		} else {
			// No namespaces available, ask for input
			namespaceName = await vscode.window.showInputBox({
				prompt: 'Enter namespace name',
				placeHolder: 'e.g., Common, Crypto, Utils'
			});

			if (!namespaceName) return;
		}
	}

	// Show folder picker for namespace path
	const folderUri = await vscode.window.showOpenDialog({
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		defaultUri: workspaceFolder.uri,
		title: `Select path for namespace: ${namespaceName}`
	});

	if (folderUri && folderUri[0]) {
		// Update configuration
		const config = vscode.workspace.getConfiguration('jasmin');
		const namespacePaths = { ...(config.get<Record<string, string>>('namespacePaths') || {}) };
		namespacePaths[namespaceName] = vscode.workspace.asRelativePath(folderUri[0]);

		await config.update('namespacePaths', namespacePaths, vscode.ConfigurationTarget.Workspace);
		
		vscode.window.showInformationMessage(`Namespace '${namespaceName}' configured: ${path.basename(folderUri[0].fsPath)}`);
	}
}

async function showConfigurationMenu() {
	const config = vscode.workspace.getConfiguration('jasmin');
	const masterFile = config.get<string>('masterFile');
	const namespacePaths = config.get<Record<string, string>>('namespacePaths') || {};

	// Get required namespaces from LSP
	let requiredNamespaces: string[] = [];
	try {
		const response = await client.sendRequest(GetRequiredNamespacesRequest, {});
		requiredNamespaces = response.namespaces;
	} catch (error) {
		console.error('Failed to get required namespaces:', error);
	}

	// Build menu items
	const items: vscode.QuickPickItem[] = [];

	// Master file item
	items.push({
		label: '$(file) Master File',
		description: masterFile || 'Not set',
		detail: 'Click to change the master Jasmin file'
	});

	// Separator
	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator
	});

	// Namespace items
	if (requiredNamespaces.length > 0) {
		for (const ns of requiredNamespaces) {
			const configuredPath = namespacePaths[ns];
			items.push({
				label: `$(folder) ${ns}`,
				description: configuredPath || '⚠️ Not configured',
				detail: configuredPath ? `Path: ${configuredPath}` : 'Click to configure namespace path'
			});
		}
	}

	// Add custom namespace option
	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator
	});
	items.push({
		label: '$(add) Configure Custom Namespace',
		description: 'Add a namespace not in the required list',
		detail: 'Configure path for a custom namespace'
	});

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Jasmin LSP Configuration',
		matchOnDescription: true,
		matchOnDetail: true
	});

	if (!selected) return;

	// Handle selection
	if (selected.label.startsWith('$(file)')) {
		// Master file
		await vscode.commands.executeCommand('jasmin.setMasterFile');
	} else if (selected.label.startsWith('$(folder)')) {
		// Namespace configuration
		const namespaceName = selected.label.replace('$(folder) ', '');
		await configureNamespacePath(namespaceName);
	} else if (selected.label.startsWith('$(add)')) {
		// Custom namespace
		await configureNamespacePath();
	}
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
		const namespacePaths = config.get<Record<string, string>>('namespacePaths') || {};
		const namespaceCount = Object.keys(namespacePaths).length;
		
		if (masterFile) {
			const fileName = path.basename(masterFile);
			statusBarItem.text = `$(gear) Jasmin LSP | $(file) ${fileName}`;
			if (namespaceCount > 0) {
				statusBarItem.text += ` | $(folder) ${namespaceCount} NS`;
			}
			statusBarItem.show();
		} else {
			statusBarItem.text = `$(gear) Jasmin LSP | $(warning) No Master File`;
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
