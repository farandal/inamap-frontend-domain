import path from "path";
import fs from "fs";

// Packages consumed as live SOURCE from the sibling dash-frontend-core repo when
// LINK_DASH_CORE=true, mirroring dash-frontend-core's own devSrcAliases list.
// Asset/tooling packages (dash-modal, dash-icons, dash-eslint, dash-prettier,
// dash-tsconfig) are intentionally excluded and always resolve via the installed
// node_modules package, same as dash-frontend-core does.
export const DASH_CORE_SRC_PACKAGES = [
  "dash-admin",
  "dash-admin-state",
  "dash-app-common",
  "dash-auto-admin",
  "dash-axios-hook",
  "dash-utils",
  "dash-constants",
  "dash-dialog",
  "dash-components",
  "dash-auth",
  "dash-boilerplate",
  "dash-info",
  "dash-interfaces",
  "dash-reports",
  // dash-styles is linked too: its published exports already map ./dash.less and
  // ./styles/* to src/*, so consuming the sibling repo's src is the same contract —
  // required for LESS changes (e.g. sidebar.less) to be visible without republishing.
  "dash-styles",
];

interface DashCoreSrcAliasResult {
  aliases: { find: RegExp | string; replacement: string }[];
  exclude: string[];
  enabled: boolean;
}

/**
 * Opt-in (LINK_DASH_CORE=true) aliasing of dash-* imports straight to
 * ../dash-frontend-core/packages/<pkg>/src for instant HMR against local
 * dash-frontend-core edits, instead of the published node_modules copy.
 * Falls back to normal node_modules resolution if the flag is unset or the
 * sibling repo isn't checked out.
 *
 * Deliberately NOT gated on isDevelopment/isProduction: debugging
 * production-only bugs (minified, prod Vite mode) against local
 * dash-frontend-core source is a legitimate, common use of this flag — gating
 * it out during `production`-mode local builds silently falls back to
 * whatever's published in node_modules, which looks like linking is active
 * (the flag is on, the console log below prints) while every dash-admin/
 * dash-styles/etc. edit is actually invisible. Cost this session a full
 * console-logging investigation before the mismatch was caught.
 *
 * NOTE: spread `aliases` BEFORE the app's static alias entries — Vite matches
 * aliases in array order, and these must win over static entries like
 * `@dash-styles-src` (which points at node_modules) when linking is active.
 */
export function getDashCoreSrcAliases(
  appDir: string,
  _isDevelopment: boolean
): DashCoreSrcAliasResult {
  const disabled: DashCoreSrcAliasResult = { aliases: [], exclude: [], enabled: false };

  if (process.env.LINK_DASH_CORE !== "true") {
    return disabled;
  }

  const corePackagesPath = path.resolve(appDir, "../../../dash-frontend-core/packages");

  if (!fs.existsSync(corePackagesPath)) {
    console.warn(
      `⚠️  LINK_DASH_CORE=true but sibling repo not found at ${corePackagesPath} — falling back to node_modules.`
    );
    return disabled;
  }

  console.log(
    `🔗 LINK_DASH_CORE active — aliasing ${DASH_CORE_SRC_PACKAGES.length} dash-* packages to workspace source at ${corePackagesPath}`
  );

  return {
    aliases: [
      // The LESS pipeline's alias (additionalData imports) must follow the link too.
      { find: "@dash-styles-src", replacement: path.resolve(corePackagesPath, "dash-styles/src") },
      ...DASH_CORE_SRC_PACKAGES.map((name) => ({
        find: new RegExp(`^${name}(?:/src)?(/.*)?$`),
        replacement: path.resolve(corePackagesPath, `${name}/src$1`),
      })),
    ],
    exclude: DASH_CORE_SRC_PACKAGES,
    enabled: true,
  };
}
