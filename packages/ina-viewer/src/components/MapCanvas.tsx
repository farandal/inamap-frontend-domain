import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Category, Layout, LayoutContent, Path, PathLink, Point, Polygonal } from '../types';
import { centroid } from '../geometry';

/**
 * MapCanvas — dibuja un layout de un inamap (README §4.3/§4.4).
 *
 * Todo se dibuja en coordenadas del mundo (la unidad del inamap, v1 metros)
 * dentro de un <g> transformado; los trazos usan vector-effect para mantener
 * su grosor en pantalla y textos / pines se contra-escalan para mantener su
 * tamaño. El orden de capas es el del README: fondo → zonas → estructuras →
 * caminos → enlaces → ubicaciones → ruta → superposición del editor.
 */

export type LayerKey = 'background' | 'zones' | 'structures' | 'locations' | 'paths' | 'links' | 'grid';
export type Layers = Record<LayerKey, boolean>;

export const DEFAULT_LAYERS: Layers = {
    background: true,
    zones: true,
    structures: true,
    locations: true,
    paths: true,
    links: true,
    grid: false,
};

export type ElementType = 'zone' | 'structure' | 'location' | 'path' | 'link';
export interface Selection {
    type: ElementType;
    id: string;
}

export interface ViewState {
    /** Píxeles por unidad del mundo. */
    scale: number;
    tx: number;
    ty: number;
}

export interface MapCanvasHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    fit: () => void;
    centerOn: (point: Point, scale?: number) => void;
    getView: () => ViewState;
}

export interface OverlayContext {
    /** Píxeles por unidad: divida tamaños de pantalla por esto para dibujar en el mundo. */
    scale: number;
    /** Tamaño en mundo equivalente a `px` píxeles de pantalla. */
    px: (pixels: number) => number;
}

