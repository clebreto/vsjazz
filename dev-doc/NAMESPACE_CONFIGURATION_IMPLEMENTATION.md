# Namespace Path Configuration Implementation

## Overview

This document describes the implementation of namespace path configuration for the Jasmin LSP VS Code extension. This feature allows users to configure filesystem paths for Jasmin namespaces, enabling accurate "Go to Definition" and other LSP features across namespace boundaries.

## Features Implemented

### 1. Configuration Settings

Added `jasmin.namespacePaths` configuration in `package.json`:

```json
"jasmin.namespacePaths": {
  "type": "object",
  "default": {},
  "description": "Mapping of namespace identifiers to filesystem paths",
  "scope": "resource"
}
```

Example configuration:
```json
{
  "jasmin.namespacePaths": {
    "Common": "/path/to/common",
    "Crypto": "/path/to/crypto",
    "Utils": "${workspaceFolder}/utils"
  }
}
```

### 2. LSP Protocol Integration

Implemented two custom LSP messages:

#### Request: `jasmin/getRequiredNamespaces`
- Queries the LSP server for namespaces that need configuration
- Returns: `{ namespaces: string[] }`
- Called after master file is set

#### Notification: `jasmin/setNamespacePaths`
- Sends configured namespace paths to the LSP server
- Parameters: `{ paths: [{ namespace: string, path: string }] }`
- Called when configuration changes or after querying required namespaces

### 3. Enhanced Status Bar

The status bar now displays:
- **Gear icon** ($(gear)) indicating "Jasmin LSP"
- **Master file** with file icon ($(file))
- **Namespace count** with folder icon ($(folder)) if namespaces are configured
- Example: `$(gear) Jasmin LSP | $(file) main.jazz | $(folder) 3 NS`

Clicking the status bar opens the configuration menu.

### 4. Configuration Menu

A rich Quick Pick menu (`jasmin.showConfiguration`) that displays:

1. **Master File** section
   - Shows current master file or "Not set"
   - Click to change master file

2. **Namespace Paths** section
   - Lists all required namespaces from LSP
   - Shows configured path or "⚠️ Not configured" warning
   - Click to configure individual namespace path

3. **Custom Namespace** option
   - Allows configuring namespaces not in the required list

### 5. Commands

Three commands are now available:

#### `jasmin.setMasterFile`
- Opens file picker to select master .jazz file
- Updates configuration
- Notifies LSP server
- Queries required namespaces automatically

#### `jasmin.configureNamespace`
- Opens folder picker to select namespace path
- Can be called with namespace name or shows selection menu
- Updates configuration
- Notifies LSP server

#### `jasmin.showConfiguration`
- Opens configuration menu with all options
- Triggered by clicking status bar

### 6. Automatic Configuration Management

- **Extension Activation**: When extension starts, automatically reads configuration and sends to LSP if already set
- **Master File Changes**: When master file is set/changed, automatically queries required namespaces
- **Configuration Watching**: Monitors changes to `jasmin.namespacePaths` and updates LSP server
- **Path Resolution**: Supports both absolute paths and `${workspaceFolder}` variable
- **Relative Path Support**: Converts workspace-relative paths to absolute paths for LSP
- **Initialization Flow**: 
  1. Extension activates
  2. If master file is configured, send to LSP
  3. If namespace paths are configured, send to LSP
  4. Status bar updates to show configuration state

## User Workflow

### Setting Up a New Project

1. Open a Jasmin workspace
2. Click the status bar showing "$(gear) Jasmin LSP | $(warning) No Master File"
3. Select "Master File" and choose your main .jazz file
4. Extension automatically queries required namespaces
5. Click status bar again to see namespace configuration status
6. Click on unconfigured namespaces (marked with ⚠️) to set their paths
7. LSP is now fully configured for cross-namespace navigation

### Alternative Workflow

1. Use Command Palette: "Jasmin: Set Master File"
2. Use Command Palette: "Jasmin: Configure Namespace Path"
3. Or edit `settings.json` directly:
   ```json
   {
     "jasmin.masterFile": "main.jazz",
     "jasmin.namespacePaths": {
       "Common": "./common",
       "Crypto": "./crypto"
     }
   }
   ```

## Implementation Details

### TypeScript Types

```typescript
interface NamespacePath {
  namespace: string;
  path: string;
}

interface GetRequiredNamespacesResponse {
  namespaces: string[];
}
```

### Key Functions

- `initializeConfigurationFromSettings()`: Reads saved configuration on startup and sends to LSP
- `showConfigurationMenu()`: Displays interactive configuration UI
- `queryAndConfigureNamespaces()`: Queries LSP and updates paths
- `updateMasterFileFromConfig()`: Reads master file config and notifies LSP
- `updateNamespacePathsFromConfig()`: Reads namespace paths config and notifies LSP
- `configureNamespacePath()`: Interactive namespace path configuration
- `updateStatusBar()`: Refreshes status bar display

### Automatic Triggers

1. Extension activation → `initializeConfigurationFromSettings()` → Send master file and namespaces if configured
2. Master file set via UI → Send to LSP → Query required namespaces → Update paths
3. Master file config change → Update LSP server
4. Namespace paths config change → Update LSP server
5. Active editor change → Update status bar

## Benefits

1. **Accurate Resolution**: Matches Jasmin compiler's namespace handling
2. **User-Friendly**: Visual configuration through Quick Pick menus
3. **Flexible**: Supports relative and absolute paths, workspace variables
4. **Automatic**: Queries required namespaces from LSP server
5. **Responsive**: Real-time updates to LSP when configuration changes
6. **Visible**: Status bar shows configuration status at a glance

## Testing Recommendations

### Manual Testing

1. Create a Jasmin project with namespaced requires
2. Set master file via status bar menu
3. Verify required namespaces are detected
4. Configure namespace paths
5. Test "Go to Definition" across namespace boundaries
6. Change namespace paths and verify updates work
7. Test with both absolute and relative paths
8. Test `${workspaceFolder}` variable substitution

### Edge Cases

- No master file set
- Master file with no namespace requirements
- Invalid namespace paths
- Namespace paths that don't exist
- Multiple workspace folders
- Configuration changes while LSP is working

## Files Modified

### `package.json`
- Added `jasmin.namespacePaths` configuration
- Added `jasmin.configureNamespace` command
- Added `jasmin.showConfiguration` command
- Cleaned up activation events

### `src/extension.ts`
- Added namespace path types and LSP message definitions
- Implemented `showConfigurationMenu()` function
- Implemented `queryAndConfigureNamespaces()` function
- Implemented `updateNamespacePathsFromConfig()` function
- Implemented `configureNamespacePath()` function
- Enhanced `updateStatusBar()` with namespace count display
- Added configuration change watchers for namespace paths
- Updated master file workflow to query namespaces

## Future Enhancements

1. **Auto-Discovery**: Heuristics to suggest namespace paths based on directory structure
2. **Validation**: Check that configured paths exist and contain valid files
3. **Workspace State**: Remember unconfigured namespaces and prompt user
4. **Custom Settings UI**: Tree view or webview for easier configuration
5. **Import Path Analysis**: Parse files to suggest namespace names
6. **Multi-Root Workspace**: Support different configurations per folder
7. **Namespace Templates**: Pre-configured paths for common project structures

## Documentation

Users should be informed about:
- How to set up namespace paths
- The `${workspaceFolder}` variable
- The status bar configuration menu
- How to troubleshoot "definition not found" issues
- Example project structures and configurations
