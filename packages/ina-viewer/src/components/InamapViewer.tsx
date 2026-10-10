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
    strings?: ViewerStrings;
    locale?: string;
    /** Altura del contenedor (por defecto 100vh). */
    height?: number | string;
}

const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 760;

export function InamapViewer({ apiUrl, inamapId, token: tokenProp, focusLocationId, strings = viewerStringsEs, locale, height = '100vh' }: InamapViewerProps) {
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
    const [panelOpen, setPanelOpen] = useState(true);

    const errorText = (e: unknown) => strings.errors[e instanceof InamapApiError ? e.code : 'NETWORK'] ?? strings.errors.NETWORK;

    useEffect(() => {
        const onResize = () => setNarrow(isNarrow());
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
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', color: '#374151' }}>
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
        return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>{strings.loading}</div>;
    }

    const panel = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 18, margin: 0, color: '#111827' }}>{data.name}</h1>
            <SearchBox client={client} inamapId={inamapId} value={from} onChange={setFrom} label={strings.from} marker="#16a34a" layoutNames={layoutNames} strings={strings} />
            <SearchBox client={client} inamapId={inamapId} value={to} onChange={setTo} label={strings.to} marker="#E1251B" category={category} layoutNames={layoutNames} strings={strings} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151' }} title={strings.accessibleHint}>
                    <input type="checkbox" checked={accessible} onChange={(e) => setAccessible(e.target.checked)} />
                    ♿ {strings.accessible}
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setFrom(to);
                        setTo(from);
                    }}
                    style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                    ⇅ {strings.swap}
                </button>
            </div>
            <button
                type="button"
                disabled={!from || !to || routing}
                onClick={computeRoute}
                style={{ background: !from || !to ? '#fca5a5' : '#E1251B', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 15, fontWeight: 700, cursor: !from || !to ? 'default' : 'pointer' }}
            >
                {routing ? strings.loading : strings.route}
            </button>

            {data.categories.length > 0 && (
                <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{strings.categories}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[{ id: null as string | null, name: strings.all, color: '#6b7280' }, ...data.categories.map((c) => ({ id: c.id as string | null, name: c.name, color: c.color || '#6b7280' }))].map((c) => (
                            <button
                                key={c.id ?? 'all'}
                                type="button"
                                onClick={() => setCategory(c.id)}
                                style={{
                                    border: `1px solid ${c.color}`,
                                    background: category === c.id ? c.color : '#fff',
                                    color: category === c.id ? '#fff' : '#374151',
                                    borderRadius: 999,
                                    padding: '4px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {routeError && <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 8, padding: 10, fontSize: 14 }}>{routeError}</div>}

            {route && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                        <div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{strings.distance}</div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatDistance(route.distance, route.unit)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{strings.time}</div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatDuration(route.estimated_seconds)}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{strings.steps}</div>
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#1f2937' }}>
                        {route.steps.map((step, i) => (
                            <li key={i} onClick={() => goToStep(i)} style={{ marginBottom: 6, cursor: 'pointer', fontWeight: i === stepIndex ? 700 : 400 }}>
                                {format(strings.stepWalk, { distance: formatDistance(step.distance, route.unit), layout: step.layout_name ?? layoutNames[step.layout_id] ?? '' })}
                                {step.transition && (
                                    <div style={{ color: '#6d28d9' }}>
                                        {format(strings.stepTransition, {
                                            transport: strings.transport[(step.transition.vertical_type ?? 'elevator') as keyof ViewerStrings['transport']],
                                            layout: layoutNames[step.transition.to_layout_id] ?? '',
                                        })}
                                    </div>
                                )}
                            </li>
                        ))}
                        <li style={{ color: '#16a34a' }}>{format(strings.arrive, { place: route.to.label })}</li>
                    </ol>
                    <button
                        type="button"
                        onClick={shareOnPhone}
                        style={{ marginTop: 8, width: '100%', border: '1px solid #111827', background: '#fff', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 14 }}
                    >
                        📱 {strings.showOnPhone}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ position: 'relative', height, fontFamily: 'Inter, "Segoe UI", Roboto, system-ui, sans-serif', display: 'flex', flexDirection: narrow ? 'column' : 'row', background: '#f3f4f6' }}>
            {!narrow && (
                <aside style={{ width: 360, flexShrink: 0, padding: 16, overflowY: 'auto', background: '#fff', borderRight: '1px solid #e5e7eb', boxSizing: 'border-box' }}>{panel}</aside>
            )}

            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
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
                    height="100%"
                />

                {/* Selector de piso */}
                {sortedLayouts.length > 1 && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.15)', overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', padding: '6px 10px 2px' }}>{strings.layouts}</div>
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
                                        background: l.id === layout.id ? '#E1251B' : '#fff',
                                        color: l.id === layout.id ? '#fff' : '#111827',
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
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
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
                    <div style={{ position: 'absolute', left: 12, right: narrow ? 12 : 'auto', bottom: narrow ? 12 : 64, width: narrow ? 'auto' : 320, background: '#fff', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,.18)', padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.label}</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>
                                    {[selected.code, selected.category?.name, layoutNames[selected.layout_id]].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            <button type="button" onClick={() => setSelected(null)} aria-label={strings.close} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>
                                ×
                            </button>
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
                                <a href={selected.qr_url} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', color: '#111827', textDecoration: 'none' }}>
                                    ↗ Web
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {narrow && (
                <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, maxHeight: panelOpen ? '55vh' : 56, overflowY: 'auto', transition: 'max-height .2s' }}>
                    <button type="button" onClick={() => setPanelOpen(!panelOpen)} style={{ display: 'block', margin: '0 auto 8px', width: 48, height: 5, borderRadius: 3, border: 'none', background: '#d1d5db', cursor: 'pointer' }} aria-label="panel" />
                    {panelOpen ? panel : <div style={{ textAlign: 'center', fontWeight: 600 }}>{route ? `${formatDistance(route.distance, route.unit)} · ${formatDuration(route.estimated_seconds)}` : data.name}</div>}
                </div>
            )}

            {session?.view_url && (
                <div onClick={() => setSession(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 340 }}>
                        <QRCodeSVG value={session.view_url} size={240} level="M" includeMargin />
                        <p style={{ fontSize: 14, color: '#374151' }}>{strings.scanQr}</p>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>{format(strings.expires, { time: new Date(session.expires_at).toLocaleTimeString() })}</p>
                        <button type="button" onClick={() => setSession(null)} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                            {strings.close}
                        </button>
                    </div>
                </div>
            )}
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
