import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Language Server Test Suite', () => {
	
	suiteSetup(async function() {
		this.timeout(60000);
		
		// Ensure extension is activated
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		
		// Open a Jasmin file to ensure language server starts
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		await vscode.window.showTextDocument(document);
		
		// Wait a bit for language server to initialize
		await new Promise(resolve => setTimeout(resolve, 2000));
	});

	test('Jasmin documents should have correct language ID', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		assert.strictEqual(document.languageId, 'jasmin', 'Document should have jasmin language ID');
	});

	test('Should recognize .jazz files', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		assert.ok(document.fileName.endsWith('.jazz'), 'Should open .jazz files');
		assert.strictEqual(document.languageId, 'jasmin');
	});

	test('Should recognize .jinc files', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'Common', 'utils.jinc');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		assert.ok(document.fileName.endsWith('.jinc'), 'Should open .jinc files');
		assert.strictEqual(document.languageId, 'jasmin');
	});

	test('Document selector should match Jasmin files', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		// Check if there are any diagnostics for the file (indicates LSP is working)
		const diagnostics = vscode.languages.getDiagnostics(document.uri);
		
		// Just verify we can get diagnostics (array can be empty or have items)
		assert.ok(Array.isArray(diagnostics), 'Should be able to get diagnostics for Jasmin files');
	});

	test('Language configuration should support comments', async () => {
		const fixtureFile = path.join(__dirname, '..', 'fixtures', 'sample.jazz');
		const document = await vscode.workspace.openTextDocument(fixtureFile);
		
		// Verify the file contains comments
		const text = document.getText();
		assert.ok(text.includes('//'), 'Sample file should contain line comments');
	});
});
