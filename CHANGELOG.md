# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Version headings are intentionally unlinked: no tags exist on the remote repository
     yet, so there are no compare URLs to point at. Links can be added once tags are
     pushed. Versions 1.0.0–1.0.6 were published to npm under the former unscoped name
     `hardhat-multichain`. -->

## [Unreleased]

## [1.1.0] - 2026-07-06

### Changed

- **BREAKING:** Package renamed from `hardhat-multichain` to
  `@diamondslab/hardhat-multichain`. See the
  [migration guide in the README](README.md#migrating-from-hardhat-multichain). The old
  unscoped package will be deprecated on npm (not unpublished) after this release ships.
- Lifecycle scripts (`prepublishOnly`, `prepack`) are now yarn-based; the package is
  developed and published with Yarn 4.
- Source maps and declaration maps are no longer emitted — they previously shipped with
  broken references.
- Built `dist/` output is no longer committed to git. Installing straight from a git URL
  now requires a build step (`yarn install && yarn build`); installs from the npm tarball
  are unaffected.

### Added

- `exports` map exposing `.` (plugin entry), `./dist/*` (deep imports such as
  `./dist/chainManager`), and `./package.json`.
- `engines` field: Node.js ≥ 18 and Yarn ≥ 4. Node 16 (end-of-life) is no longer
  supported.
- `publishConfig` (`access: public`) for publishing the scoped package.

### Fixed

- The `LICENSE` file had shipped as 0 bytes since the 1.0.x releases; it now contains the
  full MIT license text.

### Removed

- Legacy `tslint.json` configuration.
- Loose verification scripts at the package root (moved under `scripts/`).

## [1.0.6] - 2025-12-08

Published as `hardhat-multichain@1.0.6`.

### Fixed

- ethers v6 `JsonRpcProvider` compatibility (v5/v6 provider type mismatch).
- `package.json` formatting/lint issue.

## [1.0.5] - 2025-10-31

### Changed

- Development-environment updates.

### Removed

- Committed `.yarn` directory and built `dist/` output removed from the repository.

## [1.0.4] - 2025-10-30

### Fixed

- Publishing/packaging configuration (yarn ignore rules and related publish issues).

> Note: versions 1.0.2 and 1.0.3 were published to npm without corresponding git tags;
> they were iterations on the same publishing fixes and have no separately derivable
> change set.

## [1.0.1] - 2025-10-30

Git tag only — this version was not published to npm.

### Added

- ESLint configuration.

### Fixed

- TypeScript errors in tests and IDE diagnostics; lint errors and warnings.

## [1.0.0] - 2025-10-29

First stable release, published to npm as `hardhat-multichain`.

### Fixed

- Failing tests.

## [0.9.0] - 2025-07-15

Initial pre-release (git tag only, not published to npm): multi-network forking driven by
`chainManager` config, the `test-multichain` task, ethers v6 upgrade, Jest unit and
integration test suites, per-chain log files, and initial npm packaging.
