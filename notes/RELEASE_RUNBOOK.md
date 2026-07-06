# Release Runbook — `@diamondslab/hardhat-multichain`

Tag-triggered OIDC publish (`.github/workflows/release.yml`). **[Eng]** = any
maintainer; **[Owner]** = DiamondsLab org admin + npm `@diamondslab` access.

- **Package:** `@diamondslab/hardhat-multichain` (public) · **Registry:** npmjs.com
- **Repo:** <https://github.com/DiamondsLab/hardhat-multichain> (submodule of diamonds-dev-env)
- **Toolchain:** Node ≥ 18 (`engines`), Yarn 4.10.3 · **Tag = publish trigger**
- This repo has **no git hooks** (instant push). No standalone `yarn.lock` — CI/publish
  use `yarn install --no-immutable`.

> Kit-instantiated (M2-E5). First cut: **v1.1.0** — the first scoped release (was
> unscoped `hardhat-multichain@1.0.6`). **Publishing is irreversible**; recovery is
> forward-only (§7). Replace `X.Y.Z`.

---

## 0. Preflight — [Eng], gated by [Owner]

- [ ] Clean tree on `release/vX.Y.Z`.
- [ ] `yarn build && yarn lint && yarn test` green locally.
- [ ] CI green on origin (Actions).
- [ ] **[Owner]** npm Trusted Publisher for `@diamondslab/hardhat-multichain` bound to
      `DiamondsLab/hardhat-multichain` + `release.yml`, **exact org casing** (`DiamondsLab`
      — a lowercase letter costs a masked 404), **"Allow npm Stage publish" on**.
      **New package:** the trusted publisher may need the package to exist first — see §6b.
- [ ] **[Owner]** §B rulesets on the repo; branch protection; `v*` tag protection with a
      bypass covering the releasing account (B4 self-test).
- [ ] Consumer-green fast+full (fleet procedure).

## 1. Version bump — [Eng]

```bash
npm pkg set version=X.Y.Z     # already 1.1.0 for this cut (set at E2)
node -p "require('./package.json').version"
```

## 2. Finalize the changelog — [Eng]

- [ ] `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`; fresh `[Unreleased]` above.
- [ ] Version headings are unlinked until tags exist on the remote (this repo had **zero
      remote tags** at 1.1.0 — push tags first if you want compare links).

## 3. Build + pack audit — [Eng]

```bash
yarn build
npm pack --dry-run
```

- [ ] Manifest matches the **M2-E2 baseline: 9 files** (~15 kB): `dist/**` (no `.map`),
      `LICENSE`, `README.md`, `CHANGELOG.md`, `package.json`.
- [ ] `npm pack`; install into a throwaway project; probe `.` + `./package.json`.

```bash
git add package.json CHANGELOG.md && git commit -m "chore(release): vX.Y.Z"
```

## 4. Merge to `main` + tag — [Owner]

- [ ] **[Owner]** merge PR `release/vX.Y.Z` → `main` (CI green).
- [ ] **[Owner]** push the tag — **triggers the irreversible publish**:

```bash
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z
```

> If the pre-push is blocked or a ruleset rejects the tag, the Owner can create the ref via
> `gh api repos/DiamondsLab/hardhat-multichain/git/refs -f ref=refs/tags/vX.Y.Z -f sha=<sha>`.

## 5. Verify — [Owner/Eng]

- [ ] `Release` workflow green.
- [ ] `npm view @diamondslab/hardhat-multichain version` → `X.Y.Z`; provenance badge.
- [ ] Clean install resolves `.` + `./package.json`.
- [ ] **Diagnose a publish failure** with `npm publish --loglevel http`: GitHub id-token
      GET 200 then registry `oidc/token/exchange` POST **404** = npm-side trusted-publisher
      mismatch (fix config, re-run the workflow — no new tag needed, nothing was published).

## 6. Dry-run rehearsal — [Eng] (before §4)

```bash
npm publish --dry-run
npm pack
```
Then root `yarn compile` + consumer-green fast+full.

## 6b. First publish of this NEW npm name (bootstrap)

`@diamondslab/hardhat-multichain` has never been published, so a trusted publisher may have
nothing to bind to. Choose one:
1. **npm new-package trusted-publisher flow** if the npmjs.com UI offers it → normal §4.
2. **Token bootstrap:** **[Owner]** creates a short-lived granular automation token,
   publishes v1.1.0 manually from a clean audited checkout (`npm publish --access public`
   after §3), **revokes the token immediately**, then binds the trusted publisher for all
   later releases. Never share/commit the token.

## 7. Rollback / recovery

Pre-tag: don't push the tag; revert the `main` merge. Post-publish (irreversible):

```bash
npm deprecate '@diamondslab/hardhat-multichain@X.Y.Z' 'Broken release — use X.Y.(Z+1)'
# fix forward: repeat with X.Y.(Z+1)
npm dist-tag add @diamondslab/hardhat-multichain@X.Y.(Z+1) latest
```

## 8. Post-release — [Eng] + [Owner]

- [ ] Bump the monorepo root submodule pointer; root builds green; consumer-green.
- [ ] **[Owner] Deprecate the unscoped package** (§D, M2 only): approve the message, then
      `npm deprecate 'hardhat-multichain@*' 'Renamed: this package is now @diamondslab/hardhat-multichain — see https://github.com/DiamondsLab/hardhat-multichain#migrating-from-hardhat-multichain'`.
      Verify the banner renders and `npm install hardhat-multichain` warns. (Reversible:
      `npm deprecate 'hardhat-multichain@*' ''`.)
- [ ] (Optional) GitHub Release with the `[X.Y.Z]` changelog section.
