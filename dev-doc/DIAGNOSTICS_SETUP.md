# Setting Up Real-Time Diagnostics

**Date**: October 16, 2025

## Quick Setup Guide

This guide explains how to set up the VsJazz extension for real-time diagnostics (PROBLEMS panel updates) when editing `.jazz` and `.jinc` files.

## Prerequisites

1. VS Code installed
2. VsJazz extension installed (jasmin-lang.vsjazz)
3. Built jasmin-lsp server

## Building the LSP Server

The jasmin-lsp is included as a git submodule. To build it:

```bash
# Navigate to the jasmin-lsp directory
cd jasmin-lsp

# Initialize and update submodules (tree-sitter-jasmin)
git submodule update --init --recursive

# Build with pixi (recommended)
pixi run build

# The executable will be at: _build/default/jasmin-lsp/jasmin_lsp.exe
```

## Configuring VS Code

### Workspace Settings

Create or edit `.vscode/settings.json` in your workspace:

```json
{
  "jasmin.path": "${workspaceFolder}/jasmin-lsp/_build/default/jasmin-lsp/jasmin_lsp.exe",
  "jasmin.masterFile": "main.jazz",
  "jasmin.namespacePaths": {
    "Common": "${workspaceFolder}/lib/common"
  }
}
```

### Configuration Options

- **`jasmin.path`**: Path to the LSP server executable (required)
- **`jasmin.masterFile`**: Entry point for your project (optional, for cross-file navigation)
- **`jasmin.namespacePaths`**: Mapping of namespace names to directories (optional)

## How Diagnostics Work

### Automatic Updates

The PROBLEMS panel updates automatically in these scenarios:

1. **Opening a file**: Diagnostics shown immediately
2. **Typing in editor**: Updates as you type (with debouncing)
3. **Saving a file**: Diagnostics refreshed
4. **External changes**: Updates when files change on disk (git pull, etc.)

### What Gets Checked

Currently, the LSP detects **syntax errors**:
- Missing semicolons
- Unclosed braces
- Invalid function signatures
- Malformed expressions
- Other parsing errors detected by tree-sitter

### Example Error Detection

```jasmin
fn example() -> reg u64 {
  reg u64 x;
  x = 5  // ❌ ERROR: Missing semicolon
  return x;
}
```

The error will appear in:
- **PROBLEMS panel**: Shows file, line, and error message
- **Editor**: Red squiggly underline at error location
- **Status bar**: Error count indicator

## Troubleshooting

### No Diagnostics Appearing

1. **Check LSP is running**:
   - Open Output panel (View → Output)
   - Select "Jasmin Language Server" from dropdown
   - Look for initialization messages

2. **Verify LSP path**:
   ```bash
   # Check the executable exists
   ls -la jasmin-lsp/_build/default/jasmin-lsp/jasmin_lsp.exe
   ```

3. **Reload VS Code window**:
   - Command Palette (Cmd/Ctrl+Shift+P)
   - Run: "Developer: Reload Window"

### LSP Not Starting

1. **Check permissions**:
   ```bash
   chmod +x jasmin-lsp/_build/default/jasmin-lsp/jasmin_lsp.exe
   ```

2. **Check dependencies** (on macOS):
   ```bash
   # The LSP uses dynamic libraries from pixi environment
   cd jasmin-lsp
   pixi run which jasmin_lsp.exe
   ```

3. **View LSP logs**:
   - Open Output panel
   - Select "Jasmin Language Server"
   - Enable verbose logging if needed

### Diagnostics Not Updating

1. **Check file is recognized as Jasmin**:
   - Look at bottom-right of VS Code window
   - Should show "Jasmin" as language
   - If not, manually select: "Plain Text" → "Jasmin"

2. **Check file watcher**:
   - Settings → `files.watcherExclude`
   - Make sure `.jazz` and `.jinc` files are not excluded

3. **Restart LSP server**:
   - Command Palette: "Developer: Restart Extension Host"

## Advanced Configuration

### Custom Master File

Use the status bar item to configure:
1. Click the "Jasmin LSP" item in status bar (bottom-right)
2. Select "Master File"
3. Choose your entry point `.jazz` file

Or use Command Palette:
- "Jasmin: Set Master File"

### Namespace Configuration

For projects using `from require` with namespaces:
1. Click status bar → "Configure Namespace"
2. Or use Command Palette: "Jasmin: Configure Namespace Path"

### File Watcher Settings

The extension automatically watches `.jazz` and `.jinc` files. To customize:

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true
  }
}
```

## Verification

### Test Diagnostics

1. Create a test file `test.jazz`:
   ```jasmin
   fn broken() {
     // Missing return type
     reg u64 x;
   ```

2. Open in VS Code
3. PROBLEMS panel should show errors
4. Fix the errors:
   ```jasmin
   fn broken() -> reg u64 {
     reg u64 x;
     x = 0;
     return x;
   }
   ```
5. PROBLEMS should clear automatically

### Check LSP Communication

Look for these log messages in Output panel:
- `Server initialized`
- `Collected N diagnostics`
- `Received N diagnostics for file://...`

## Status Bar Features

When editing `.jazz` or `.jinc` files, the status bar shows:
- **$(gear) Jasmin LSP**: Server is active
- **$(file) filename.jazz**: Current master file
- **$(folder) N NS**: Number of configured namespaces

Click the status bar item to:
- View configuration
- Change master file
- Configure namespaces

## Related Documentation

- [Extension Implementation](/dev-doc/IMPLEMENTATION_SUMMARY.md)
- [LSP Server Documentation](/jasmin-lsp/README.md)
- [Real-Time Diagnostics Implementation](/jasmin-lsp/dev_doc/REAL_TIME_DIAGNOSTICS.md)
- [Testing Guide](/jasmin-lsp/test/README.md)
