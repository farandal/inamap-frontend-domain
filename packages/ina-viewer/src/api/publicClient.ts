import type { ApiErrorCode, EndpointType, PublicInamap, RouteResult, RouteSession, SearchHit } from '../types';

/**
 * Cliente de la API pública de INAMAP (README §9.2). Usa fetch: el visor
 * público no carga axios ni react-admin. El token de sesión de ruta viaja en
 * `X-Inamap-Token` cuando existe (modo `token_required` o "ver en mi celular").
 */

export class InamapApiError extends Error {
    constructor(
        public readonly code: ApiErrorCode,
        public readonly status: number,
        message?: string,
    ) {
        super(message || code);
    }
}

export interface PublicClientOptions {
    /** Base de la API, p. ej. http://localhost:25200/api */
    apiUrl: string;
    token?: string | null;
    accessKey?: string | null;
    locale?: string;
}

export const endpointRef = (type: EndpointType, id: string) => `${type}:${id}`;

export function createPublicClient(options: PublicClientOptions) {
    const base = options.apiUrl.replace(/\/+$/, '');

    async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string>) };
        if (options.token) headers['X-Inamap-Token'] = options.token;
        if (options.accessKey) headers['X-Inamap-Access-Key'] = options.accessKey;
        if (options.locale) headers['Accept-Language'] = options.locale;
        if (init.body) headers['Content-Type'] = 'application/json';

        let response: Response;
        try {
            response = await fetch(`${base}/${path.replace(/^\/+/, '')}`, { ...init, headers });
        } catch {
            throw new InamapApiError('NETWORK', 0);
        }

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const code = (body?.error?.code as ApiErrorCode) || (response.status === 429 ? 'THROTTLED' : 'NETWORK');
            throw new InamapApiError(code, response.status, body?.error?.message || body?.message);
        }
        return body.data as T;
    }

    const qs = (params: Record<string, string | number | boolean | undefined | null>) =>
        new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => [k, String(v)]),
        ).toString();

    return {
        getInamap: (id: string, includePaths = false) =>
            request<PublicInamap>(`inamap/${id}${includePaths ? '?include=paths' : ''}`),

        search: (inamap: string, q: string, filters: { category?: string; layout?: string; type?: EndpointType; limit?: number } = {}) =>
            request<SearchHit[]>(`inamap/search?${qs({ inamap, q, ...filters })}`),

        route: (inamap: string, from: string, to: string, accessible = false) =>
            request<RouteResult>(`inamap/route?${qs({ inamap, from, to, accessible: accessible ? 1 : undefined })}`),

        createSession: (inamap: string, from: string, to: string, accessible = false) =>
            request<RouteSession>('inamap/route-sessions', {
                method: 'POST',
                body: JSON.stringify({ inamap, from, to, accessible }),
            }),

        currentSession: () => request<{ session_id: string; inamap_id: string; expires_at: string; route: RouteResult }>('inamap/route-sessions/current'),
    };
}

export type PublicClient = ReturnType<typeof createPublicClient>;

/** Lee el token del fragmento `#t=...` (no viaja al servidor ni queda en logs). */
export function readTokenFromHash(hash: string = typeof window !== 'undefined' ? window.location.hash : ''): string | null {
    const match = /(?:^#|&)t=([^&]+)/.exec(hash);
    return match ? decodeURIComponent(match[1]) : null;
}
