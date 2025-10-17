This project is about a vscode extension for the jasmin language : vsjazz.

# Description

The language server is provided as the jasmin-lsp submodule. 

The tree-sitter grammar for jasmin is in the submodule of jasmin-lsp.

## Programmin languages

vsjazz is written mostly in typescript.

jasmin-lsp is written in OCaml, tested with pytest.

## Tests

vsjazz is tested by writting test scripts using the VSCode API and are placed in the test/ folder, following a pattern like  *.test.ts.

jasmin-lsp is tested by writting tests in jasmin-lsp/test and following a structured file tree by categories.

# Instructions

## Building

jasmin-lsp can be built using : pixi run build in the jasmin-lsp folder.

vsjazz can be build using : npm run compile in the vsjazz folder.

tree-sitter-jasmin grammar can be updated by running : "tree-sitter generate" in tree-sitter-jasmin within the pixi environment of jasmin-lsp.

## Testing

jasmin-lsp can be tested individually by running : pixi run test in the jasmin-lsp folder.

vsjazz can be tested individually by running : npm run compile-tests && npm test.

# Steering

- You will always start by adding tests for new features, before implementing the feature.
- Tests must always be run after modifications are brought to the code. You must iterate until the tests are all passing, either by updating the code, or updating the tests if the request updates the requirements.
- Reports of achievements / summaries must be as light as possible, i.e. 10 lines at most, and must not be reported into a file; i.e. no summary document should be generated.
- README.md or existing documentation must be updated to incorporate the new features or to take into account the changes.




