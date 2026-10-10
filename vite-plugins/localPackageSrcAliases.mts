import path from "path";
import fs from "fs";

interface LocalPackageSrcAliasResult {
  aliases: { find: RegExp | string; replacement: string }[];
  exclude: string[];
}

/**
 * Alias every local workspace package under packages/ (kt-*, vx-*, ...)
 * straight to its own src/, so editing e.g. packages/vx-lab/src/... is
 * visible via HMR immediately — the same "sources load live, bundling
 * happens at build time" contract dashCoreSrcAliases.mts gives dash-*
 * packages when LINK_DASH_CORE is on, just always-on and unconditional
 * here: these packages live in THIS repo, not an optional sibling
 * checkout, so there's no "is it present" question to gate on.
 *
 * Without this, a package resolves via its package.json main/exports to
 * dist/ — real, tsup-built output — and an edit to src/ is invisible
 * until `pnpm --filter <pkg> build` runs again. That's still exactly what
 * happens for a real production `vite build`: this alias only applies
 * when isDevelopment is true, so the built dist/ (tree-shaken, minified,
 * versioned) is what a production bundle actually ships — "sources get
 * bundled together at the end" is the design, not a side effect of this
 * alias being off in prod.
 *
 * Discovery is dynamic (scans packages/*\/src/index.ts) rather than a
 * maintained list like DASH_CORE_SRC_PACKAGES — these are same-repo
 * packages, so a stale list would silently regress a package back to
 * dist-only HMR the moment someone forgets to update it. A new package
 * (kt-* or vx-*) picks this up automatically the moment it has the
 * standard src/index.ts shape, no wiring needed here.
 *
 * NOTE: spread `aliases` before an app's static alias entries, same
 * ordering requirement as dashCoreSrcAliases — Vite matches in array
 * order, and these must win over any static entry for the same name.
 */
export function getLocalPackageSrcAliases(
  workspaceRoot: string,
  isDevelopment: boolean
): LocalPackageSrcAliasResult {
  const disabled: LocalPackageSrcAliasResult = { aliases: [], exclude: [] };

  if (!isDevelopment) {
    return disabled;
  }

  const packagesRoot = path.resolve(workspaceRoot, "packages");

  if (!fs.existsSync(packagesRoot)) {
    return disabled;
  }

  const localPackages = fs
    .readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) =>
      fs.existsSync(path.join(packagesRoot, name, "src", "index.ts"))
    );

  if (localPackages.length === 0) {
    return disabled;
  }

  return {
    aliases: localPackages.map((name) => ({
      find: new RegExp(`^${name}(?:/src)?(/.*)?$`),
      replacement: path.resolve(packagesRoot, `${name}/src$1`),
    })),
    exclude: localPackages,
  };
}
