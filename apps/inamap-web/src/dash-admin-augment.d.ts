/**
 * Temporary type augmentation for dash-admin.
 *
 * These members exist in dash-frontend-core source and are resolved at runtime
 * by the LINK_DASH_CORE vite alias, but tsc still resolves dash-admin types
 * from the published @dashadmin/dash-admin package, which does not ship them
 * yet.
 *
 * This file is a MODULE (note the `export {}`), so `declare module 'dash-admin'`
 * augments the real typings rather than replacing them — a bare ambient
 * declaration in a global .d.ts would shadow every other dash-admin export.
 *
 * Delete this file once dash-admin is republished and the dependency bumped.
 */
declare module 'dash-admin' {
	/**
	 * Deep-merges translation message trees, so core translations survive an
	 * app that contributes keys to the same subtree. Later sources win on leaf
	 * collisions.
	 */
	export function mergeTranslations(
		...sources: (Record<string, any> | undefined | null)[]
	): Record<string, any>;
}

export {};
