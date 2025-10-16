# VsJazz Extension Tests

This directory contains the test suite for the VsJazz extension.

## Test Structure

### Test Files

1. **extension.test.ts** - Core extension tests
   - Extension presence and activation
   - Language registration
   - Command registration

2. **configuration.test.ts** - Configuration management tests
   - Master file configuration
   - Namespace paths configuration
   - Configuration persistence
   - Variable substitution support

3. **languageServer.test.ts** - Language server integration tests
   - Document language ID detection
   - File type recognition (.jazz, .jinc)
   - Document selector matching
   - Diagnostics integration

4. **commands.test.ts** - Command execution tests
   - Command registration verification
   - Command execution (jasmin.showConfiguration, jasmin.setMasterFile, jasmin.configureNamespace)
   - Configuration persistence
   - Multiple namespace support

5. **document.test.ts** - Document and workspace tests
   - Document opening and reading
   - Text content verification
   - File change tracking
   - File system watchers
   - Multiple file handling

### Test Fixtures

Located in `src/test/fixtures/`:
- `sample.jazz` - Simple Jasmin file for basic tests
- `master.jazz` - Master file with namespace imports
- `Common/utils.jinc` - Sample include file for namespace tests

## Running Tests

### Compile Tests
```bash
npm run compile-tests
```

### Run Tests
```bash
npm test
```

### Watch Tests
```bash
npm run watch-tests
```

## Test Framework

- **Test Runner**: Mocha with TDD style
- **Assertion Library**: Node.js assert module
- **VS Code API**: @vscode/test-electron

## Writing New Tests

Follow the existing pattern:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
  
  suiteSetup(async function() {
    this.timeout(60000);
    // Setup code
  });

  teardown(async () => {
    // Cleanup code
  });

  test('My test case', async () => {
    // Test implementation
    assert.ok(true, 'Test passed');
  });
});
```

## Coverage

The test suite covers:
- ✅ Extension activation and lifecycle
- ✅ Language registration and document handling
- ✅ Configuration management (master file, namespaces)
- ✅ Command registration and execution
- ✅ File system integration
- ✅ Language server client setup
- ✅ Multi-file workspace scenarios

## Notes

- Tests run in a real VS Code instance using @vscode/test-electron
- Some tests may show UI elements (QuickPick, dialogs) but won't block in test mode
- Configuration changes are cleaned up after each test to avoid side effects
- Tests have generous timeouts (60s) for activation to accommodate slower systems
