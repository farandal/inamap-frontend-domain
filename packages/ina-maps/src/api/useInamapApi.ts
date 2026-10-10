import { useMemo, useRef } from 'react';
import { useAxios } from 'dash-axios-hook';
import type { Category, Inamap, Layout, Location, Path, PathLink, RouteResult, Structure, Zone } from 'ina-viewer';

/**
 * Llamadas del editor a la API autenticada (README §9.1).
 *
 * `useAxios()` ya agrega el Bearer, refresca el token y envía `X-Tenant-Id`
 * cuando un TenancyAdmin cambió de tenant (TenantSwitcher) — la misma regla
 * que aplica el backend. Pero crea una instancia nueva en cada render, así que
 * se guarda en una ref para que las funciones devueltas sean estables.
 */

export interface GeometryDocument {
    layout: Layout;
    zones: Zone[];
    structures: Structure[];
    locations: Location[];
    paths: Path[];
}

export interface GeometrySaveItem {
    id?: string;
    client_id?: string;
    [key: string]: unknown;
}

export interface GeometrySaveResult {
    data: GeometryDocument;
    id_map: Record<string, string>;
    warnings: { code: string; item?: string; with?: string; message: string }[];
}

export interface ConnectivityReport {
    accessible: boolean;
    nodes: number;
    components: number;
    unreachable_locations: { id: string; label: string; layout_id: string; reason: string }[];
    isolated_path_ids: string[];
    ok: boolean;
}

/** Algunos endpoints envuelven en {data}, otros (getOne) devuelven el recurso plano. */
const unwrap = <T,>(body: any): T => (body && typeof body === 'object' && 'data' in body && !('id' in body) ? body.data : body);

export function useInamapApi() {
    const axios = useAxios();
    const ref = useRef(axios);
    ref.current = axios;

    return useMemo(() => {
        const http = () => ref.current;
        const get = async <T,>(url: string, params?: object) => unwrap<T>((await http().get(url, { params })).data);
        const post = async <T,>(url: string, body?: object, config?: object) => unwrap<T>((await http().post(url, body, config)).data);
        const put = async <T,>(url: string, body?: object) => unwrap<T>((await http().put(url, body)).data);
        const del = async (url: string) => (await http().delete(url)).data;

        return {
            getInamap: (id: string) => get<Inamap>(`inamaps/${id}`),
            updateInamap: (id: string, body: Partial<Inamap>) => put<Inamap>(`inamaps/${id}`, body),
            publish: (id: string) => post<Inamap>(`inamaps/${id}/publish`),
            unpublish: (id: string) => post<Inamap>(`inamaps/${id}/unpublish`),
            rotateAccessKey: (id: string) => post<{ access_key: string }>(`inamaps/${id}/access-key/rotate`),
            connectivity: (id: string, accessible = false) => get<ConnectivityReport>(`inamaps/${id}/connectivity`, { accessible: accessible ? 1 : 0 }),
            routePreview: (id: string, from: string, to: string, accessible = false) =>
                get<RouteResult>(`inamaps/${id}/route`, { from, to, accessible: accessible ? 1 : 0 }),

            listLayouts: (inamapId: string) => get<Layout[]>('inamap/layouts', { inamap_id: inamapId, pagination: false }),
            createLayout: (body: Partial<Layout> & { inamap_id: string }) => post<Layout>('inamap/layouts', body),
            updateLayout: (id: string, body: Partial<Layout>) => put<Layout>(`inamap/layouts/${id}`, body),
            deleteLayout: (id: string) => del(`inamap/layouts/${id}`),
            uploadLayoutImage: (id: string, file: File) => {
                const form = new FormData();
                form.append('image', file);
                return post<Layout>(`inamap/layouts/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            },

            getGeometry: (layoutId: string) => get<GeometryDocument>(`inamap/layouts/${layoutId}/geometry`),
            /** Respuesta completa (data + id_map + warnings), sin desenvolver. */
            saveGeometry: async (layoutId: string, body: Record<string, GeometrySaveItem[]>) =>
                (await http().put(`inamap/layouts/${layoutId}/geometry`, body)).data as GeometrySaveResult,

            listPaths: (inamapId: string) => get<Path[]>('inamap/paths', { inamap_id: inamapId, pagination: false }),
            listLinks: (inamapId: string) => get<PathLink[]>('inamap/path-links', { inamap_id: inamapId, pagination: false }),
            createLink: (body: Omit<PathLink, 'id'>) => post<PathLink>('inamap/path-links', body),
            updateLink: (id: string, body: Partial<PathLink>) => put<PathLink>(`inamap/path-links/${id}`, body),
            deleteLink: (id: string) => del(`inamap/path-links/${id}`),

            listCategories: () => get<Category[]>('inamap/categories', { flat: true, pagination: false }),
            locationQrUrl: (id: string, format: 'svg' | 'png' = 'svg') => `inamap/locations/${id}/qr?format=${format}`,
            downloadLocationQr: async (id: string, format: 'svg' | 'png' = 'png') =>
                (await http().get(`inamap/locations/${id}/qr`, { params: { format }, responseType: 'blob' })).data as Blob,
        };
    }, []);
}

export type InamapApi = ReturnType<typeof useInamapApi>;

/** Extrae el mensaje de error de una respuesta de Laravel (422/403/409). */
export function apiErrorMessage(error: any, fallback = 'Error'): string {
    const data = error?.response?.data;
    if (data?.errors) {
        const first = Object.values(data.errors as Record<string, string[]>)[0];
        if (Array.isArray(first) && first[0]) return first[0];
    }
    return data?.error?.message || data?.message || error?.message || fallback;
}

/** Errores de validación por ruta (`zones.0.polygon` → mensaje). */
export function apiValidationErrors(error: any): Record<string, string> {
    const errors = error?.response?.data?.errors as Record<string, string[]> | undefined;
    if (!errors) return {};
    return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0]]));
}