export interface MapCanvasProps {
    layout: Layout;
    content: LayoutContent;
    /** Caminos de todos los layouts: los enlaces verticales pueden apuntar a otro piso. */
    allPaths?: Path[];
    layoutNames?: Record<string, string>;
    categories?: Category[];
    layers?: Partial<Layers>;
    gridStep?: number;
    unit?: string;
    selection?: Selection | null;
    /** Elementos a resaltar como conflicto (p. ej. zonas solapadas). */
    conflicts?: string[];
    /** Tramo de ruta a dibujar en este layout. */
    route?: Point[] | null;
    routeStart?: Point | null;
    routeEnd?: Point | null;
    /** Arrastrar con el botón principal sobre el fondo desplaza la vista. */
    panOnDrag?: boolean;
    cursor?: string;
    height?: number | string;
    showControls?: boolean;
    controlsBottom?: number;
    scaleBarBottom?: number;
    onElementClick?: (selection: Selection, event: React.PointerEvent, world: Point) => void;
    onDoubleClickWorld?: (world: Point, event: React.MouseEvent) => void;
    onBackgroundPointerDown?: (world: Point, event: React.PointerEvent) => void;
    onPointerMoveWorld?: (world: Point, event: React.PointerEvent) => void;
    onPointerUpWorld?: (world: Point, event: React.PointerEvent) => void;
    onViewChange?: (view: ViewState) => void;
    renderOverlay?: (ctx: OverlayContext) => React.ReactNode;
    labels?: { zoomIn?: string; zoomOut?: string; fit?: string };
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 400;
const FONT = 'Inter, "Segoe UI", Roboto, Arial, sans-serif';

const VERTICAL_LABEL: Record<string, string> = {
    elevator: 'Ascensor',
    ramp: 'Rampa',
    stairs: 'Escalera',
    escalator: 'Esc. mecánica',
};

const toPoints = (points: Point[]) => points.map((p) => `${p[0]},${p[1]}`).join(' ');

function styleOf(shape: Polygonal, fallback: string, solid: boolean) {
    const style = (shape.metadata?.style ?? {}) as { stroke?: string; opacity?: number };
    const fill = shape.color || fallback;
    return {
        fill,
        stroke: style.stroke || fill,
        opacity: typeof style.opacity === 'number' ? style.opacity : solid ? 0.55 : 0.35,
    };
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(props, ref) {
    const {
        layout,
        content,
        allPaths,
        layoutNames = {},
        categories = [],
        gridStep = 1,
        unit = 'm',
        selection,
        conflicts = [],
        route,
        routeStart,
        routeEnd,
        panOnDrag = true,
        cursor,
        height = '100%',
        showControls = true,
        controlsBottom = 14,
        scaleBarBottom = 14,
        onElementClick,
        onDoubleClickWorld,
        onBackgroundPointerDown,
        onPointerMoveWorld,
        onPointerUpWorld,
        onViewChange,
        renderOverlay,
        labels = {},
    } = props;

    const layers = useMemo(() => ({ ...DEFAULT_LAYERS, ...(props.layers ?? {}) }), [props.layers]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [view, setView] = useState<ViewState>({ scale: 1, tx: 0, ty: 0 });
    const viewRef = useRef(view);
    viewRef.current = view;
    const fittedFor = useRef<string | null>(null);
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
    const pinchStart = useRef<{ dist: number; scale: number; cx: number; cy: number; tx: number; ty: number } | null>(null);

    const categoryColor = useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach((c) => {
            if (c.color) map[c.id] = c.color;
        });
        return map;
    }, [categories]);

    const updateView = useCallback(
        (next: ViewState) => {
            const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
            const value = { ...next, scale };
            setView(value);
            onViewChange?.(value);
        },
        [onViewChange],
    );

    const fit = useCallback(() => {
        const pad = 32;
        const scale = Math.min((size.width - pad * 2) / layout.width, (size.height - pad * 2) / layout.height);
        updateView({
            scale,
            tx: (size.width - layout.width * scale) / 2,
            ty: (size.height - layout.height * scale) / 2,
        });
    }, [layout.width, layout.height, size.width, size.height, updateView]);

    const zoomAt = useCallback(
        (factor: number, cx: number, cy: number) => {
            const v = viewRef.current;
            const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
            const k = scale / v.scale;
            updateView({ scale, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k });
        },
        [updateView],
    );

    useImperativeHandle(
        ref,
        () => ({
            zoomIn: () => zoomAt(1.25, size.width / 2, size.height / 2),
            zoomOut: () => zoomAt(0.8, size.width / 2, size.height / 2),
            fit,
            centerOn: (p, scale) => {
                const s = scale ?? viewRef.current.scale;
                updateView({ scale: s, tx: size.width / 2 - p[0] * s, ty: size.height / 2 - p[1] * s });
            },
            getView: () => viewRef.current,
        }),
        [zoomAt, fit, size.width, size.height, updateView],
    );

    // Tamaño del contenedor.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height: h } = entry.contentRect;
            if (width > 0 && h > 0) setSize({ width, height: h });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Encuadre automático al cambiar de layout o de tamaño inicial.
    useEffect(() => {
        const key = `${layout.id}:${layout.width}:${layout.height}`;
        if (fittedFor.current !== key && size.width > 0) {
            fittedFor.current = key;
            fit();
        }
    }, [layout.id, layout.width, layout.height, size.width, fit]);

    // Zoom con la rueda (listener no pasivo para poder prevenir el scroll).
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoomAt]);

    const toWorld = useCallback((clientX: number, clientY: number): Point => {
        const rect = containerRef.current!.getBoundingClientRect();
        const v = viewRef.current;
        return [(clientX - rect.left - v.tx) / v.scale, (clientY - rect.top - v.ty) / v.scale];
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            const rect = containerRef.current!.getBoundingClientRect();
            pinchStart.current = {
                dist: Math.hypot(b.x - a.x, b.y - a.y),
                scale: viewRef.current.scale,
                cx: (a.x + b.x) / 2 - rect.left,
                cy: (a.y + b.y) / 2 - rect.top,
                tx: viewRef.current.tx,
                ty: viewRef.current.ty,
            };
            panStart.current = null;
            return;
        }

        const isPanButton = e.button === 1 || e.button === 2 || (e.button === 0 && (panOnDrag || e.altKey));
        const onBackground = (e.target as Element).getAttribute('data-bg') === '1';

        if (e.button === 0 && !e.altKey && onBackgroundPointerDown && onBackground) {
            onBackgroundPointerDown(toWorld(e.clientX, e.clientY), e);
            if (!panOnDrag) return;
        }

        if (isPanButton && (onBackground || e.button !== 0 || e.altKey)) {
            panStart.current = { x: e.clientX, y: e.clientY, tx: viewRef.current.tx, ty: viewRef.current.ty };
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinchStart.current && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            const s = pinchStart.current;
            const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (s.scale * Math.hypot(b.x - a.x, b.y - a.y)) / s.dist));
            const k = scale / s.scale;
            updateView({ scale, tx: s.cx - (s.cx - s.tx) * k, ty: s.cy - (s.cy - s.ty) * k });
            return;
        }

        if (panStart.current) {
            updateView({
                scale: viewRef.current.scale,
                tx: panStart.current.tx + (e.clientX - panStart.current.x),
                ty: panStart.current.ty + (e.clientY - panStart.current.y),
            });
            return;
        }

        onPointerMoveWorld?.(toWorld(e.clientX, e.clientY), e);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinchStart.current = null;
        if (panStart.current) {
            panStart.current = null;
            return;
        }
        onPointerUpWorld?.(toWorld(e.clientX, e.clientY), e);
    };

    const px = (pixels: number) => pixels / view.scale;
    const isSelected = (type: string, id: string) => selection?.type === type && selection.id === id;

    const elementHandlers = (type: Selection['type'], id: string) =>
        onElementClick
            ? {
                  onPointerDown: (e: React.PointerEvent) => {
                      if (e.button !== 0 || e.altKey) return;
                      e.stopPropagation();
                      onElementClick({ type, id }, e, toWorld(e.clientX, e.clientY));
                  },
                  style: { cursor: cursor ?? 'pointer' },
              }
            : {};

    const label = (text: string, at: Point, opts: { size?: number; weight?: number; color?: string; dy?: number } = {}) => (
        <text
            x={at[0]}
            y={at[1] + px(opts.dy ?? 0)}
            fontSize={px(opts.size ?? 13)}
            fontWeight={opts.weight ?? 600}
            fontFamily={FONT}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={opts.color ?? '#1f2937'}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={px(3)}
            paintOrder="stroke"
            pointerEvents="none"
        >
            {text}
        </text>
    );

    const renderPolygon = (shape: Polygonal, type: 'zone' | 'structure') => {
        const solid = type === 'structure';
        const s = styleOf(shape, solid ? '#3b82f6' : '#22c55e', solid);
        const selected = isSelected(type, shape.id);
        const conflict = conflicts.includes(shape.id);
        const c = centroid(shape.polygon);
        return (
            <g key={shape.id} {...elementHandlers(type, shape.id)}>
                <polygon
                    points={toPoints(shape.polygon)}
                    fill={conflict ? '#ef4444' : s.fill}
                    fillOpacity={conflict ? 0.45 : s.opacity}
                    stroke={conflict ? '#b91c1c' : selected ? '#111827' : s.stroke}
                    strokeWidth={selected || conflict ? 3 : 2}
                    strokeDasharray={solid ? undefined : '8 5'}
                    vectorEffect="non-scaling-stroke"
                />
                {label(shape.label, c, { size: solid ? 14 : 13, color: '#111827' })}
            </g>
        );
    };

    const renderPath = (path: Path) => {
        const selected = isSelected('path', path.id);
        const arrows: React.ReactNode[] = [];
        if (path.direction !== 'both') {
            for (let i = 0; i < path.points.length - 1; i++) {
                const [a, b] = [path.points[i], path.points[i + 1]];
                const [from, to] = path.direction === 'forward' ? [a, b] : [b, a];
                const angle = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
                const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                arrows.push(
                    <g key={i} transform={`translate(${mid[0]},${mid[1]}) rotate(${angle}) scale(${px(1)})`} pointerEvents="none">
                        <path d="M-6,-5 L6,0 L-6,5 Z" fill="#2563eb" />
                    </g>,
                );
            }
        }
        return (
            <g key={path.id} {...elementHandlers('path', path.id)}>
                {/* Trazo ancho e invisible para facilitar el clic */}
                <polyline points={toPoints(path.points)} fill="none" stroke="transparent" strokeWidth={14} vectorEffect="non-scaling-stroke" />
                <polyline
                    points={toPoints(path.points)}
                    fill="none"
                    stroke={selected ? '#1e3a8a' : '#2563eb'}
                    strokeWidth={selected ? 5 : 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                {arrows}
                {path.points.length > 0 && (
                    <>
                        <circle cx={path.points[0][0]} cy={path.points[0][1]} r={px(4)} fill="#fff" stroke="#2563eb" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                        <circle
                            cx={path.points[path.points.length - 1][0]}
                            cy={path.points[path.points.length - 1][1]}
                            r={px(4)}
                            fill="#fff"
                            stroke="#2563eb"
                            strokeWidth={2}
                            vectorEffect="non-scaling-stroke"
                        />
                    </>
                )}
            </g>
        );
    };

    const pathIndex = useMemo(() => {
        const map: Record<string, Path> = {};
        [...(allPaths ?? []), ...content.paths].forEach((p) => (map[p.id] = p));
        return map;
    }, [allPaths, content.paths]);

    const endOf = (pathId: string, end: string): Point | null => {
        const p = pathIndex[pathId];
        if (!p || p.points.length === 0) return null;
        return end === 'start' ? p.points[0] : p.points[p.points.length - 1];
    };

    const renderLink = (link: PathLink) => {
        const from = pathIndex[link.from_path_id];
        const to = pathIndex[link.to_path_id];
        if (!from || !to) return null;
        const selected = isSelected('link', link.id);

        if (link.kind === 'vertical') {
            // Solo se dibuja el extremo que está en este layout.
            const here = from.layout_id === layout.id ? endOf(from.id, link.from_end) : to.layout_id === layout.id ? endOf(to.id, link.to_end) : null;
            const other = from.layout_id === layout.id ? to : from;
            if (!here) return null;
            return (
                <g key={link.id} {...elementHandlers('link', link.id)}>
                    <g transform={`translate(${here[0]},${here[1]}) scale(${px(1)})`}>
                        <rect x={-13} y={-13} width={26} height={26} rx={5} fill="#fff" stroke={selected ? '#3b0764' : '#7c3aed'} strokeWidth={selected ? 3 : 2} />
                        <path d="M-5,-2 L0,-8 L5,-2 M-5,2 L0,8 L5,2" fill="none" stroke="#7c3aed" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                        <text x={18} y={-3} fontSize={12} fontWeight={600} fontFamily={FONT} fill="#4c1d95" stroke="#fff" strokeWidth={3} paintOrder="stroke">
                            {VERTICAL_LABEL[link.vertical_type ?? ''] ?? 'Enlace vertical'}
                        </text>
                        <text x={18} y={12} fontSize={11} fontFamily={FONT} fill="#6d28d9" stroke="#fff" strokeWidth={3} paintOrder="stroke">
                            ↔ {layoutNames[other.layout_id] ?? ''}
                        </text>
                    </g>
                </g>
            );
        }

        const a = endOf(from.id, link.from_end);
        const b = endOf(to.id, link.to_end);
        if (!a || !b || from.layout_id !== layout.id) return null;
        return (
            <g key={link.id} {...elementHandlers('link', link.id)}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth={14} vectorEffect="non-scaling-stroke" />
                <line
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={selected ? '#3b0764' : '#7c3aed'}
                    strokeWidth={selected ? 4 : 2.5}
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />
            </g>
        );
    };

    const renderPin = (at: Point, color: string, key: string, selected: boolean, title?: string, handlers: object = {}) => (
        <g key={key} {...handlers}>
            <g transform={`translate(${at[0]},${at[1]}) scale(${px(1)})`}>
                <path
                    d="M0,0 C-3,-8 -11,-12 -11,-21 A11,11 0 1 1 11,-21 C11,-12 3,-8 0,0 Z"
                    fill={color}
                    stroke={selected ? '#111827' : '#fff'}
                    strokeWidth={selected ? 3 : 2}
                />
                <circle cx={0} cy={-21} r={4.5} fill="#fff" />
                {title && (
                    <text x={14} y={-18} fontSize={13} fontWeight={700} fontFamily={FONT} fill="#111827" stroke="#fff" strokeWidth={3} paintOrder="stroke">
                        {title}
                    </text>
                )}
            </g>
        </g>
    );

    const renderGrid = () => {
        if (!layers.grid || gridStep <= 0) return null;
        // Evita dibujar miles de líneas: muestra la grilla solo si cada celda mide ≥ 6 px.
        let step = gridStep;
        while (step * view.scale < 6) step *= 5;
        const lines: React.ReactNode[] = [];
        for (let x = 0; x <= layout.width + 1e-9; x += step) {
            lines.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={layout.height} />);
        }
        for (let y = 0; y <= layout.height + 1e-9; y += step) {
            lines.push(<line key={`y${y}`} x1={0} y1={y} x2={layout.width} y2={y} />);
        }
        return (
            <g stroke="rgba(15,23,42,0.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none">
                {lines}
            </g>
        );
    };

    // Barra de escala: largo "redondo" cercano a 120 px.
    const scaleBar = useMemo(() => {
        const target = 120 / view.scale;
        const pow = 10 ** Math.floor(Math.log10(target));
        const nice = [1, 2, 5, 10].map((m) => m * pow).find((v) => v >= target) ?? 10 * pow;
        return { value: nice, width: nice * view.scale };
    }, [view.scale]);

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: 'transparent', touchAction: 'none', userSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <style>{`@keyframes ina-route-dash { to { stroke-dashoffset: -24; } }`}</style>
            <svg
                width="100%"
                height="100%"
                style={{ display: 'block', cursor: panStart.current ? 'grabbing' : cursor }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={(e) => onDoubleClickWorld?.(toWorld(e.clientX, e.clientY), e)}
            >
                <rect x={0} y={0} width="100%" height="100%" fill="transparent" data-bg="1" />
                <g transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
                    <rect x={0} y={0} width={layout.width} height={layout.height} fill="#ffffff" data-bg="1" />
                    {layers.background && layout.image_url && (
                        <image
                            href={layout.image_url}
                            x={0}
                            y={0}
                            width={layout.width}
                            height={layout.height}
                            preserveAspectRatio="none"
                            data-bg="1"
                        />
                    )}
                    <rect
                        x={0}
                        y={0}
                        width={layout.width}
                        height={layout.height}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                    />
                    {renderGrid()}
                    {layers.zones && content.zones.map((z) => renderPolygon(z, 'zone'))}
                    {layers.structures && content.structures.map((s) => renderPolygon(s, 'structure'))}
                    {layers.paths && content.paths.map(renderPath)}
                    {layers.links && (content.links ?? []).map(renderLink)}
                    {layers.locations &&
                        content.locations.map((l) =>
                            renderPin(
                                [l.x, l.y],
                                (l.category_id && categoryColor[l.category_id]) || l.category?.color || '#E1251B',
                                l.id,
                                isSelected('location', l.id),
                                l.code || l.label,
                                elementHandlers('location', l.id),
                            ),
                        )}
                    {route && route.length > 1 && (
                        <g pointerEvents="none">
                            <polyline points={toPoints(route)} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            <polyline
                                points={toPoints(route)}
                                fill="none"
                                stroke="#E1251B"
                                strokeWidth={4}
                                strokeDasharray="12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                style={{ animation: 'ina-route-dash 0.8s linear infinite' }}
                            />
                        </g>
                    )}
                    {routeStart && (
                        <circle cx={routeStart[0]} cy={routeStart[1]} r={px(8)} fill="#16a34a" stroke="#fff" strokeWidth={3} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                    )}
                    {routeEnd && renderPin(routeEnd, '#E1251B', '__route_end', true)}
                    {renderOverlay?.({ scale: view.scale, px })}
                </g>
            </svg>

            {/* Barra de escala y norte */}
            <div style={{ position: 'absolute', left: 16, bottom: scaleBarBottom, fontFamily: FONT, fontSize: 11, color: '#334155', pointerEvents: 'none' }}>
                <div style={{ width: scaleBar.width, borderBottom: '3px solid #334155', borderLeft: '2px solid #334155', borderRight: '2px solid #334155', height: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: scaleBar.width }}>
                    <span>0</span>
                    <span>
                        {scaleBar.value >= 1 ? scaleBar.value : scaleBar.value.toFixed(2)} {unit}
                    </span>
                </div>
            </div>

            {showControls && (
                <div style={{ position: 'absolute', right: 14, bottom: controlsBottom, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                    <div
                        title="N"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--module-bg, rgba(255,255,255,.96))',
                            color: 'var(--text-color, #334155)',
                            boxShadow: '0 3px 12px rgba(15,23,42,.16)',
                            border: '1px solid var(--module-border, #E2E8F0)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: FONT,
                            fontSize: 10,
                            fontWeight: 700,
                        }}
                    >
                        <span>N</span>
                        <svg width="14" height="16" viewBox="0 0 14 16">
                            <path d="M7 0 L14 16 L7 12 L0 16 Z" fill="currentColor" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--module-bg, rgba(255,255,255,.97))', color: 'var(--text-color, #334155)', borderRadius: 10, boxShadow: '0 3px 12px rgba(15,23,42,.16)', border: '1px solid var(--module-border, #E2E8F0)', overflow: 'hidden' }}>
                        {[
                            { t: '+', title: labels.zoomIn ?? 'Acercar', fn: () => zoomAt(1.25, size.width / 2, size.height / 2) },
                            { t: '−', title: labels.zoomOut ?? 'Alejar', fn: () => zoomAt(0.8, size.width / 2, size.height / 2) },
                            { t: '⌖', title: labels.fit ?? 'Encuadrar', fn: fit },
                        ].map((b) => (
                            <button
                                key={b.t}
                                type="button"
                                title={b.title}
                                onClick={b.fn}
                                style={{ width: 38, height: 36, border: 'none', borderBottom: '1px solid var(--module-border, #E2E8F0)', background: 'transparent', color: 'var(--text-color, #334155)', fontSize: 18, cursor: 'pointer' }}
                            >
                                {b.t}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

export default MapCanvas;
