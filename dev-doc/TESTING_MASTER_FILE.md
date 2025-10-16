# Testing Master File Feature

## Setup Complete

The extension has been modified to support master file functionality:

### Changes Made

1. **package.json**:
   - Added `jasmin.masterFile` configuration setting
   - Added `jasmin.setMasterFile` command

2. **extension.ts**:
   - Status bar item showing current master file (visible on .jazz/.jinc files)
   - Command to select master file via file picker
   - Automatic sending of `jasmin/setMasterFile` notification to LSP server
   - Configuration change listener

### Test Workspace Created

Location: `/Users/clebreto/dev/splits/vsjazz-test-workspace`

Files:
- `main.jazz` - Master file that requires lib files
- `lib/utils.jinc` - Utility functions (add_one, multiply_two)
- `lib/crypto.jinc` - Crypto function (hash)

Settings (`.vscode/settings.json`):
```json
{
  "jasmin.path": "/Users/clebreto/dev/splits/jasmin-lsp/_build/default/jasmin-lsp/jasmin_lsp.exe",
  "jasmin.masterFile": "main.jazz"
}
```

## How to Test

### Step 1: Open Extension Development

```bash
cd /Users/clebreto/dev/splits/vsjazz
code .
```

Press `F5` to launch the extension in a new VSCode window.

### Step 2: Open Test Workspace

In the Extension Development Host window:
- File → Open Folder
- Select `/Users/clebreto/dev/splits/vsjazz-test-workspace`

### Step 3: Verify Status Bar

When you open any `.jazz` or `.jinc` file, you should see in the status bar (bottom right):

- `📄 Master: main.jazz` - if master file is set
- `⚠️ No Master File` - if no master file is set

**Click on the status bar item** to change the master file.

### Step 4: Test Master File Selection

1. Click on the status bar item OR
2. Open Command Palette (`Cmd+Shift+P`)
3. Type "Jasmin: Set Master File"
4. Select a `.jazz` file from the picker

You should see:
- Confirmation message: "Master file set to: main.jazz"
- Status bar updated
- Setting saved to workspace configuration

### Step 5: Test Symbol Resolution

1. Open `lib/utils.jinc`
2. Right-click on `add_one` function
3. Select "Find All References"
4. Should find usage in `main.jazz` (because main.jazz is the master file)

### Step 6: Verify LSP Server Logs

Check the LSP server logs to confirm the notification was received:

```bash
# In another terminal
tail -f ~/.vscode/extensions/*/logs/lsp.log
```

Look for:
```
[LOG] : Received jasmin/setMasterFile notification
[LOG] : Setting master file to: file:///.../main.jazz
[LOG] : Master file set to: file:///.../main.jazz
[LOG] : Using master file for dependency resolution: file:///.../main.jazz
```

### Step 7: Test Configuration Persistence

1. Close VSCode
2. Reopen the test workspace
3. Master file should be restored from settings
4. Status bar should show the correct master file

### Step 8: Test Without Master File

1. Open workspace settings (`.vscode/settings.json`)
2. Remove the `jasmin.masterFile` line
3. Save
4. Status bar should show "⚠️ No Master File"
5. Set master file again via command/status bar
6. Verify it gets saved to settings

## Expected Behavior

### Status Bar States

| Condition | Display | Clickable |
|-----------|---------|-----------|
| .jazz/.jinc file open + master set | `📄 Master: filename.jazz` | Yes |
| .jazz/.jinc file open + no master | `⚠️ No Master File` | Yes |
| Other file open | Hidden | - |

### Configuration

The setting should support:
- Relative paths: `"main.jazz"`
- Workspace variable: `"${workspaceFolder}/src/main.jazz"`
- Absolute paths: `"/full/path/to/main.jazz"`

### LSP Integration

When master file is set or changed:
1. Extension sends `jasmin/setMasterFile` notification
2. LSP server receives and logs it
3. Symbol resolution uses master file as entry point
4. Only files reachable from master file are searched

## Troubleshooting

### Status Bar Not Showing

- Check file has `.jazz` or `.jinc` extension
- Check languageId is set to "jasmin" in bottom right
- Reload window if needed

### Master File Not Set

- Check settings file syntax
- Check path is correct (relative to workspace root)
- Try using command to set it explicitly

### LSP Server Not Receiving Notification

- Check LSP server path is correct in settings
- Check LSP server is running (look for process)
- Enable LSP client logging: `"jasmin.trace.server": "verbose"`

### Compilation Issues

If you need to recompile after changes:
```bash
cd /Users/clebreto/dev/splits/vsjazz
pixi run npm run compile
```

## Success Criteria

✅ Status bar shows master file when .jazz/.jinc files are open
✅ Clicking status bar opens file picker
✅ Selected file is saved to workspace settings
✅ LSP server receives notification
✅ Configuration persists across restarts
✅ Relative paths are resolved correctly
✅ Symbol resolution uses master file

## Files Modified

- `package.json` - Added configuration and command
- `src/extension.ts` - Implemented all functionality
- Backup files created:
  - `package.json.backup`
  - `src/extension.ts.backup`
