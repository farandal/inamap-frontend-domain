import fs from "fs";
import type { Plugin } from "vite";

/**
 * injectCriticalThemeVars
 *
 * index.html's inline critical-CSS `<style>` block (the pre-React "initial
 * loader") paints before the app's compiled LESS bundle (and therefore its
 * `:root { --var--light/--dark }` declarations) has necessarily loaded — in
 * dev, main.tsx's style imports run as a deferred ES module; in prod the
 * injected `<link rel="stylesheet">` is a network round trip. Any
 * `var(--name)` referenced in that inline block with no fallback resolves to
 * nothing for that first paint (see F8-Public-Web_STYLE_SYSTEM_TECHNICAL_
 * REFERENCE.md §2), which is what caused the white/unthemed flash this
 * plugin fixes.
 *
 * Rather than hand-writing (and manually keeping in sync) a fallback hex
 * next to every `var(...)` in index.html, this plugin reads the SAME
 * `dash-variables.less` source used by the LESS pipeline at dev-serve/build
 * time, resolves each requested `--key--mode` to its actual compiled value,
 * and rewrites `var(--key--mode)` → `var(--key--mode, <resolved-value>)` in
 * the served/built HTML. The `var()` reference itself is left in place, so
 * the real cascade (theme runtime, tenant overrides) still wins the moment
 * its stylesheet is live — this only fills the gap before that.
 *
 * Supports both dash-variables.less conventions (see style-system doc §7.1):
 * CSS `--key--mode: value;` (most apps) and legacy LESS `@key--mode: value;`
 * (kitchntabs-mall) — whichever the app file uses is matched. Falls back to
 * dash-styles' core `dash-css-transformer.less` for any key the app doesn't
 * override itself.
 *
 * Missing files or keys are silently skipped (leaving the plain `var()`
 * reference untouched) — never fails the build over this.
 */

export interface InjectCriticalThemeVarsOptions {
  /** Absolute path to the app's `src/dash-variables.less`. */
  appVariablesPath: string;
  /** Absolute path to dash-styles' `dash-css-transformer.less` (core defaults). */
  coreTransformerPath?: string;
  /** CSS var base names to resolve, e.g. ["primary-contrast", "bodybg-secondary"] — without the `--` prefix or `--light`/`--dark` suffix. */
  keys: string[];
}

const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

const cssVarPattern = (key: string, mode: Mode) =>
  new RegExp(`--${key}--${mode}\\s*:\\s*([^;]+);`);
const lessVarPattern = (key: string, mode: Mode) =>
  new RegExp(`@${key}--${mode}\\s*:\\s*([^;]+);`);

function resolveValue(sources: string[], key: string, mode: Mode): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const match = source.match(cssVarPattern(key, mode)) ?? source.match(lessVarPattern(key, mode));
    if (match) return match[1].trim();
  }
  return undefined;
}

function readIfExists(filePath: string | undefined): string {
  if (!filePath) return "";
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function injectCriticalThemeVars(options: InjectCriticalThemeVarsOptions): Plugin {
  const { appVariablesPath, coreTransformerPath, keys } = options;

  return {
    name: "inject-critical-theme-vars",
    // Runs on both `vite dev`'s served HTML and the production build's output HTML.
    transformIndexHtml(html) {
      const appSrc = readIfExists(appVariablesPath);
      const coreSrc = readIfExists(coreTransformerPath);
      const sources = [appSrc, coreSrc];

      let output = html;
      for (const key of keys) {
        for (const mode of MODES) {
          const value = resolveValue(sources, key, mode);
          if (!value) continue;

          const varName = `--${key}--${mode}`;
          const varRefPattern = new RegExp(`var\\(\\s*${varName}\\s*(?:,[^)]*)?\\)`, "g");
          output = output.replace(varRefPattern, `var(${varName}, ${value})`);
        }
      }
      return output;
    },
  };
}
