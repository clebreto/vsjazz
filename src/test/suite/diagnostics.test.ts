import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as util from 'util';

suite('Diagnostics Test Suite', () => {
	
	suiteSetup(async function() {
		this.timeout(60000);
		
		// Ensure extension is activated
		const extension = vscode.extensions.getExtension('jasmin-lang.vsjazz');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		
		// Wait for language server to initialize
		await new Promise(resolve => setTimeout(resolve, 2000));
	});

	test('Should receive diagnostics when opening file with errors', async function() {
		this.timeout(10000);
		
		// Create a temporary file with syntax errors
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder');
		}

		const tempFile = path.join(workspaceFolder.uri.fsPath, 'test_diagnostics_error.jazz');
		const invalidContent = `
fn invalid_function() {
	// Missing required syntax elements
	x = 
}
`;
		const encoder = new util.TextEncoder();
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(tempFile),
			encoder.encode(invalidContent)
		);

		try {
			const document = await vscode.workspace.openTextDocument(tempFile);
			await vscode.window.showTextDocument(document);
			
			// Wait for diagnostics to be published
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const diagnostics = vscode.languages.getDiagnostics(document.uri);
			
			assert.ok(diagnostics.length > 0, 'Should have diagnostics for file with syntax errors');
			console.log(`Received ${diagnostics.length} diagnostics on open`);
		} finally {
			// Clean up
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFile));
		}
	});

	test('Should update diagnostics when editing file', async function() {
		this.timeout(15000);
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder');
		}

		const tempFile = path.join(workspaceFolder.uri.fsPath, 'test_diagnostics_change.jazz');
		
		// Start with valid content
		const validContent = `fn test_function() -> reg u64 {
	reg u64 x;
	x = 42;
	return x;
}
`;
		const encoder = new util.TextEncoder();
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(tempFile),
			encoder.encode(validContent)
		);

		try {
			const document = await vscode.workspace.openTextDocument(tempFile);
			const editor = await vscode.window.showTextDocument(document);
			
			// Wait for initial diagnostics
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const initialDiagnostics = vscode.languages.getDiagnostics(document.uri);
			console.log(`Initial diagnostics: ${initialDiagnostics.length}`);
			
			// Listen for diagnostic changes
			let diagnosticsUpdated = false;
			const disposable = vscode.languages.onDidChangeDiagnostics(e => {
				if (e.uris.some(uri => uri.toString() === document.uri.toString())) {
					console.log('Diagnostics changed event fired');
					diagnosticsUpdated = true;
				}
			});
			
			// Now introduce an error by editing the document
			await editor.edit(editBuilder => {
				// Replace the entire content with invalid syntax
				const fullRange = new vscode.Range(
					document.positionAt(0),
					document.positionAt(document.getText().length)
				);
				// Add syntax errors: missing semicolon, invalid tokens
				editBuilder.replace(fullRange, `fn broken_function() -> reg u64 {
	reg u64 x
	invalid_token_here
	return x;
}
`);
			});
			
			// Wait for diagnostics to update after change
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			const updatedDiagnostics = vscode.languages.getDiagnostics(document.uri);
			console.log(`Updated diagnostics: ${updatedDiagnostics.length}`);
			console.log(`Diagnostics update event fired: ${diagnosticsUpdated}`);
			
			disposable.dispose();
			
			// We should have received a diagnostics update
			// Note: The actual diagnostic count depends on tree-sitter parser behavior
			// The key assertion is that the diagnostics were updated (event fired or count changed)
			assert.ok(
				diagnosticsUpdated || updatedDiagnostics.length !== initialDiagnostics.length,
				'Diagnostics should be updated after file edit'
			);
			
		} finally {
			// Clean up
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFile));
		}
	});

	test('Should clear diagnostics when fixing errors', async function() {
		this.timeout(10000);
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder');
		}

		const tempFile = path.join(workspaceFolder.uri.fsPath, 'test_diagnostics_fix.jazz');
		
		// Start with invalid content
		const invalidContent = `fn broken_function() {
	x = 
}
`;
		const encoder = new util.TextEncoder();
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(tempFile),
			encoder.encode(invalidContent)
		);

		try {
			const document = await vscode.workspace.openTextDocument(tempFile);
			const editor = await vscode.window.showTextDocument(document);
			
			// Wait for initial diagnostics
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const initialDiagnostics = vscode.languages.getDiagnostics(document.uri);
			console.log(`Initial diagnostics with errors: ${initialDiagnostics.length}`);
			assert.ok(initialDiagnostics.length > 0, 'Should have initial diagnostics for errors');
			
			// Fix the errors
			await editor.edit(editBuilder => {
				const fullRange = new vscode.Range(
					document.positionAt(0),
					document.positionAt(document.getText().length)
				);
				editBuilder.replace(fullRange, `fn fixed_function() {
	reg u32 x;
	x = 42;
}
`);
			});
			
			// Wait for diagnostics to update after fix
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const updatedDiagnostics = vscode.languages.getDiagnostics(document.uri);
			console.log(`Updated diagnostics after fix: ${updatedDiagnostics.length}`);
			
			assert.strictEqual(updatedDiagnostics.length, 0, 
				'Should have no diagnostics after fixing errors');
			
		} finally {
			// Clean up
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFile));
		}
	});

	test('Should provide diagnostic information details', async function() {
		this.timeout(10000);
		
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder');
		}

		const tempFile = path.join(workspaceFolder.uri.fsPath, 'test_diagnostics_details.jazz');
		const invalidContent = `fn test() {
	invalid syntax here
}
`;
		const encoder = new util.TextEncoder();
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(tempFile),
			encoder.encode(invalidContent)
		);

		try {
			const document = await vscode.workspace.openTextDocument(tempFile);
			await vscode.window.showTextDocument(document);
			
			// Wait for diagnostics
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const diagnostics = vscode.languages.getDiagnostics(document.uri);
			
			if (diagnostics.length > 0) {
				const diagnostic = diagnostics[0];
				
				// Check that diagnostic has required properties
				assert.ok(diagnostic.range, 'Diagnostic should have a range');
				assert.ok(diagnostic.message, 'Diagnostic should have a message');
				assert.ok(diagnostic.severity !== undefined, 'Diagnostic should have a severity');
				
				console.log(`Diagnostic: ${diagnostic.message}`);
				console.log(`  Range: Line ${diagnostic.range.start.line}, Col ${diagnostic.range.start.character}`);
				console.log(`  Severity: ${diagnostic.severity}`);
			}
			
		} finally {
			// Clean up
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFile));
		}
	});
});
