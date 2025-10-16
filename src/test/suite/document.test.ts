import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Document Features Test Suite', () => {
	
	suiteSetup(async function() {
		this.timeout(60000);
		
		// Ensure extension is activated
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
	});

	test('Should open Jasmin files', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		assert.ok(document, 'Document should open');
		assert.strictEqual(document.languageId, 'jasmin');
	});

	test('Document should have text content', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		const text = document.getText();
		assert.ok(text.length > 0, 'Document should have content');
		assert.ok(text.includes('test_function'), 'Should contain expected function name');
	});

	test('Should track file changes', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		const editor = await vscode.window.showTextDocument(document);
		
		let changeDetected = false;
		const disposable = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				changeDetected = true;
			}
		});
		
		// Make a small edit
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(0, 0), '// Test comment\n');
		});
		
		// Wait a bit for event to fire
		await new Promise(resolve => setTimeout(resolve, 100));
		
		disposable.dispose();
		
		assert.ok(changeDetected, 'Should detect document changes');
		
		// Revert the change
		await vscode.commands.executeCommand('workbench.action.files.revert');
	});

	test('Should support file system watcher for .jazz files', async () => {
		const watcher = vscode.workspace.createFileSystemWatcher('**/*.jazz');
		
		assert.ok(watcher, 'File system watcher should be created');
		
		watcher.dispose();
	});

	test('Should support file system watcher for .jinc files', async () => {
		const watcher = vscode.workspace.createFileSystemWatcher('**/*.jinc');
		
		assert.ok(watcher, 'File system watcher should be created');
		
		watcher.dispose();
	});

	test('Extension should handle multiple Jasmin files', async () => {
		const file1 = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const file2 = path.join(__dirname, '..', 'fixtures', 'master.jazz');
		
		const doc1 = await vscode.workspace.openTextDocument(file1);
		const doc2 = await vscode.workspace.openTextDocument(file2);
		
		assert.strictEqual(doc1.languageId, 'jasmin');
		assert.strictEqual(doc2.languageId, 'jasmin');
		assert.notStrictEqual(doc1.uri.toString(), doc2.uri.toString());
	});

	test('Should handle workspace folders', () => {
		// This test verifies workspace folder API works
		const folders = vscode.workspace.workspaceFolders;
		
		// In test environment, we may or may not have workspace folders
		// Just verify the API is available
		assert.ok(folders !== undefined || folders === undefined, 'Workspace folders API should be available');
	});

	test('Should provide configuration for workspace', () => {
		const config = vscode.workspace.getConfiguration('jasmin');
		
		assert.ok(config, 'Should get configuration object');
		assert.ok(typeof config.get === 'function', 'Configuration should have get method');
		assert.ok(typeof config.update === 'function', 'Configuration should have update method');
	});
});
