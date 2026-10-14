import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MapCanvas, { MapCanvasHandle, Selection } from './MapCanvas';
import SearchBox from './SearchBox';
import { createPublicClient, endpointRef, InamapApiError, readTokenFromHash } from '../api/publicClient';
import { centroid, formatDistance, formatDuration } from '../geometry';
import { format, viewerStringsEs, type ViewerStrings } from '../i18n/viewerStrings';
import type { Location, Point, PublicInamap, RouteResult, RouteSession, SearchHit } from '../types';

/**
 * Visor público de un inamap (inamap-app, HU-VIS-*): mapa por pisos, búsqueda
 * difusa de origen y destino, ruta accesible, indicaciones por tramo, ficha
 * de ubicación y "ver en mi celular" (sesión de ruta + QR).
 *
 * Si la URL trae `#t=<token>` (QR de una sesión de ruta) la ruta llega ya
 * trazada y el token autoriza la lectura en inamaps `token_required`.
 */
export interface InamapViewerProps {
    apiUrl: string;
    inamapId: string;
    /** Token de sesión explícito; por defecto se lee del fragmento de la URL. */
    token?: string | null;
    /** Ubicación a enfocar como destino (`?location=`). */
    focusLocationId?: string | null;
    /**
     * Destino y origen como referencia `tipo:uuid` (`?to=` y `?from=`): lo que
     * abre el QR de un mapa impreso o de una tarjeta de quiosco. Con ambos, la
     * ruta se calcula al abrir; con solo el destino, se enfoca ese lugar.
     */
    toRef?: string | null;
    fromRef?: string | null;
    /** Ruta sin escaleras (`?accessible=1`) al calcular desde `toRef`/`fromRef`. */
    accessibleRoute?: boolean;
    /**
     * Varios lugares (`?places=`), cada uno como `tipo:uuid` o con la letra del
     * tipo (`l:`, `s:`, `z:`): se marcan con números y se encuadran, sin trazar
     * ninguna ruta. Para "dónde están los baños", no "cómo llego".
     */
    placeRefs?: string[] | null;
    strings?: ViewerStrings;
    locale?: string;
    /** Altura del contenedor (por defecto 100vh). */
    height?: number | string;
    /**
     * Empotrado en otra página (un iframe en una tarjeta): el panel de búsqueda
     * y ruta parte cerrado para que el mapa ocupe el cuadro. El botón para
     * abrirlo sigue disponible.
     */
    embedded?: boolean;
}

const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 760;

