import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		assert.ok(extension, 'Extension should be installed');
	});

	test('Extension should activate', async function() {
		this.timeout(60000); // Give more time for activation
		
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		assert.ok(extension, 'Extension should be present');
		
		// Open a Jasmin file to trigger activation
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		await vscode.window.showTextDocument(document);
		
		// Wait for activation
		await extension.activate();
		
		assert.strictEqual(extension.isActive, true, 'Extension should be activated');
	});

	test('Jasmin language should be registered', async () => {
		const languages = await vscode.languages.getLanguages();
		assert.ok(languages.includes('jasmin'), 'Jasmin language should be registered');
	});

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands();
		
		assert.ok(commands.includes('jasmin.setMasterFile'), 'setMasterFile command should be registered');
		assert.ok(commands.includes('jasmin.configureNamespace'), 'configureNamespace command should be registered');
		assert.ok(commands.includes('jasmin.showConfiguration'), 'showConfiguration command should be registered');
	});
});
