import type { Location, Path, Point, Structure, Zone } from 'ina-viewer';

export type Tool = 'select' | 'zone' | 'structure' | 'location' | 'path' | 'link' | 'measure';
export type SubMode = 'none' | 'add_vertex' | 'remove_vertex';
export type Panel = 'editor' | 'info' | 'layouts' | 'settings';

/** Contenido editable de UN layout (lo que guarda PUT inamap/layouts/{id}/geometry). */
export interface EditorDoc {
    zones: Zone[];
    structures: Structure[];
    locations: Location[];
    paths: Path[];
}

export type CollectionKey = keyof EditorDoc;

export const EMPTY_DOC: EditorDoc = { zones: [], structures: [], locations: [], paths: [] };

/** Los elementos nuevos llevan un id temporal hasta que el servidor asigna el UUID. */
export const TMP_PREFIX = 'tmp-';
export const isTmpId = (id: string) => id.startsWith(TMP_PREFIX);
export const newTmpId = () => `${TMP_PREFIX}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const collectionOf = (type: string): CollectionKey | null =>
    type === 'zone' ? 'zones' : type === 'structure' ? 'structures' : type === 'location' ? 'locations' : type === 'path' ? 'paths' : null;

/** Puntos editables de un elemento (polígono o polilínea). */
export const pointsOf = (item: Zone | Structure | Path): Point[] => ('polygon' in item ? item.polygon : item.points);

/** Colores por defecto, como en el diseño: zonas verdes, estructuras azules. */
export const DEFAULT_COLORS = {
    zone: { fill: '#22C55E', stroke: '#16A34A', opacity: 0.4 },
    structure: { fill: '#3B82F6', stroke: '#1D4ED8', opacity: 0.55 },
};
