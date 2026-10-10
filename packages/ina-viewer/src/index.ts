/**
 * ina-viewer — dibujo de mapas INAMAP (SVG), geometría, cliente de la API
 * pública y el visor público completo. No depende de react-admin: lo usan
 * tanto el editor (ina-maps, dentro de DashAdmin) como inamap-app.
 */
export * from './types';
export * from './geometry';
export { default as MapCanvas, DEFAULT_LAYERS } from './components/MapCanvas';
export type { Layers, LayerKey, Selection, ElementType, MapCanvasHandle, MapCanvasProps, OverlayContext, ViewState } from './components/MapCanvas';
export { default as SearchBox } from './components/SearchBox';
export { default as InamapViewer, hitCenter } from './components/InamapViewer';
export type { InamapViewerProps } from './components/InamapViewer';
export { createPublicClient, endpointRef, readTokenFromHash, InamapApiError } from './api/publicClient';
export type { PublicClient, PublicClientOptions } from './api/publicClient';
export { viewerStringsEs, viewerStringsEn, format } from './i18n/viewerStrings';
export type { ViewerStrings } from './i18n/viewerStrings';