export function InamapViewer({ apiUrl, inamapId, token: tokenProp, focusLocationId, strings = viewerStringsEs, locale, height = '100vh', embedded = false, toRef = null, fromRef = null, accessibleRoute = false, placeRefs = null }: InamapViewerProps) {
    const token = useMemo(() => tokenProp ?? readTokenFromHash(), [tokenProp]);
    const client = useMemo(() => createPublicClient({ apiUrl, token, locale }), [apiUrl, token, locale]);
    const canvasRef = useRef<MapCanvasHandle>(null);

    const [data, setData] = useState<PublicInamap | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [layoutId, setLayoutId] = useState<string | null>(null);
    const [from, setFrom] = useState<SearchHit | null>(null);
    const [to, setTo] = useState<SearchHit | null>(null);
    const [accessible, setAccessible] = useState(false);
    const [category, setCategory] = useState<string | null>(null);
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routing, setRouting] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [selected, setSelected] = useState<Location | null>(null);
    const [session, setSession] = useState<RouteSession | null>(null);
    const [narrow, setNarrow] = useState(isNarrow());
    const [viewportH, setViewportH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
    const [panelOpen, setPanelOpen] = useState(() => !embedded && !isNarrow());
    const [stepsOpen, setStepsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const themeVars = {
        '--viewer-panel': darkMode ? '#18212B' : '#FFFFFF',
        '--viewer-surface': darkMode ? '#202B38' : '#F8FAFC',
        '--viewer-input': darkMode ? '#111922' : '#FFFFFF',
        '--viewer-text': darkMode ? '#F1F5F9' : '#111827',
        '--viewer-muted': darkMode ? '#B6C2D0' : '#64748B',
        '--viewer-border': darkMode ? '#3A4858' : '#CBD5E1',
        '--viewer-hover': darkMode ? '#2D3A49' : '#F1F5F9',
    } as React.CSSProperties;

    const errorText = (e: unknown) => strings.errors[e instanceof InamapApiError ? e.code : 'NETWORK'] ?? strings.errors.NETWORK;

    useEffect(() => {
        const onResize = () => {
            setNarrow(isNarrow());
            setViewportH(window.innerHeight);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Carga del inamap (+ la ruta de la sesión si se abrió desde un QR).
    useEffect(() => {
        let cancelled = false;
        setError(null);
        client
            .getInamap(inamapId)
            .then(async (payload) => {
                if (cancelled) return;
                setData(payload);
                const initial = payload.settings?.initial_layout_id && payload.layouts.some((l) => l.id === payload.settings.initial_layout_id)
                    ? (payload.settings.initial_layout_id as string)
                    : payload.layouts[0]?.id ?? null;
                setLayoutId(initial);

                if (token) {
                    try {
                        const current = await client.currentSession();
                        if (!cancelled) applyRoute(current.route, payload);
                    } catch (e) {
                        if (!cancelled) setRouteError(errorText(e));
                    }
                }
            })
            .catch((e) => !cancelled && setError(errorText(e)));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, inamapId, token]);

    // Ubicación enfocada desde un QR de ubicación (?location=).
    useEffect(() => {
        if (!data || !focusLocationId) return;
        const location = data.locations.find((l) => l.id === focusLocationId);
        if (location) {
            setSelected(location);
            setTo({ type: 'location', id: location.id, label: location.label, code: location.code, layout_id: location.layout_id, score: 1 });
            setLayoutId(location.layout_id);
        }
    }, [data, focusLocationId]);

    // Destino y origen desde la URL (?to=&from=): se resuelven contra el propio
    // inamap, nunca se confía en el texto de la URL.
    useEffect(() => {
        if (!data || (!toRef && !fromRef)) return;
        const hitFor = (ref?: string | null): SearchHit | null => {
            const [type, id] = (ref ?? '').split(':');
            const pool = type === 'zone' ? data.zones : type === 'structure' ? data.structures : type === 'location' ? data.locations : null;
            const item = pool?.find((x) => x.id === id);

            return item ? { type: type as SearchHit['type'], id: item.id, label: item.label, code: item.code, layout_id: item.layout_id, score: 1 } : null;
        };
        const toHit = hitFor(toRef);
        const fromHit = hitFor(fromRef);
        if (toHit) {
            setTo(toHit);
            setLayoutId(toHit.layout_id);
            if (toHit.type === 'location') setSelected(data.locations.find((l) => l.id === toHit.id) ?? null);
        }
        if (fromHit) setFrom(fromHit);
        if (!toHit || !fromHit) return;

        let cancelled = false;
        setRouting(true);
        client
            .route(inamapId, endpointRef(fromHit.type, fromHit.id), endpointRef(toHit.type, toHit.id), accessibleRoute)
            .then((result) => !cancelled && applyRoute(result, data))
            .catch((e) => !cancelled && (setRoute(null), setRouteError(errorText(e))))
            .finally(() => !cancelled && setRouting(false));

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, toRef, fromRef, accessibleRoute]);

    // Los lugares pedidos con ?places=, numerados en el orden en que llegaron.
    const markers = useMemo(() => {
        if (!data || !placeRefs?.length) return [];
        const types: Record<string, 'location' | 'structure' | 'zone'> = { l: 'location', s: 'structure', z: 'zone', location: 'location', structure: 'structure', zone: 'zone' };

        return placeRefs.slice(0, 12).flatMap((raw, i) => {
            const [t, id] = raw.split(':');
            const type = types[t];
            if (!type || !id) return [];
            const item = (type === 'location' ? data.locations : type === 'structure' ? data.structures : data.zones).find((x) => x.id === id);
            if (!item) return [];
            const point: Point | null = type === 'location' ? [(item as Location).x, (item as Location).y] : centroid((item as { polygon: Point[] }).polygon);

            return point ? [{ n: i + 1, type, id, label: item.label, layout_id: item.layout_id, point }] : [];
        });
    }, [data, placeRefs]);

    // Abrir en el piso del primer lugar pedido.
    useEffect(() => {
        if (markers[0]) setLayoutId(markers[0].layout_id);
    }, [markers]);

    const layout = data?.layouts.find((l) => l.id === layoutId) ?? data?.layouts[0] ?? null;
    const layoutNames = useMemo(() => Object.fromEntries((data?.layouts ?? []).map((l) => [l.id, l.name])), [data]);

    const content = useMemo(() => {
        if (!data || !layout) return { zones: [], structures: [], locations: [], paths: [] };
        const matchesCategory = (l: Location) => !category || l.category_id === category;
        return {
            zones: data.zones.filter((z) => z.layout_id === layout.id),
            structures: data.structures.filter((s) => s.layout_id === layout.id),
            locations: data.locations.filter((l) => l.layout_id === layout.id && matchesCategory(l)),
            paths: [],
        };
    }, [data, layout, category]);

    function applyRoute(result: RouteResult, payload = data) {
        setRoute(result);
        setRouteError(null);
        setStepIndex(0);
        if (result.steps[0]) setLayoutId(result.steps[0].layout_id);
        if (payload) {
            const asHit = (e: RouteResult['from']): SearchHit => ({ ...e, score: 1 });
            setFrom(asHit(result.from));
            setTo(asHit(result.to));
        }
    }

    const computeRoute = useCallback(async () => {
        if (!from || !to) return;
        setRouting(true);
        setRouteError(null);
        setSession(null);
        try {
            applyRoute(await client.route(inamapId, endpointRef(from.type, from.id), endpointRef(to.type, to.id), accessible));
            if (narrow) setPanelOpen(false);
        } catch (e) {
            setRoute(null);
            setRouteError(errorText(e));
        } finally {
            setRouting(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, accessible, client, inamapId, narrow]);

    const shareOnPhone = async () => {
        if (!from || !to) return;
        try {
            setSession(await client.createSession(inamapId, endpointRef(from.type, from.id), endpointRef(to.type, to.id), accessible));
        } catch (e) {
            setRouteError(errorText(e));
        }
    };

    // Tramos de la ruta en el piso actual.
    const routeHere = useMemo(() => {
        if (!route || !layout) return null;
        const points = route.steps.filter((s) => s.layout_id === layout.id).flatMap((s) => s.points);
        return points.length > 1 ? (points as Point[]) : null;
    }, [route, layout]);

    const firstStep = route?.steps[0];
    const lastStep = route?.steps[route.steps.length - 1];

    const onElementClick = (sel: Selection) => {
        if (!data || sel.type === 'path' || sel.type === 'link') return;
        if (sel.type === 'location') {
            const location = data.locations.find((l) => l.id === sel.id) ?? null;
            setSelected(location);
            return;
        }
        const shape = (sel.type === 'zone' ? data.zones : data.structures).find((s) => s.id === sel.id);
        if (shape) {
            const hit: SearchHit = { type: sel.type, id: shape.id, label: shape.label, code: shape.code, layout_id: shape.layout_id, score: 1 };
            from ? setTo(hit) : setFrom(hit);
            setPanelOpen(true);
        }
    };

    const goToStep = (index: number) => {
        if (!route) return;
        const step = route.steps[Math.max(0, Math.min(index, route.steps.length - 1))];
        setStepIndex(route.steps.indexOf(step));
        setLayoutId(step.layout_id);
    };

    const sortedLayouts = useMemo(() => [...(data?.layouts ?? [])].sort((a, b) => a.level - b.level), [data]);

    if (error) {
        return (
            <div style={{ ...themeVars, height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', color: 'var(--viewer-text)', background: 'var(--viewer-panel)' }}>
                <div>
                    <svg width="56" height="56" viewBox="0 0 16 16" style={{ marginBottom: 12 }}>
                        <path d="M8 0.8C5.1 0.8 2.8 3.1 2.8 5.9 2.8 9.9 8 15.2 8 15.2s5.2-5.3 5.2-9.3C13.2 3.1 10.9 0.8 8 0.8z" fill="#E1251B" />
                        <circle cx="8" cy="5.9" r="2" fill="#fff" />
                    </svg>
                    <p style={{ fontSize: 18, maxWidth: 360 }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!data || !layout) {
        return <div style={{ ...themeVars, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--viewer-text)', background: 'var(--viewer-panel)' }}>{strings.loading}</div>;
    }

    // Lo que abre el QR de la barra: este mismo lugar y esta misma ruta en un
    // celular. Un mapa que exige token no se abre con un enlace pelado: ahí el QR
    // es el de una sesión de ruta (se pide con el botón).
    const tokenRequired = data.settings?.access_mode === 'token_required';
    const phoneUrl = (() => {
        const query = new URLSearchParams();
        if (placeRefs?.length) query.set('places', placeRefs.join(','));
        if (to) query.set('to', `${to.type}:${to.id}`);
        if (to && from) {
            query.set('from', `${from.type}:${from.id}`);
            if (accessible) query.set('accessible', '1');
        }
        if (locale?.toLowerCase().startsWith('en')) query.set('lang', 'en');
        const base = `${window.location.origin}/inamap/${inamapId}`;

        return query.toString() ? `${base}?${query}` : base;
    })();
    const qrValue = tokenRequired ? session?.view_url ?? null : phoneUrl;
    // En un celular el QR no sirve (ya se está en él), salvo dentro de una tarjeta.
    const showQr = !narrow || embedded;
    const visibleMarkers = markers.filter((m) => m.layout_id === layout.id);
    // Big enough to scan from a kiosk screen: ~7% of the viewport height, 120-176 px.
    const QR_SIZE = Math.max(120, Math.min(176, Math.round(viewportH * 0.07)));
    // Room the overlay takes at the bottom-right of the map (plate padding + caption).
    const QR_BLOCK = QR_SIZE + 16 + 22;

    const column: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderLeft: '1px solid var(--viewer-border)', minWidth: 0 };
    const control: React.CSSProperties = { height: 34, boxSizing: 'border-box', border: '1px solid var(--viewer-border)', background: 'var(--viewer-input)', color: 'var(--viewer-text)', borderRadius: 8, padding: '0 10px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' };
    const routeLocked = !from || !to || routing;

    const toolbar = (
        <header
            style={{
                position: 'relative',
                zIndex: 20,
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'stretch',
                // Embedded in a card, the host draws its own close button over the
                // top-right corner when the card is expanded; keep it off the controls.
                padding: embedded ? '5px 60px 5px 4px' : '5px 4px',
                boxSizing: 'border-box',
                background: 'var(--viewer-panel)',
                color: 'var(--viewer-text)',
                borderBottom: '1px solid var(--viewer-border)',
                boxShadow: '0 2px 10px rgba(0,0,0,.18)',
            }}
        >
            {/* Las columnas de la barra: si no caben en una línea, bajan a otra dentro de este grupo; el QR no. */}
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', alignContent: 'center', gap: '6px 0' }}>
            {/* Columna 1: el mapa y el interruptor de la búsqueda */}
            <div style={{ ...column, borderLeft: 'none' }}>
                <button type="button" onClick={() => setPanelOpen(!panelOpen)} aria-expanded={panelOpen} aria-label={strings.togglePanel} title={strings.togglePanel} style={{ ...control, width: 34, padding: 0, fontSize: 18 }}>
                    {panelOpen ? '×' : '⌕'}
                </button>
                <h1 style={{ fontSize: 15, margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{data.name}</h1>
            </div>

            {panelOpen && (
                <>
                    {/* Columnas 2 y 3: origen y destino */}
                    <div style={{ ...column, flex: '1 1 190px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <SearchBox compact client={client} inamapId={inamapId} value={from} onChange={setFrom} label={strings.from} marker="#16a34a" layoutNames={layoutNames} strings={strings} />
                        </div>
                    </div>
                    <div style={{ ...column, flex: '1 1 190px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <SearchBox compact client={client} inamapId={inamapId} value={to} onChange={setTo} label={strings.to} marker="#E1251B" category={category} layoutNames={layoutNames} strings={strings} />
                        </div>
                    </div>

                    {/* Columna 4: acciones de la ruta */}
                    <div style={column}>
                        <button
                            type="button"
                            onClick={() => {
                                setFrom(to);
                                setTo(from);
                            }}
                            title={strings.swap}
                            aria-label={strings.swap}
                            style={{ ...control, padding: '0 8px' }}
                        >
                            ⇅
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, whiteSpace: 'nowrap' }} title={strings.accessibleHint}>
                            <input type="checkbox" checked={accessible} onChange={(e) => setAccessible(e.target.checked)} />
                            ♿ {strings.accessible}
                        </label>
                        <button
                            type="button"
                            disabled={routeLocked}
                            onClick={computeRoute}
                            style={{ ...control, background: routeLocked ? '#FCA5A5' : '#E1251B', color: '#fff', border: 'none', fontWeight: 700, cursor: routeLocked ? 'default' : 'pointer' }}
                        >
                            {routing ? strings.loading : strings.route}
                        </button>
                    </div>

                    {/* Columna 5: categoría */}
                    {data.categories.length > 0 && (
                        <div style={column}>
                            <select
                                value={category ?? ''}
                                onChange={(e) => setCategory(e.target.value || null)}
                                aria-label={strings.categories}
                                style={{ ...control, paddingRight: 4, maxWidth: 170 }}
                            >
                                <option value="">{strings.categories}: {strings.all}</option>
                                {data.categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Columna 6: la ruta (distancia, tiempo e indicaciones en un desplegable) */}
                    {(route || routeError) && (
                        <div style={{ ...column, position: 'relative' }}>
                            {routeError && !route && <span style={{ fontSize: 13, color: darkMode ? '#FECACA' : '#991B1B', maxWidth: 240 }}>{routeError}</span>}
                            {route && (
                                <>
                                    <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {formatDistance(route.distance, route.unit)} · {formatDuration(route.estimated_seconds)}
                                    </span>
                                    <button type="button" onClick={() => setStepsOpen(!stepsOpen)} aria-expanded={stepsOpen} style={control}>
                                        {strings.steps} {stepsOpen ? '▴' : '▾'}
                                    </button>
                                    {stepsOpen && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                marginTop: 6,
                                                width: 'min(360px, 90vw)',
                                                maxHeight: '50vh',
                                                overflowY: 'auto',
                                                boxSizing: 'border-box',
                                                padding: 12,
                                                background: 'var(--viewer-panel)',
                                                border: '1px solid var(--viewer-border)',
                                                borderRadius: 12,
                                                boxShadow: '0 12px 36px rgba(0,0,0,.28)',
                                            }}
                                        >
                                            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--viewer-text)' }}>
                                                {route.steps.map((step, i) => (
                                                    <li key={i} onClick={() => goToStep(i)} style={{ marginBottom: 6, cursor: 'pointer', fontWeight: i === stepIndex ? 700 : 400 }}>
                                                        {format(strings.stepWalk, { distance: formatDistance(step.distance, route.unit), layout: step.layout_name ?? layoutNames[step.layout_id] ?? '' })}
                                                        {step.transition && (
                                                            <div style={{ color: darkMode ? '#C4B5FD' : '#6D28D9' }}>
                                                                {format(strings.stepTransition, {
                                                                    transport: strings.transport[(step.transition.vertical_type ?? 'elevator') as keyof ViewerStrings['transport']],
                                                                    layout: layoutNames[step.transition.to_layout_id] ?? '',
                                                                })}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                                <li style={{ color: darkMode ? '#4ADE80' : '#15803D' }}>{format(strings.arrive, { place: route.to.label })}</li>
                                            </ol>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Tema */}
            <div style={{ ...column, marginLeft: 'auto' }}>
                <button type="button" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? strings.lightMode : strings.darkMode} title={darkMode ? strings.lightMode : strings.darkMode} aria-pressed={darkMode} style={{ ...control, width: 34, padding: 0, fontSize: 18 }}>
                    {darkMode ? '☀' : '☾'}
                </button>
            </div>

            </div>

        </header>
    );

    return (
        <div
            style={{
                ...themeVars,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height,
                minHeight: '100vh',
                maxHeight: '100dvh',
                width: '100%',
                overflow: 'hidden',
                fontFamily: 'Inter, "Segoe UI", Roboto, system-ui, sans-serif',
                color: 'var(--viewer-text)',
                colorScheme: darkMode ? 'dark' : 'light',
                background: darkMode ? '#111821' : '#E8EBEF',
            }}
        >
            {toolbar}

            {/* El mapa ocupa todo lo que queda bajo la barra: nada lo tapa. */}
            <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0 }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <MapCanvas
                        ref={canvasRef}
                        layout={layout}
                        content={content}
                        categories={data.categories}
                        layers={{ paths: false, links: false }}
                        unit={data.unit}
                        route={routeHere}
                        routeStart={firstStep && firstStep.layout_id === layout.id && route?.from.type === 'location' ? firstStep.points[0] : null}
                        routeEnd={lastStep && lastStep.layout_id === layout.id ? lastStep.points[lastStep.points.length - 1] : null}
                        selection={selected ? { type: 'location', id: selected.id } : null}
                        onElementClick={onElementClick}
                        // Abierta desde un QR en un celular, lo primero que se ve es el camino.
                        fitTo={routeHere ?? (visibleMarkers.length > 1 ? visibleMarkers.map((m) => m.point) : null)}
                        renderOverlay={({ px }) =>
                            visibleMarkers.map((m) => (
                                <g key={`${m.type}:${m.id}`} transform={`translate(${m.point[0]},${m.point[1]}) scale(${px(1)})`} style={{ pointerEvents: 'none' }}>
                                    <circle r={15} fill="#E1251B" stroke="#ffffff" strokeWidth={3} />
                                    <text y={5} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="Inter, system-ui, sans-serif" fill="#ffffff">
                                        {m.n}
                                    </text>
                                </g>
                            ))
                        }
                        labels={{ zoomIn: strings.zoomIn, zoomOut: strings.zoomOut, fit: strings.fit }}
                        controlsBottom={showQr ? QR_BLOCK + 24 : 14}
                        height="100%"
                    />
                </div>

                {/* El QR para llevarse el mapa: sobre el mapa, abajo a la derecha */}
                {showQr && (
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 9,
                            right: 12,
                            bottom: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: 8,
                            boxSizing: 'border-box',
                            background: '#ffffff',
                            color: '#111827',
                            borderRadius: 12,
                            boxShadow: '0 6px 20px rgba(0,0,0,.35)',
                        }}
                    >
                        {qrValue ? (
                            <div style={{ lineHeight: 0 }}>
                                {/* Nivel L: menos módulos, así el código se lee mejor a este tamaño. */}
                                <QRCodeSVG value={qrValue} size={QR_SIZE} level="L" bgColor="#ffffff" fgColor="#000000" />
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!from || !to}
                                onClick={shareOnPhone}
                                style={{ width: QR_SIZE, height: QR_SIZE, border: '1px solid #CBD5E1', borderRadius: 8, background: '#F8FAFC', color: '#111827', cursor: !from || !to ? 'default' : 'pointer', fontSize: 14 }}
                            >
                                📱 {strings.showOnPhone}
                            </button>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.15, textAlign: 'center' }}>{strings.phoneHint}</span>
                    </div>
                )}

                {/* Selector de piso */}
                {sortedLayouts.length > 1 && (
                    <div style={{ position: 'absolute', zIndex: 10, top: 12, right: 12, background: 'var(--viewer-panel)', color: 'var(--viewer-text)', border: '1px solid var(--viewer-border)', borderRadius: 10, boxShadow: '0 3px 14px rgba(0,0,0,.2)', overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: 'var(--viewer-muted)', padding: '6px 10px 2px' }}>{strings.layouts}</div>
                        {[...sortedLayouts].reverse().map((l) => {
                            const onRoute = route?.steps.some((s) => s.layout_id === l.id);
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => setLayoutId(l.id)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        border: 'none',
                                        textAlign: 'left',
                                        padding: '8px 14px',
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        background: l.id === layout.id ? '#E1251B' : 'var(--viewer-panel)',
                                        color: l.id === layout.id ? '#fff' : 'var(--viewer-text)',
                                        fontWeight: onRoute ? 700 : 400,
                                    }}
                                >
                                    {l.name}
                                    {onRoute && l.id !== layout.id ? ' •' : ''}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Navegación por tramos de la ruta */}
                {route && route.steps.length > 1 && (
                    <div style={{ position: 'absolute', zIndex: 10, top: 12, left: 12, display: 'flex', gap: 6 }}>
                        <button type="button" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)} style={navButton(stepIndex === 0)}>
                            ← {strings.prevFloor}
                        </button>
                        <button type="button" disabled={stepIndex >= route.steps.length - 1} onClick={() => goToStep(stepIndex + 1)} style={navButton(stepIndex >= route.steps.length - 1)}>
                            {strings.nextFloor} →
                        </button>
                    </div>
                )}

                {/* Ficha de ubicación */}
                {selected && (
                    <div style={{ position: 'absolute', zIndex: 11, left: 12, right: narrow ? 12 : 'auto', bottom: showQr ? 40 : 12, width: narrow ? 'auto' : 320, maxWidth: 'calc(100% - 24px)', boxSizing: 'border-box', color: 'var(--viewer-text)', background: 'var(--viewer-panel)', border: '1px solid var(--viewer-border)', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,.2)', padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.label}</div>
                                <div style={{ fontSize: 13, color: 'var(--viewer-muted)' }}>
                                    {[selected.code, selected.category?.name, layoutNames[selected.layout_id]].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            <button type="button" onClick={() => setSelected(null)} aria-label={strings.close} style={closeButton(darkMode)}>×</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setTo({ type: 'location', id: selected.id, label: selected.label, code: selected.code, layout_id: selected.layout_id, score: 1 });
                                    setSelected(null);
                                    setPanelOpen(true);
                                }}
                                style={{ flex: 1, background: '#E1251B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {strings.route}
                            </button>
                            {selected.qr_url && (
                                <a href={selected.qr_url} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', border: '1px solid var(--viewer-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--viewer-text)', background: 'var(--viewer-input)', textDecoration: 'none' }}>
                                    ↗ Web
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const navButton = (disabled: boolean): React.CSSProperties => ({
    border: 'none',
    background: disabled ? '#e5e7eb' : '#111827',
    color: disabled ? '#9ca3af' : '#fff',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,.2)',
});

const closeButton = (darkMode: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    flexShrink: 0,
    border: `1px solid ${darkMode ? '#3A4858' : '#CBD5E1'}`,
    borderRadius: 9,
    background: darkMode ? '#202B38' : '#F8FAFC',
    color: darkMode ? '#F1F5F9' : '#334155',
    fontSize: 20,
    cursor: 'pointer',
});

/** Centro de un elemento buscado, útil para enfocar la vista. */
export const hitCenter = (data: PublicInamap, hit: SearchHit): Point | null => {
    if (hit.type === 'location') {
        const l = data.locations.find((x) => x.id === hit.id);
        return l ? [l.x, l.y] : null;
    }
    const shape = (hit.type === 'zone' ? data.zones : data.structures).find((x) => x.id === hit.id);
    return shape ? centroid(shape.polygon) : null;
};

export default InamapViewer;
