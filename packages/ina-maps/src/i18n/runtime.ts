/**
 * (Copia del registro del framework; ver dashadmin-i18n.)
 *
 * A runtime translation registry — how a LAZILY LOADED package contributes
 * its own strings to an app that has already booted.
 *
 * ── The problem this solves ─────────────────────────────────────────────────
 *
 * `polyglotI18nProvider` builds one Polyglot instance per locale and
 * react-admin only re-runs `getMessages` on `changeLocale`. A chunk that loads
 * later therefore cannot contribute keys — nothing re-reads them — so every
 * package bundle has had to be merged at app ENTRY, in the entry chunk, by
 * every consuming app. That is N apps to keep in step per package, and it puts
 * strings in the initial download that most sessions never need.
 *
 * The fix is the one the i18n documentation describes but leaves unbuilt: a
 * registry packages push into at module-eval time, plus a
 * `changeLocale(currentLocale)` nudge to make the provider re-read.
 *
 * ── Why the state lives on globalThis ───────────────────────────────────────
 *
 * A registry is only a registry if every participant sees the SAME one, and
 * module identity does not guarantee that here: an app and a package can
 * resolve different copies of this file (a duplicated dependency, a package
 * bundled rather than externalised, `src` aliasing in dev while the app reads
 * `dist`). Module-scope state would then silently split in two — the package
 * registering into one and the app reading the other, with no error anywhere.
 *
 * A well-known key on globalThis is one object per PAGE regardless of how many
 * copies of this module exist, which also means this file can later move into
 * dash-frontend-core without a flag day: both implementations would share the
 * same store during the transition.
 */

export type TranslationBundle = Record<string, unknown>;
type Listener = () => void;

interface RuntimeStore {
    /** locale -> the bundles registered for it, in registration order. */
    bundles: Record<string, TranslationBundle[]>;
    listeners: Set<Listener>;
}

const STORE_KEY = '__dashI18nRuntimeStore__';

function store(): RuntimeStore {
    const scope = globalThis as unknown as Record<string, RuntimeStore | undefined>;

    if (!scope[STORE_KEY]) {
        scope[STORE_KEY] = { bundles: {}, listeners: new Set<Listener>() };
    }

    return scope[STORE_KEY] as RuntimeStore;
}

/**
 * Contribute a package's bundles. Call at module scope from something the
 * package's own lazily-loaded code imports, so registration happens exactly
 * when that feature's chunk arrives.
 *
 * Idempotent by bundle IDENTITY, not by content: a module evaluated twice
 * (two chunks importing it, HMR) hands over the same frozen object, so the
 * second call is a no-op and cannot re-notify. Two genuinely different bundles
 * for one locale are both kept — packages are additive, not competing.
 */
export function registerTranslations(bundles: Record<string, TranslationBundle | undefined>): void {
    const current = store();
    let changed = false;

    for (const [locale, bundle] of Object.entries(bundles)) {
        if (!bundle) continue;

        const existing = (current.bundles[locale] ??= []);

        if (!existing.includes(bundle)) {
            existing.push(bundle);
            changed = true;
        }
    }

    // Only on a real change: notifying unconditionally would make every
    // duplicate import cost a locale round-trip and a full re-render.
    if (changed) {
        current.listeners.forEach((listener) => listener());
    }
}

/** Everything registered for a locale, oldest first. Never null. */
export function runtimeTranslations(locale: string): TranslationBundle[] {
    return store().bundles[locale] ?? [];
}

/**
 * Called when a bundle arrives. The app uses this to nudge the provider — see
 * the module docblock for why a nudge is needed at all.
 *
 * Returns an unsubscribe, so a remounting app cannot accumulate listeners that
 * each fire their own changeLocale.
 */
export function onTranslationsRegistered(listener: Listener): () => void {
    const current = store();
    current.listeners.add(listener);

    return () => {
        current.listeners.delete(listener);
    };
}
