# Contributing to `@diamondslab/hardhat-multichain`

Thanks for your interest in contributing! This guide covers how to propose changes.

## Getting started

This package is developed with **Yarn 4** (`yarn@4.10.3`) and Node.js ≥ 18.

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/your-username/hardhat-multichain.git
   cd hardhat-multichain
   ```

2. Install, build, and test:

   ```bash
   yarn install      # install dependencies
   yarn build        # compile TypeScript (tsc)
   yarn test         # run the test suite (jest)
   yarn lint         # eslint
   yarn lint:fix     # eslint --fix
   yarn format       # prettier --write
   yarn format:check # prettier --check
   ```

Other useful scripts: `yarn watch` (tsc watch mode), `yarn test:watch`,
`yarn test:coverage`.

## Workflow

1. **Fork** the repository and create a feature branch:
   `git checkout -b feature/your-change`.
2. Make your change with tests where appropriate; keep `yarn build`, `yarn test`, and
   `yarn lint` green.
3. Update `CHANGELOG.md` under the `[Unreleased]` section (Keep a Changelog format).
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/) — types
   map to SemVer bumps (e.g. `feat:` → minor, `fix:` → patch).
5. Push and open a **Pull Request** against `main`; fill in the PR template.

## Versioning

This project follows **Semantic Versioning** and **Keep a Changelog**. Releases (version
bump + tag) are cut by the maintainers; contributors only add entries under
`[Unreleased]`.

## Reporting bugs & requesting features

Open an issue using the appropriate template under
[`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/). For **security** issues, do **not**
open a public issue — follow [`SECURITY.md`](SECURITY.md).

When filing a bug report, please include:

1. **Environment details**: Node.js version, operating system, hardhat version
2. **Steps to reproduce**: Clear steps to reproduce the issue
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Error messages**: Full error messages and stack traces
6. **Configuration**: Your `hardhat.config.ts` and any relevant environment variables

For feature requests, please:

1. Check existing issues to avoid duplicates
2. Clearly describe the feature and use case
3. Provide examples of how it would be used
4. Consider if it fits with the project's goals

## Pull request expectations

1. **Title**: Use a clear, descriptive Conventional Commit title
2. **Description**: Explain what the PR does and why
3. **Breaking changes**: Clearly mark any breaking changes and migration steps
4. **Tests**: Ensure new features have appropriate test coverage and all tests pass
5. **Documentation**: Update README.md and JSDoc comments as needed

## Testing guidelines

### Test categories

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete workflows

### Writing tests

- Use descriptive test names
- Test both success and failure cases
- Use appropriate setup/teardown
- Mock external dependencies appropriately

### Test structure

```typescript
describe("Feature Name", function () {
  beforeEach(function () {
    // Setup
  });

  afterEach(function () {
    // Cleanup
  });

  describe("method name", function () {
    it("should do something specific", function () {
      // Test implementation
    });

    it("should handle error case", function () {
      // Error testing
    });
  });
});
```

## Code standards

### TypeScript guidelines

- Use strict TypeScript configuration
- Avoid `any` types when possible
- Provide explicit return types for public methods
- Use meaningful variable and function names

### Error handling

- Create custom error classes for specific error types
- Provide meaningful error messages and include context
- Use async/await with proper try-catch blocks

### Performance considerations

- Avoid blocking operations in the main thread
- Use appropriate timeouts for network operations
- Clean up resources properly
- Consider memory usage for long-running processes

### Documentation

- Use JSDoc comments for all public APIs
- Include examples in documentation
- Keep the README concise but comprehensive, with working examples

## Project structure

```bash
src/
├── chainManager.ts     # Core chain management
├── index.ts            # Main plugin entry point
└── type-extensions.ts  # TypeScript type definitions

test/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── fixtures/          # Test fixtures
└── helpers.ts         # Test utilities

examples/
├── basic-setup/       # Basic example
├── advanced-config/   # Advanced configuration
└── cross-chain/       # Cross-chain examples

docs/
├── api.md             # API documentation
├── examples.md        # Usage examples
└── troubleshooting.md # Common issues
```

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT
License.
