{
  description = "Jasmin language extension for VsCode";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
  
   rec {

    packages.default =
      with import nixpkgs { inherit system; };
      stdenv.mkDerivation rec {

        name = "vscode-jasmin";
        src = null;

        buildInputs = [
          nodejs
          yarn
        ];

    };

    devShells.default =
      with import nixpkgs { inherit system; };
      mkShell {
        buildInputs =
          self.packages.${system}.default.buildInputs;
      };

  });
}
