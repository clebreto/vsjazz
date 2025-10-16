# Jasmin LSP Configuration UI Guide

## Status Bar Display

The status bar shows the current configuration state:

### With Master File and Namespaces
```
⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS
```
- **⚙️ Jasmin LSP**: Gear icon indicating the LSP is active
- **📄 main.jazz**: Current master file name
- **📁 3 NS**: Number of configured namespaces

### With Master File, No Namespaces
```
⚙️ Jasmin LSP | 📄 main.jazz
```

### No Master File
```
⚙️ Jasmin LSP | ⚠️ No Master File
```

**Clicking the status bar opens the configuration menu.**

---

## Configuration Menu

When you click the status bar, a Quick Pick menu appears:

```
┌─────────────────────────────────────────────────────────────────┐
│ Jasmin LSP Configuration                                        │
├─────────────────────────────────────────────────────────────────┤
│ 📄 Master File                                    main.jazz     │
│   Click to change the master Jasmin file                        │
├─────────────────────────────────────────────────────────────────┤
│ 📁 Common                                         ./common      │
│   Path: ./common                                                │
│                                                                  │
│ 📁 Crypto                                   ⚠️ Not configured   │
│   Click to configure namespace path                             │
│                                                                  │
│ 📁 Utils                                          ./utils       │
│   Path: ./utils                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ➕ Configure Custom Namespace                                   │
│   Add a namespace not in the required list                      │
└─────────────────────────────────────────────────────────────────┘
```

### Menu Sections

#### 1. Master File
- Shows current master file or "Not set"
- Clicking opens file picker to select a .jazz file
- After selection, automatically queries required namespaces

#### 2. Required Namespaces
- Lists all namespaces detected by the LSP server
- Each namespace shows:
  - **Configured**: Shows the configured path
  - **Not Configured**: Shows ⚠️ warning
- Clicking a namespace opens folder picker to set its path

#### 3. Custom Namespace
- Allows adding namespaces not automatically detected
- Useful for optional or conditional namespaces
- Opens input box for namespace name, then folder picker

---

## Configuration Workflows

### Project Already Configured

If you open a Jasmin project where master file and namespaces are already configured in `.vscode/settings.json`:

1. **Extension activates automatically**
   - Reads master file from configuration
   - Reads namespace paths from configuration
   - Sends both to LSP server automatically
   - No user interaction needed!

2. **Status bar shows configuration**
   ```
   ⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS
   ```

3. **LSP is ready immediately**
   - All features work right away
   - "Go to Definition" works across namespaces
   - No need to reconfigure

### Initial Setup

1. **Open Jasmin workspace**
   ```
   Status bar shows: ⚙️ Jasmin LSP | ⚠️ No Master File
   ```

2. **Click status bar**
   - Configuration menu opens

3. **Click "Master File"**
   - File picker opens
   - Select your main .jazz file
   - Extension queries required namespaces

4. **Click status bar again**
   ```
   Menu now shows required namespaces:
   📁 Common        ⚠️ Not configured
   📁 Crypto        ⚠️ Not configured
   📁 Utils         ⚠️ Not configured
   ```

5. **Configure each namespace**
   - Click on a namespace with ⚠️
   - Select folder containing that namespace's files
   - Repeat for all namespaces

6. **Configuration complete!**
   ```
   Status bar shows: ⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS
   ```

### Updating Configuration

#### Change Master File
1. Click status bar
2. Click "Master File"
3. Select new file
4. Namespaces automatically re-queried

#### Add/Change Namespace Path
1. Click status bar
2. Click on namespace to update
3. Select new folder
4. Path updated automatically

#### Add Custom Namespace
1. Click status bar
2. Click "Configure Custom Namespace"
3. Enter namespace name
4. Select folder
5. Configuration saved

---

## Command Palette Commands

### Jasmin: Show Configuration
- Opens the configuration menu
- Same as clicking status bar

### Jasmin: Set Master File
- Directly opens file picker for master file
- Bypasses menu

### Jasmin: Configure Namespace Path
- Shows namespace selection list
- Then opens folder picker
- Quick way to configure namespaces

---

## Configuration File Example

After using the UI, your `.vscode/settings.json` looks like:

```json
{
  "jasmin.path": "/path/to/jasmin-lsp",
  "jasmin.masterFile": "main.jazz",
  "jasmin.namespacePaths": {
    "Common": "./common",
    "Crypto": "./crypto",
    "Utils": "${workspaceFolder}/utils"
  }
}
```

You can also edit this file directly instead of using the UI.

---

## Visual Indicators

### Status Bar Icons
- **⚙️ (gear)**: LSP is active
- **📄 (file)**: Master file
- **📁 (folder)**: Namespace count
- **⚠️ (warning)**: Something not configured

### Menu Icons
- **📄 (file)**: Master file section
- **📁 (folder)**: Namespace entries
- **➕ (plus)**: Add custom namespace

### Configuration State
- **Green/Normal**: Configured and ready
- **⚠️ Not configured**: Needs configuration
- **Not set**: No value provided

---

## Troubleshooting

### "No Master File" Warning
- **Cause**: Master file not set
- **Fix**: Click status bar → Select master file

### "⚠️ Not configured" on Namespaces
- **Cause**: Namespace path not configured
- **Fix**: Click status bar → Click namespace → Select folder

### "Go to Definition" Not Working
- **Cause**: Namespace paths may be incorrect
- **Fix**: Verify paths in configuration menu point to correct directories

### Status Bar Not Showing
- **Cause**: Not viewing a .jazz or .jinc file
- **Fix**: Open a Jasmin file

---

## Tips

1. **Use relative paths**: Paths like `./common` work better with version control
2. **Use workspace variable**: `${workspaceFolder}/path` for flexibility
3. **Check LSP output**: View "Jasmin Language Server" in Output panel for debug info
4. **Auto-completion**: Required namespaces are detected automatically
5. **Settings sync**: Configuration stored in workspace, can be committed to git
