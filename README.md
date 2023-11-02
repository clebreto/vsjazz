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

## License
Unless mentioned otherwise, files in this repository are [distributed under the MIT License](LICENSE).