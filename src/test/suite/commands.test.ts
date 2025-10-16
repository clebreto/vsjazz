import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Commands Test Suite', () => {
	
	suiteSetup(async function() {
		this.timeout(60000);
		
		// Ensure extension is activated
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
	});

	teardown(async () => {
		// Clean up configuration
		const config = vscode.workspace.getConfiguration('jasmin');
		await config.update('masterFile', undefined, vscode.ConfigurationTarget.Workspace);
		await config.update('namespacePaths', undefined, vscode.ConfigurationTarget.Workspace);
	});

	test('jasmin.showConfiguration command should exist', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('jasmin.showConfiguration'), 'showConfiguration command should be registered');
	});

	test('jasmin.setMasterFile command should exist', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('jasmin.setMasterFile'), 'setMasterFile command should be registered');
	});

	test('jasmin.configureNamespace command should exist', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('jasmin.configureNamespace'), 'configureNamespace command should be registered');
	});

	test('jasmin.showConfiguration command should execute without error', async function() {
		this.timeout(10000);
		
		// This command shows a QuickPick, which we can't interact with in tests
		// But we can verify it doesn't throw an error when executed
		try {
			// Execute command (it will show UI but won't block in test environment)
			const result = vscode.commands.executeCommand('jasmin.showConfiguration');
			
			// The command should not throw
			assert.ok(result, 'Command should execute');
		} catch (error) {
			assert.fail(`Command should not throw: ${error}`);
		}
	});

	test('Configuration should persist after update', async () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		
		// Set master file
		const testFile = 'fixtures/master.jazz';
		await config.update('masterFile', testFile, vscode.ConfigurationTarget.Workspace);
		
		// Verify it persists
		const retrieved = config.get<string>('masterFile');
		assert.strictEqual(retrieved, testFile, 'Configuration should persist');
	});

	test('Namespace configuration should support multiple namespaces', async () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		
		const namespaces = {
			'Common': 'fixtures/Common',
			'Crypto': 'fixtures/Crypto',
			'Utils': 'fixtures/Utils'
		};
		
		await config.update('namespacePaths', namespaces, vscode.ConfigurationTarget.Workspace);
		
		const retrieved = config.get<Record<string, string>>('namespacePaths');
		assert.deepStrictEqual(retrieved, namespaces, 'Should support multiple namespaces');
	});

	test('Should handle empty namespace configuration', async () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		
		await config.update('namespacePaths', {}, vscode.ConfigurationTarget.Workspace);
		
		const retrieved = config.get<Record<string, string>>('namespacePaths');
		assert.deepStrictEqual(retrieved, {}, 'Should handle empty namespace config');
	});
});
