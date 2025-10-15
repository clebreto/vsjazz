# VsJazz

This extension provides support for the Jasmin language in vscode.

## Installing VsJazz

VsJazz requires a working installation of the jasmin-language-server.

### Using opam
```shell
opam pin https://github.com/maximedenes/jasmin-language-server.git add
```

### Developper build using nix
Clone the repo and from the source dir:
```shell
nix develop
dune build
```

### vscode user settings

Set the ```jasmin.path``` setting to the full path to the jasmin-language-server binary.
```json
"jasmin.path": "/path/to/jasmin-lsp"
```

## Features

### Master File Configuration

Set the master Jasmin file (compilation entry point) to enable full LSP features:

1. Click the status bar item showing "Jasmin LSP"
2. Select "Master File" and choose your main .jazz file
3. Or set it in settings.json:
   ```json
   "jasmin.masterFile": "main.jazz"
   ```

### Namespace Path Configuration

Configure filesystem paths for Jasmin namespaces to enable cross-namespace navigation:

1. After setting master file, the extension queries required namespaces
2. Click the status bar to open configuration menu
3. Configure each namespace path by selecting its folder
4. Or configure in settings.json:
   ```json
   "jasmin.namespacePaths": {
     "Common": "./common",
     "Crypto": "./crypto",
     "Utils": "${workspaceFolder}/utils"
   }
   ```

The status bar shows: `⚙️ Jasmin LSP | 📄 main.jazz | 📁 3 NS`

**Commands available:**
- `Jasmin: Set Master File` - Select master file
- `Jasmin: Configure Namespace Path` - Configure namespace paths
- `Jasmin: Show Configuration` - Open configuration menu

See [NAMESPACE_CONFIGURATION_IMPLEMENTATION.md](NAMESPACE_CONFIGURATION_IMPLEMENTATION.md) for detailed documentation.

## License
Unless mentioned otherwise, files in this repository are [distributed under the MIT License](LICENSE).