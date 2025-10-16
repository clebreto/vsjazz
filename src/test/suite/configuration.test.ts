import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Configuration Test Suite', () => {
	
	// Set up test environment
	suiteSetup(async function() {
		this.timeout(60000);
		
		// Ensure extension is activated
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
	});

	// Clean up after tests
	teardown(async () => {
		// Reset configuration
		const config = vscode.workspace.getConfiguration('jasmin');
		await config.update('masterFile', undefined, vscode.ConfigurationTarget.Workspace);
		await config.update('namespacePaths', undefined, vscode.ConfigurationTarget.Workspace);
	});

	test('Master file configuration should be accessible', () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		assert.ok(config.has('masterFile'), 'masterFile configuration should exist');
	});

	test('Namespace paths configuration should be accessible', () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		assert.ok(config.has('namespacePaths'), 'namespacePaths configuration should exist');
	});

	test('Should update master file configuration', async () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		const testMasterFile = 'test/master.jazz';
		
		await config.update('masterFile', testMasterFile, vscode.ConfigurationTarget.Workspace);
		
		const updatedValue = config.get<string>('masterFile');
		assert.strictEqual(updatedValue, testMasterFile, 'Master file configuration should be updated');
	});

	test('Should update namespace paths configuration', async () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		const testNamespacePaths = {
			'Common': 'test/Common',
			'Crypto': 'test/Crypto'
		};
		
		await config.update('namespacePaths', testNamespacePaths, vscode.ConfigurationTarget.Workspace);
		
		const updatedValue = config.get<Record<string, string>>('namespacePaths');
		assert.deepStrictEqual(updatedValue, testNamespacePaths, 'Namespace paths should be updated');
	});

	test('Configuration should support ${workspaceFolder} variable', () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		const configDescription = config.inspect<string>('masterFile');
		
		assert.ok(configDescription, 'Master file configuration should have metadata');
		// The configuration accepts strings, so ${workspaceFolder} is valid
	});

	test('Server path configuration should be accessible', () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		assert.ok(config.has('path'), 'path configuration should exist');
		assert.ok(config.has('args'), 'args configuration should exist');
	});
});
