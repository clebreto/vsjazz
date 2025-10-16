# Extension Initialization Behavior

## Overview

The vsjazz extension now properly initializes LSP configuration from saved settings when the extension activates, ensuring users don't need to manually reconfigure on every restart.

## Initialization Flow

### On Extension Activation

```
Extension Activates
    ↓
LSP Client Starts
    ↓
initializeConfigurationFromSettings()
    ↓
┌─────────────────────────────────────┐
│ Read Configuration                  │
│  - jasmin.masterFile                │
│  - jasmin.namespacePaths            │
└─────────────────────────────────────┘
    ↓
Is Master File Configured?
    ├─ YES → Send to LSP via jasmin/setMasterFile
    └─ NO  → Skip
    ↓
Are Namespace Paths Configured?
    ├─ YES → Send to LSP via jasmin/setNamespacePaths
    └─ NO  → Skip
    ↓
Update Status Bar
    ↓
Ready! 🎉
```

## Scenarios

### Scenario 1: Fully Configured Project

**Configuration exists:**
```json
{
  "jasmin.masterFile": "main.jazz",
  "jasmin.namespacePaths": {
    "Common": "./common",
    "Crypto": "./crypto"
  }
}
```

**What happens:**
1. Extension activates
2. Reads configuration
3. Sends master file to LSP
4. Sends namespace paths to LSP
5. Status bar shows: `⚙️ Jasmin LSP | 📄 main.jazz | 📁 2 NS`
6. **All LSP features work immediately**

**User action required:** None! Everything works automatically.

---

### Scenario 2: Only Master File Configured

**Configuration exists:**
```json
{
  "jasmin.masterFile": "main.jazz"
}
```

**What happens:**
1. Extension activates
2. Reads configuration
3. Sends master file to LSP
4. No namespace paths to send
5. Status bar shows: `⚙️ Jasmin LSP | 📄 main.jazz`

**User action required:** 
- Click status bar to see if namespaces need configuration
- Configure namespaces if needed

---

### Scenario 3: No Configuration

**No configuration exists**

**What happens:**
1. Extension activates
2. Reads configuration (empty)
3. Nothing to send to LSP
4. Status bar shows: `⚙️ Jasmin LSP | ⚠️ No Master File`

**User action required:**
- Click status bar
- Set master file
- Configure namespaces if prompted

---

### Scenario 4: Configuration Changes While Running

**User edits settings.json while extension is running**

**What happens:**
1. Configuration change detected
2. `onDidChangeConfiguration` event fires
3. If master file changed → Update LSP
4. If namespace paths changed → Update LSP
5. Status bar updates automatically

**User action required:** None! Changes apply automatically.

---

## Key Benefits

### 1. **Zero Configuration on Restart**
Once configured, users never need to reconfigure. The extension remembers settings and applies them automatically.

### 2. **Team Collaboration**
Configuration is stored in `.vscode/settings.json`, which can be committed to version control. When team members clone the repo, they get the correct configuration automatically.

### 3. **Immediate Functionality**
LSP features work immediately upon opening a Jasmin file. No "warming up" period.

### 4. **Consistent State**
The LSP server always reflects the current configuration, even after VS Code restarts.

## Implementation Details

### New Function: `initializeConfigurationFromSettings()`

```typescript
async function initializeConfigurationFromSettings() {
	if (!client) return;

	const config = vscode.workspace.getConfiguration('jasmin');
	const masterFile = config.get<string>('masterFile');
	const namespacePaths = config.get<Record<string, string>>('namespacePaths') || {};
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

	console.log('Initializing configuration from settings...');

	// Send master file if configured
	if (masterFile && workspaceFolder) {
		// Resolve paths and send to LSP
		const uri = vscode.Uri.file(resolvedPath).toString();
		await setMasterFile(uri);
	}

	// Send namespace paths if configured
	if (Object.keys(namespacePaths).length > 0 && workspaceFolder) {
		// Convert to NamespacePath array and send to LSP
		await client.sendNotification(SetNamespacePathsNotification, { paths });
	}

	updateStatusBar(vscode.window.activeTextEditor);
}
```

### Called From Extension Activation

```typescript
client.start().then(async () => {
	console.log('Jasmin LSP client started');
	
	// Initialize configuration from settings
	await initializeConfigurationFromSettings();
});
```

## Console Output

When debugging, you'll see:

```
Jasmin LSP client started
Initializing configuration from settings...
Master file: main.jazz
Namespace paths: { Common: './common', Crypto: './crypto' }
Master file sent to LSP: file:///path/to/main.jazz
Namespace paths sent to LSP: [
  { namespace: 'Common', path: '/path/to/common' },
  { namespace: 'Crypto', path: '/path/to/crypto' }
]
```

## User Experience

### First Time User
1. Opens Jasmin project
2. Sees: `⚙️ Jasmin LSP | ⚠️ No Master File`
3. Clicks status bar
4. Configures master file and namespaces
5. Settings saved to `.vscode/settings.json`

### Returning User
1. Opens Jasmin project
2. Extension auto-configures from saved settings
3. Sees: `⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS`
4. **Everything just works™**

### Team Member (from Git)
1. Clones repository (includes `.vscode/settings.json`)
2. Opens Jasmin project
3. Extension auto-configures from committed settings
4. Sees: `⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS`
5. **No configuration needed!**

## Testing Checklist

- [ ] Open project with existing configuration → Verify LSP receives settings
- [ ] Open project with no configuration → Verify user can configure
- [ ] Change master file in settings → Verify LSP updates
- [ ] Change namespace paths in settings → Verify LSP updates
- [ ] Restart VS Code → Verify configuration persists
- [ ] Clone project with committed settings → Verify auto-configuration
- [ ] Check console output → Verify initialization logs
- [ ] Test "Go to Definition" → Verify works immediately after opening

## Troubleshooting

### LSP Not Working After Opening Project

**Check:**
1. Is master file configured? (Check status bar)
2. Are namespace paths configured? (Click status bar)
3. Are paths correct? (Check console for resolved paths)
4. Did extension activate? (Check "Jasmin Language Server" in Output panel)

**Debug:**
- Open "Output" panel
- Select "Jasmin Language Server" from dropdown
- Look for initialization messages
- Check for error messages

### Configuration Not Being Sent

**Verify:**
1. Check `.vscode/settings.json` exists and has correct format
2. Check console for "Initializing configuration from settings..." message
3. Verify workspace folder is detected
4. Check paths are valid (no typos)

**Fix:**
- Manually trigger configuration via status bar menu
- Check file permissions on settings.json
- Ensure jasmin.path points to valid LSP binary
