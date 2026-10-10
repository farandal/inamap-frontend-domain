/**
 * Thin re-export shim — the real implementation lives in dash-boilerplate now.
 * This file used to be a duplicated ~95-line copy of the loader in every app
 * (consolidated 2026-08-03). Kept as a file here, rather than repointing every
 * call site, so both import styles used across this app keep working
 * unchanged: the direct `import GlobalSmallLoader from
 * './dash-extensions/components/GlobalSmallLoader'` and the barrel's
 * `import { GlobalSmallLoader } from './dash-extensions/components'`.
 */
export {
    GlobalSmallLoader,
    GlobalSmallLoader as default,
    GlobalLoaderHtmlMarkup,
    injectCriticalStyles,
    type GlobalSmallLoaderProps,
} from 'dash-boilerplate';
