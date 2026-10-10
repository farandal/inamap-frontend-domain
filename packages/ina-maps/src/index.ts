/**
 * ina-maps — gestión de mapas INAMAP sobre DashAdmin: recursos (inamaps,
 * categorías), el editor de mapas y el vocabulario del paquete. Ocupa en las
 * apps INAMAP el lugar que vx-lab ocupa en VaneXa.
 */
export * from './resources';
export { default as InamapEditor } from './components/editor/InamapEditor';
export { useInamapApi, apiErrorMessage } from './api/useInamapApi';
export type { InamapApi, GeometryDocument, ConnectivityReport } from './api/useInamapApi';
export { en as inaMapsEn, es as inaMapsEs, registerTranslations, runtimeTranslations, onTranslationsRegistered } from './i18n';
export type { TranslationBundle } from './i18n';
