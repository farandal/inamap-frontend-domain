import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotify, useTranslate } from 'react-admin';
import { Box, Breadcrumbs, Button, Chip, CircularProgress, Divider, Drawer, IconButton, MenuItem, Select, Slider, Stack, Tooltip, Typography } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import GridOnIcon from '@mui/icons-material/GridOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {
    DEFAULT_LAYERS,
    MapCanvas,
    distance,
    isSimplePolygon,
    polygonsOverlap,
    projectOnSegment,
    round,
    roundPoint,
    snapToGrid,
} from 'ina-viewer';
import type { Category, Inamap, Layers, LayerKey, Layout, MapCanvasHandle, Path, PathLink, Point, Polygonal, RouteResult, Selection, VerticalType } from 'ina-viewer';
import { apiErrorMessage, apiValidationErrors, ConnectivityReport, useInamapApi } from '../../api/useInamapApi';
import { useEditorDocument } from './useEditorDocument';
import { CollectionKey, collectionOf, DEFAULT_COLORS, EditorDoc, isTmpId, newTmpId, Panel, pointsOf, SubMode, Tool } from './types';
import EditorSidebar from './EditorSidebar';
import PropertiesPanel from './PropertiesPanel';
import { DRAWER_PAPER, LayoutsDrawer, LayoutSwitcher } from './LayoutsPanel';
import SettingsDrawer from './SettingsDrawer';
import { LinkTypeDialog, RouteTestDialog } from './EditorDialogs';

/**
 * Editor de un inamap (README §4.3, diseño de referencia).
 *
 * Se monta como `showComponent` del recurso inamaps (pantalla completa). El
 * menú MAPA / HERRAMIENTAS / CAPAS vive en el sidebar de la app
 * (EditorSidebar); las propiedades del elemento seleccionado, los layouts y
 * la configuración se abren en drawers a la derecha.
 *
 * La geometría de cada layout se edita en memoria (deshacer/rehacer) y se
 * guarda de una vez con PUT inamap/layouts/{id}/geometry. Los enlaces entre
 * caminos se crean al instante (requieren caminos ya guardados).
 */

interface EndpointRef {
    pathId: string;
    end: 'start' | 'end';
    layoutId: string;
}

type Drag = { kind: 'vertex'; collection: CollectionKey; id: string; index: number } | { kind: 'location'; id: string } | null;

const DRAWING_TOOLS: Tool[] = ['zone', 'structure', 'path'];
const GRID_STEPS = [0.25, 0.5, 1, 2, 5, 10];
const ZOOM_STEPS = [25, 50, 75, 100, 150, 200, 300, 400];

export interface InamapEditorProps {
    inamapId: string;
}

export const InamapEditor: React.FC<InamapEditorProps> = ({ inamapId }) => {
    const translate = useTranslate();
    const notify = useNotify();
    const api = useInamapApi();
    const canvasRef = useRef<MapCanvasHandle>(null);
    const { doc, update, updateSilently, beginChange, undo, redo, reset, canUndo, canRedo, dirty } = useEditorDocument();

    const [inamap, setInamap] = useState<Inamap | null>(null);
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [layoutId, setLayoutId] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [allPaths, setAllPaths] = useState<Path[]>([]);
    const [links, setLinks] = useState<PathLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [panel, setPanel] = useState<Panel>('editor');
    const [tool, setTool] = useState<Tool>('select');
    const [subMode, setSubMode] = useState<SubMode>('none');
    const [layers, setLayers] = useState<Layers>({ ...DEFAULT_LAYERS });
    const [preview, setPreview] = useState(false);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [draft, setDraft] = useState<Point[]>([]);
    const [cursor, setCursor] = useState<Point | null>(null);
    const [measure, setMeasure] = useState<Point[]>([]);
    const [linkStart, setLinkStart] = useState<EndpointRef | null>(null);
    const [pendingVertical, setPendingVertical] = useState<{ from: EndpointRef; to: EndpointRef } | null>(null);
    const [serverConflicts, setServerConflicts] = useState<string[]>([]);
    const [connectivity, setConnectivity] = useState<ConnectivityReport | null>(null);
    const [checking, setChecking] = useState(false);
    const [routePreview, setRoutePreview] = useState<RouteResult | null>(null);
    const [routeDialog, setRouteDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scale, setScale] = useState(1);
    const [fitScale, setFitScale] = useState<number | null>(null);
    const [gridStep, setGridStep] = useState(1);
    const [snapOn, setSnapOn] = useState(true);
    const [showSwitcher, setShowSwitcher] = useState(true);
    const drag = useRef<Drag>(null);

    const unit = inamap?.unit ?? 'm';
    const layout = layouts.find((l) => l.id === layoutId) ?? null;
    const layoutNames = useMemo(() => Object.fromEntries(layouts.map((l) => [l.id, l.name])), [layouts]);

    /* ───────────────────────── carga ───────────────────────── */

    const sortLayouts = (list: Layout[]) => [...list].sort((a, b) => a.level - b.level || (a.sort ?? 0) - (b.sort ?? 0));

    const reloadLinks = useCallback(async () => {
        const [paths, linkList] = await Promise.all([api.listPaths(inamapId), api.listLinks(inamapId)]);
        setAllPaths(paths ?? []);
        setLinks(linkList ?? []);
    }, [api, inamapId]);

    const reloadInamap = useCallback(
        async (selectLayoutId?: string) => {
            const data = await api.getInamap(inamapId);
            setInamap(data);
            const list = sortLayouts(data.layouts ?? []);
            setLayouts(list);
            setLayoutId((current) => selectLayoutId ?? (current && list.some((l) => l.id === current) ? current : list[0]?.id ?? null));
        },
        [api, inamapId],
    );

    useEffect(() => {
        setLoading(true);
        Promise.all([reloadInamap(), api.listCategories().then(setCategories).catch(() => setCategories([])), reloadLinks().catch(() => undefined)])
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    }, [reloadInamap, reloadLinks, api]);

    const loadGeometry = useCallback(
        async (id: string) => {
            const geometry = await api.getGeometry(id);
            reset({ zones: geometry.zones, structures: geometry.structures, locations: geometry.locations, paths: geometry.paths });
            setLayouts((list) => list.map((l) => (l.id === id ? { ...l, ...geometry.layout } : l)));
        },
        [api, reset],
    );

    useEffect(() => {
        if (!layoutId) {
            reset({ zones: [], structures: [], locations: [], paths: [] });
            return;
        }
        setSelection(null);
        setDraft([]);
        setMeasure([]);
        setServerConflicts([]);
        setFitScale(null);
        loadGeometry(layoutId).catch((e) => notify(apiErrorMessage(e), { type: 'error' }));
    }, [layoutId, loadGeometry, notify, reset]);

    const switchLayout = (id: string) => {
        if (id === layoutId) return;
        if (dirty && !window.confirm(translate('ina_maps.editor.layouts.switch_unsaved'))) return;
        setLayoutId(id);
    };

    /* ───────────────────── derivados ───────────────────── */

    /** settings.allow_zone_overlap del inamap: apagado por defecto (RF-06). */
    const allowZoneOverlap = inamap?.settings?.allow_zone_overlap === true;

    const clientConflicts = useMemo(() => {
        if (allowZoneOverlap) return [];
        const ids = new Set<string>();
        for (let i = 0; i < doc.zones.length; i++) {
            for (let j = i + 1; j < doc.zones.length; j++) {
                if (polygonsOverlap(doc.zones[i].polygon, doc.zones[j].polygon)) {
                    ids.add(doc.zones[i].id);
                    ids.add(doc.zones[j].id);
                }
            }
        }
        return [...ids];
    }, [doc.zones, allowZoneOverlap]);

    const conflicts = useMemo(() => [...new Set([...clientConflicts, ...serverConflicts])], [clientConflicts, serverConflicts]);

    /** Caminos de todo el inamap con las ediciones locales del layout actual. */
    const mergedPaths = useMemo(() => [...allPaths.filter((p) => p.layout_id !== layoutId), ...doc.paths], [allPaths, doc.paths, layoutId]);
    const pathIds = useMemo(() => new Set(mergedPaths.map((p) => p.id)), [mergedPaths]);
    const visibleLinks = useMemo(() => links.filter((l) => pathIds.has(l.from_path_id) && pathIds.has(l.to_path_id)), [links, pathIds]);

    const content = useMemo(() => ({ ...doc, links: visibleLinks }), [doc, visibleLinks]);

    const routeHere = useMemo(() => {
        if (!routePreview || !layoutId) return null;
        const points = routePreview.steps.filter((s) => s.layout_id === layoutId).flatMap((s) => s.points);
        return points.length > 1 ? points : null;
    }, [routePreview, layoutId]);

    const selectedItem = useMemo(() => {
        if (!selection) return null;
        if (selection.type === 'link') return links.find((l) => l.id === selection.id) ?? null;
        const key = collectionOf(selection.type);
        return key ? ((doc[key] as Array<{ id: string }>).find((i) => i.id === selection.id) ?? null) : null;
    }, [selection, doc, links]);

    /* ───────────────────── edición ───────────────────── */

    const px = (pixels: number) => pixels / (scale || 1);

    /** Ajuste a vértices cercanos (prioritario, conecta caminos) y luego a la grilla. */
    const snap = useCallback(
        (p: Point, exclude?: { id: string; index: number }): Point => {
            const threshold = 10 / (scale || 1);
            let best: Point | null = null;
            let bestDistance = threshold;
            const consider = (q: Point, id: string, index: number) => {
                if (exclude && exclude.id === id && exclude.index === index) return;
                const d = distance(p, q);
                if (d < bestDistance) {
                    bestDistance = d;
                    best = q;
                }
            };
            doc.paths.forEach((path) => path.points.forEach((q, i) => consider(q, path.id, i)));
            [...doc.zones, ...doc.structures].forEach((shape) => shape.polygon.forEach((q, i) => consider(q, shape.id, i)));
            if (best) return best;
            return snapOn ? snapToGrid(p, gridStep) : roundPoint(p);
        },
        [doc, scale, snapOn, gridStep],
    );

    const patchItem = useCallback(
        (collection: CollectionKey, id: string, patch: object, record = false) => {
            const fn = (d: EditorDoc) => ({ ...d, [collection]: (d[collection] as Array<{ id: string }>).map((i) => (i.id === id ? { ...i, ...patch } : i)) }) as EditorDoc;
            record ? update(fn) : updateSilently(fn);
            setRoutePreview(null);
        },
        [update, updateSilently],
    );

    const removeItem = useCallback(
        (collection: CollectionKey, id: string) => {
            update((d) => ({ ...d, [collection]: (d[collection] as Array<{ id: string }>).filter((i) => i.id !== id) }) as EditorDoc);
            setSelection(null);
            setRoutePreview(null);
        },
        [update],
    );

    const nextCode = (prefix: string, items: Array<{ code?: string | null }>) => {
        let n = items.length + 1;
        const used = new Set(items.map((i) => i.code));
        while (used.has(`${prefix}${String(n).padStart(3, '0')}`)) n++;
        return `${prefix}${String(n).padStart(3, '0')}`;
    };

    const closeDraft = useCallback(() => {
        // El doble clic agrega puntos repetidos: se depuran antes de cerrar.
        const points = draft.filter((p, i) => i === 0 || distance(p, draft[i - 1]) > 1e-6);
        if (tool === 'zone' || tool === 'structure') {
            if (points.length < 3 || !isSimplePolygon(points)) {
                notify('ina_maps.editor.messages.polygon_invalid', { type: 'warning' });
                return;
            }
            if (tool === 'zone' && !allowZoneOverlap && doc.zones.some((z) => polygonsOverlap(points, z.polygon))) {
                notify('ina_maps.editor.messages.zone_overlap', { type: 'warning' });
                return;
            }
            const collection = tool === 'zone' ? 'zones' : 'structures';
            const defaults = DEFAULT_COLORS[tool];
            const items = doc[collection];
            const item: Polygonal = {
                id: newTmpId(),
                layout_id: layoutId!,
                label: `${translate(`ina_maps.editor.tools.${tool}`)} ${items.length + 1}`,
                code: nextCode(tool === 'zone' ? 'Z' : 'E', items),
                color: defaults.fill,
                polygon: points.map((p) => roundPoint(p)),
                terms: [],
                metadata: { style: { stroke: defaults.stroke, opacity: defaults.opacity } },
            };
            update((d) => ({ ...d, [collection]: [...d[collection], item] }));
            setSelection({ type: tool, id: item.id });
        } else if (tool === 'path') {
            if (points.length < 2) return;
            const item: Path = { id: newTmpId(), layout_id: layoutId!, label: null, points: points.map((p) => roundPoint(p)), direction: 'both' };
            update((d) => ({ ...d, paths: [...d.paths, item] }));
            setSelection({ type: 'path', id: item.id });
        }
        setDraft([]);
        setTool('select');
        setRoutePreview(null);
    }, [draft, tool, doc, layoutId, update, notify, translate, allowZoneOverlap]);

    const createLink = useCallback(
        async (from: EndpointRef, to: EndpointRef, verticalType?: VerticalType) => {
            try {
                await api.createLink({
                    from_path_id: from.pathId,
                    from_end: from.end,
                    to_path_id: to.pathId,
                    to_end: to.end,
                    kind: verticalType ? 'vertical' : 'link',
                    vertical_type: verticalType ?? null,
                    bidirectional: true,
                });
                notify('ina_maps.editor.messages.link_created', { type: 'success' });
                await reloadLinks();
            } catch (e) {
                notify(apiErrorMessage(e), { type: 'error' });
            } finally {
                setLinkStart(null);
            }
        },
        [api, notify, reloadLinks],
    );

    const nearestEndpoint = (world: Point): EndpointRef | null => {
        let best: EndpointRef | null = null;
        let bestDistance = 14 / (scale || 1);
        doc.paths.forEach((path) => {
            (['start', 'end'] as const).forEach((end) => {
                const p = end === 'start' ? path.points[0] : path.points[path.points.length - 1];
                const d = distance(world, p);
                if (d < bestDistance) {
                    bestDistance = d;
                    best = { pathId: path.id, end, layoutId: path.layout_id };
                }
            });
        });
        return best;
    };

    const handleLinkClick = (world: Point) => {
        const endpoint = nearestEndpoint(world);
        if (!endpoint) return;
        if (isTmpId(endpoint.pathId) || (dirty && !linkStart)) {
            notify('ina_maps.editor.messages.save_first', { type: 'warning' });
            return;
        }
        if (!linkStart) {
            setLinkStart(endpoint);
            return;
        }
        if (endpoint.pathId === linkStart.pathId) {
            notify('ina_maps.editor.messages.link_same_path', { type: 'warning' });
            return;
        }
        if (endpoint.layoutId !== linkStart.layoutId) {
            setPendingVertical({ from: linkStart, to: endpoint });
        } else {
            createLink(linkStart, endpoint);
        }
    };

    const insertVertex = (sel: Selection, world: Point) => {
        const collection = collectionOf(sel.type);
        if (!collection || collection === 'locations') return;
        const item = (doc[collection] as Array<Polygonal | Path>).find((i) => i.id === sel.id);
        if (!item) return;
        const points = pointsOf(item);
        const closed = 'polygon' in item;
        let bestIndex = -1;
        let bestPoint: Point = world;
        let bestDistance = Infinity;
        const segments = closed ? points.length : points.length - 1;
        for (let i = 0; i < segments; i++) {
            const [q, , d] = projectOnSegment(world, points[i], points[(i + 1) % points.length]);
            if (d < bestDistance) {
                bestDistance = d;
                bestIndex = i;
                bestPoint = q;
            }
        }
        if (bestIndex < 0) return;
        const next = [...points.slice(0, bestIndex + 1), roundPoint(bestPoint), ...points.slice(bestIndex + 1)];
        patchItem(collection, item.id, closed ? { polygon: next } : { points: next }, true);
    };

    const removeVertex = (collection: CollectionKey, id: string, index: number) => {
        const item = (doc[collection] as Array<Polygonal | Path>).find((i) => i.id === id);
        if (!item) return;
        const points = pointsOf(item);
        const closed = 'polygon' in item;
        if (points.length <= (closed ? 3 : 2)) return;
        const next = points.filter((_, i) => i !== index);
        patchItem(collection, id, closed ? { polygon: next } : { points: next }, true);
    };

    /* ───────────────────── eventos del canvas ───────────────────── */

    const onBackgroundPointerDown = (world: Point) => {
        if (preview || !layout) return;
        switch (tool) {
            case 'select':
                if (subMode === 'none') setSelection(null);
                return;
            case 'zone':
            case 'structure':
            case 'path': {
                const p = snap(world);
                if (tool !== 'path' && draft.length >= 3 && distance(p, draft[0]) < 10 / (scale || 1)) {
                    closeDraft();
                    return;
                }
                setDraft((d) => [...d, p]);
                return;
            }
            case 'location': {
                const p = snap(world);
                const item = {
                    id: newTmpId(),
                    layout_id: layout.id,
                    label: `${translate('ina_maps.editor.tools.location')} ${doc.locations.length + 1}`,
                    code: nextCode('U', doc.locations),
                    x: round(p[0], 3),
                    y: round(p[1], 3),
                    terms: [],
                };
                update((d) => ({ ...d, locations: [...d.locations, item] }));
                setSelection({ type: 'location', id: item.id });
                setTool('select');
                return;
            }
            case 'link':
                handleLinkClick(world);
                return;
            case 'measure':
                setMeasure((m) => (m.length >= 2 ? [snap(world)] : [...m, snap(world)]));
                return;
        }
    };

    const onElementClick = (sel: Selection, event: React.PointerEvent, world: Point) => {
        if (preview) {
            setSelection(sel);
            return;
        }
        if (tool !== 'select') {
            onBackgroundPointerDown(world);
            return;
        }
        if (subMode === 'add_vertex' && selection?.type === sel.type && selection.id === sel.id) {
            insertVertex(sel, world);
            return;
        }
        setSelection(sel);
        if (sel.type === 'location') {
            beginChange();
            drag.current = { kind: 'location', id: sel.id };
        }
    };

    const onPointerMoveWorld = (world: Point) => {
        setCursor(world);
        const current = drag.current;
        if (!current) return;
        if (current.kind === 'location') {
            const p = snap(world);
            patchItem('locations', current.id, { x: round(p[0], 3), y: round(p[1], 3) });
            return;
        }
        const item = (doc[current.collection] as Array<Polygonal | Path>).find((i) => i.id === current.id);
        if (!item) return;
        const p = snap(world, { id: current.id, index: current.index });
        const points = pointsOf(item).map((q, i) => (i === current.index ? roundPoint(p) : q));
        patchItem(current.collection, current.id, 'polygon' in item ? { polygon: points } : { points });
    };

    const onPointerUpWorld = () => {
        drag.current = null;
    };

    const onVertexPointerDown = (collection: CollectionKey, id: string, index: number) => (e: React.PointerEvent) => {
        if (e.button !== 0 || e.altKey) return;
        e.stopPropagation();
        if (subMode === 'remove_vertex') {
            removeVertex(collection, id, index);
            return;
        }
        beginChange();
        drag.current = { kind: 'vertex', collection, id, index };
    };

    /* ───────────────────── guardar / publicar ───────────────────── */

    const save = useCallback(async () => {
        if (!layoutId) return false;
        setSaving(true);
        const ref = (id: string) => (isTmpId(id) ? { client_id: id } : { id });
        const payload = {
            zones: doc.zones.map((z) => ({ ...ref(z.id), code: z.code, label: z.label, color: z.color, polygon: z.polygon, terms: z.terms ?? [], metadata: z.metadata ?? null })),
            structures: doc.structures.map((s) => ({ ...ref(s.id), code: s.code, label: s.label, color: s.color, polygon: s.polygon, terms: s.terms ?? [], metadata: s.metadata ?? null })),
            paths: doc.paths.map((p) => ({ ...ref(p.id), label: p.label, points: p.points, direction: p.direction, metadata: p.metadata ?? null })),
            locations: doc.locations.map((l) => ({
                ...ref(l.id),
                code: l.code,
                label: l.label,
                x: l.x,
                y: l.y,
                icon: l.icon || null,
                qr_url: l.qr_url || null,
                category_id: l.category_id || null,
                ...(l.structure_id && isTmpId(l.structure_id) ? { structure_client_id: l.structure_id } : { structure_id: l.structure_id || null }),
                terms: l.terms ?? [],
                metadata: l.metadata ?? null,
            })),
        };
        try {
            const result = await api.saveGeometry(layoutId, payload);
            const map = result.id_map ?? {};
            reset({ zones: result.data.zones, structures: result.data.structures, locations: result.data.locations, paths: result.data.paths });
            setSelection((sel) => (sel && map[sel.id] ? { ...sel, id: map[sel.id] } : sel));
            setServerConflicts([]);
            setConnectivity(null);
            await reloadLinks();
            if (result.warnings?.length) {
                notify('ina_maps.editor.messages.warnings', { type: 'warning', messageArgs: { list: result.warnings.map((w) => w.message).join(' · ') } });
            } else {
                notify('ina_maps.editor.messages.saved', { type: 'success' });
            }
            return true;
        } catch (e) {
            const errors = apiValidationErrors(e);
            const ids: string[] = [];
            Object.keys(errors).forEach((key) => {
                const [collection, index] = key.split('.');
                const item = (doc[collection as CollectionKey] as Array<{ id: string }> | undefined)?.[Number(index)];
                if (item) ids.push(item.id);
            });
            setServerConflicts(ids);
            notify(apiErrorMessage(e), { type: 'error' });
            return false;
        } finally {
            setSaving(false);
        }
    }, [api, doc, layoutId, notify, reloadLinks, reset]);

    const togglePublish = async () => {
        if (!inamap) return;
        if (dirty && !(await save())) return;
        try {
            const updated = inamap.status === 'published' ? await api.unpublish(inamap.id) : await api.publish(inamap.id);
            setInamap((current) => ({ ...current!, ...updated, layouts: current?.layouts }));
            notify(updated.status === 'published' ? 'ina_maps.editor.messages.published' : 'ina_maps.editor.messages.unpublished', { type: 'success' });
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        }
    };

    const checkConnectivity = async () => {
        if (!inamap) return;
        setChecking(true);
        try {
            setConnectivity(await api.connectivity(inamap.id));
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        } finally {
            setChecking(false);
        }
    };

    const downloadQr = async (id: string, name: string) => {
        try {
            const blob = await api.downloadLocationQr(id, 'png');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name || id}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        }
    };

    /* ───────────────────── teclado ───────────────────── */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                save();
                return;
            }
            if (typing) return;
            if (mod && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                e.shiftKey ? redo() : undo();
            } else if (mod && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === 'Escape') {
                setDraft([]);
                setLinkStart(null);
                setMeasure([]);
                setSubMode('none');
                if (!draft.length) setSelection(null);
            } else if (e.key === 'Enter' && draft.length) {
                closeDraft();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection && selection.type !== 'link') {
                const collection = collectionOf(selection.type);
                if (collection) removeItem(collection, selection.id);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [save, undo, redo, draft, closeDraft, selection, removeItem]);

    // Aviso del navegador al salir con cambios sin guardar.
    useEffect(() => {
        if (!dirty) return;
        const onUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [dirty]);

    /* ───────────────────── superposición del canvas ───────────────────── */

    const renderOverlay = () => {
        const nodes: React.ReactNode[] = [];
        const handle = (key: string, p: Point, onDown?: (e: React.PointerEvent) => void, color = '#16A34A', r = 5) => (
            <circle
                key={key}
                cx={p[0]}
                cy={p[1]}
                r={px(r)}
                fill="#fff"
                stroke={color}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
                onPointerDown={onDown}
                style={{ cursor: onDown ? (subMode === 'remove_vertex' ? 'not-allowed' : 'move') : 'default' }}
            />
        );

        // Borrador del polígono / camino en curso
        if (draft.length) {
            const preview = cursor ? [...draft, snap(cursor)] : draft;
            const pts = preview.map((p) => p.join(',')).join(' ');
            const color = tool === 'structure' ? '#1D4ED8' : tool === 'path' ? '#2563EB' : '#16A34A';
            nodes.push(
                tool === 'path' ? (
                    <polyline key="draft" points={pts} fill="none" stroke={color} strokeWidth={3} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
                ) : (
                    <polygon key="draft" points={pts} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
                ),
            );
            draft.forEach((p, i) => nodes.push(handle(`d${i}`, p, undefined, color, i === 0 && draft.length >= 3 ? 7 : 4)));
        }

        // Vértices editables del elemento seleccionado
        if (!preview && tool === 'select' && selection && selection.type !== 'location' && selection.type !== 'link') {
            const collection = collectionOf(selection.type)!;
            const item = (doc[collection] as Array<Polygonal | Path>).find((i) => i.id === selection.id);
            if (item) pointsOf(item).forEach((p, i) => nodes.push(handle(`v${i}`, p, onVertexPointerDown(collection, item.id, i), selection.type === 'path' ? '#2563EB' : '#16A34A')));
        }

        // Extremos enlazables (herramienta Enlace)
        if (tool === 'link') {
            doc.paths.forEach((path) =>
                (['start', 'end'] as const).forEach((end) => {
                    const p = end === 'start' ? path.points[0] : path.points[path.points.length - 1];
                    const active = linkStart?.pathId === path.id && linkStart.end === end;
                    nodes.push(handle(`e${path.id}${end}`, p, undefined, active ? '#E1251B' : '#7C3AED', active ? 8 : 6));
                }),
            );
        }

        // Medición
        if (measure.length) {
            const end = measure[1] ?? (cursor ? snap(cursor) : measure[0]);
            const mid: Point = [(measure[0][0] + end[0]) / 2, (measure[0][1] + end[1]) / 2];
            nodes.push(
                <g key="measure" pointerEvents="none">
                    <line x1={measure[0][0]} y1={measure[0][1]} x2={end[0]} y2={end[1]} stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                    <text x={mid[0]} y={mid[1] - px(10)} fontSize={px(13)} fontWeight={700} textAnchor="middle" fill="#92400E" stroke="#fff" strokeWidth={px(3)} paintOrder="stroke">
                        {round(distance(measure[0], end), 2)} {unit}
                    </text>
                </g>,
            );
        }

        return <g>{nodes}</g>;
    };

    /* ───────────────────── render ───────────────────── */

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError || !inamap) {
        return <Typography sx={{ p: 4 }}>{translate('ina_maps.editor.messages.load_error')}</Typography>;
    }

    const published = inamap.status === 'published';
    const selectedPolygon = selection && (selection.type === 'zone' || selection.type === 'structure') ? (selectedItem as Polygonal | null) : null;
    const zoomPct = fitScale ? Math.round((scale / fitScale) * 100) : 100;
    const hintKey = subMode !== 'none' ? subMode : tool === 'link' && linkStart ? 'link_second' : tool === 'zone' && allowZoneOverlap ? 'zone_overlap_allowed' : tool;
    const propertiesOpen = Boolean(selection && selectedItem && panel === 'editor' && !draft.length);

    const toolbarButton = (label: string, icon: React.ReactNode, onClick: () => void, active = false, disabled = false) => (
        <Tooltip key={label} title={label}>
            <span>
                <IconButton
                    size="small"
                    aria-label={label}
                    onClick={onClick}
                    disabled={disabled}
                    sx={{
                        width: 30,
                        height: 30,
                        border: '1px solid',
                        borderColor: active ? 'error.main' : 'divider',
                        borderRadius: 1,
                        color: active ? 'error.main' : 'text.primary',
                        bgcolor: active ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    {icon}
                </IconButton>
            </span>
        </Tooltip>
    );

    return (
        <Box
            sx={{
                position: 'relative',
                height: 'calc(100dvh - 96px)',
                minHeight: 520,
                minWidth: 0,
                overflow: 'hidden',
                color: '#1E293B',
                fontSize: 13,
                '& .MuiButton-root': { minHeight: 28, px: 1, py: 0.35, fontSize: 12, lineHeight: 1.2 },
                '& .MuiIconButton-root': { p: 0.5 },
                '& .MuiChip-root': { height: 23, fontSize: 11 },
                '& .MuiInputBase-root': { fontSize: 12 },
                '& .MuiSelect-select': { py: 0.5, fontSize: 12 },
                '& .MuiSvgIcon-root': { fontSize: 18 },
            }}
        >
            <EditorSidebar
                panel={panel}
                onPanel={(p) => {
                    setPanel(p);
                    if (p === 'layouts') setShowSwitcher(true);
                }}
                tool={tool}
                onTool={(t) => {
                    setTool(t);
                    setDraft([]);
                    setLinkStart(null);
                    setMeasure([]);
                    setSubMode('none');
                    setPreview(false);
                }}
                layers={layers}
                onLayer={(key: LayerKey, value) => setLayers((l) => ({ ...l, [key]: value }))}
            />

            {/* Barra superior: miga de pan, estado, deshacer, vista, guardar, publicar */}
            <Stack direction="row" spacing={1} sx={{ position: 'absolute', zIndex: 4, top: 8, left: 8, right: 8, minHeight: 40, alignItems: "center", flexWrap: 'wrap', rowGap: 0.5, px: 1, py: 0.5, color: 'text.primary', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: '0 4px 14px rgba(15,23,42,0.24)', backdropFilter: 'blur(12px)', '& .MuiTypography-root': { color: 'text.primary', fontSize: 13 }, '& .MuiSelect-select': { color: 'text.primary' }, '& .MuiIconButton-root': { color: 'text.primary' }, '& .MuiButton-root:not(.MuiButton-containedError)': { color: 'text.primary' }, '& .Mui-disabled': { opacity: 0.65, color: 'text.secondary' } }}>
                <Breadcrumbs separator="›" sx={{ flex: 1, minWidth: 220, color: 'text.primary' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{inamap.name}</Typography>
                    {layouts.length > 0 && (
                        <Select size="small" variant="standard" value={layoutId ?? ''} onChange={(e) => switchLayout(e.target.value as string)} disableUnderline sx={{ fontWeight: 700 }}>
                            {layouts.map((l) => (
                                <MenuItem key={l.id} value={l.id}>
                                    {l.name}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                </Breadcrumbs>
                <Chip size="small" label={translate(`ina_maps.editor.status.${published ? 'published' : 'draft'}`)} color={published ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                {dirty && <Chip size="small" color="warning" variant="outlined" label={translate('ina_maps.editor.status.unsaved')} sx={{ fontWeight: 600 }} />}
                <Tooltip title={translate('ina_maps.editor.actions.undo')}>
                    <span>
                        <IconButton size="small" onClick={undo} disabled={!canUndo} sx={{ color: '#475569', border: '1px solid #E2E8F0', borderRadius: 1.25 }}>
                            <UndoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={translate('ina_maps.editor.actions.redo')}>
                    <span>
                        <IconButton size="small" onClick={redo} disabled={!canRedo} sx={{ color: '#475569', border: '1px solid #E2E8F0', borderRadius: 1.25 }}>
                            <RedoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Select size="small" value={preview ? 'preview' : 'edit'} onChange={(e) => setPreview(e.target.value === 'preview')} sx={{ minWidth: 120, bgcolor: 'background.default', color: 'text.primary', borderRadius: 1, '& .MuiSelect-select': { color: 'text.primary' }, '& .MuiSvgIcon-root': { color: 'text.secondary' } }}>
                    <MenuItem value="edit">{translate('ina_maps.editor.view.edit')}</MenuItem>
                    <MenuItem value="preview">{translate('ina_maps.editor.view.preview')}</MenuItem>
                </Select>
                <Tooltip title={translate('ina_maps.editor.actions.save')}>
                    <span>
                        <IconButton aria-label={translate('ina_maps.editor.actions.save')} onClick={save} disabled={saving || !layoutId} size="small" sx={{ width: 30, height: 30, color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            {saving ? <CircularProgress size={15} /> : <SaveOutlinedIcon fontSize="small" />}
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={translate(`ina_maps.editor.actions.${published ? 'unpublish' : 'publish'}`)}>
                    <IconButton aria-label={translate(`ina_maps.editor.actions.${published ? 'unpublish' : 'publish'}`)} onClick={togglePublish} size="small" color="error" sx={{ width: 30, height: 30, borderRadius: 1 }}>
                        {published ? <UnpublishedOutlinedIcon fontSize="small" /> : <PublishIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Barra contextual de la herramienta */}
            {!preview && layout && (
                <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', zIndex: 4, top: 52, left: 8, right: 8, alignItems: "center", minHeight: 36, px: 1, py: 0.35, bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: '0 4px 14px rgba(15,23,42,0.24)', backdropFilter: 'blur(12px)', overflowX: 'auto', '& .MuiTypography-root': { color: 'text.primary', fontSize: 12 }, '& .MuiButton-root': { color: 'text.primary' }, '& .MuiIconButton-root': { color: 'text.primary' }, '& .MuiSelect-select': { color: 'text.primary' }, '& .Mui-disabled': { opacity: 0.65, color: 'text.secondary' } }}>
                        <Chip color="error" variant="outlined" label={translate(`ina_maps.editor.tools.${tool}`)} sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }} />
                    {(tool === 'select' && (selectedPolygon || selection?.type === 'path')) && (
                        <>
                            {toolbarButton(translate('ina_maps.editor.toolbar.add_vertex'), <AddCircleOutlineIcon />, () => setSubMode(subMode === 'add_vertex' ? 'none' : 'add_vertex'), subMode === 'add_vertex')}
                            {toolbarButton(translate('ina_maps.editor.toolbar.remove_vertex'), <RemoveCircleOutlineIcon />, () => setSubMode(subMode === 'remove_vertex' ? 'none' : 'remove_vertex'), subMode === 'remove_vertex')}
                        </>
                    )}
                    {DRAWING_TOOLS.includes(tool) && (
                        <>
                            {toolbarButton(
                                translate(tool === 'path' ? 'ina_maps.editor.toolbar.finish_path' : 'ina_maps.editor.toolbar.close_polygon'),
                                <CheckIcon />,
                                closeDraft,
                                false,
                                draft.length < (tool === 'path' ? 2 : 3),
                            )}
                            {toolbarButton(translate('ina_maps.editor.toolbar.cancel'), <CloseIcon />, () => setDraft([]), false, draft.length === 0)}
                        </>
                    )}
                    {selectedPolygon && (
                        <>
                            <Divider orientation="vertical" flexItem />
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                {translate('ina_maps.editor.toolbar.fill_color')}
                            </Typography>
                            <input
                                type="color"
                                value={selectedPolygon.color ?? DEFAULT_COLORS[selection!.type as 'zone'].fill}
                                onFocus={beginChange}
                                onChange={(e) => patchItem(collectionOf(selection!.type)!, selectedPolygon.id, { color: e.target.value.toUpperCase() })}
                                style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer' }}
                            />
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                {translate('ina_maps.editor.toolbar.opacity')}
                            </Typography>
                            <Slider
                                size="small"
                                sx={{ width: 84 }}
                                color="error"
                                min={5}
                                max={100}
                                value={Math.round(((selectedPolygon.metadata?.style as { opacity?: number } | undefined)?.opacity ?? DEFAULT_COLORS[selection!.type as 'zone'].opacity) * 100)}
                                onMouseDown={beginChange}
                                onChange={(_, v) =>
                                    patchItem(collectionOf(selection!.type)!, selectedPolygon.id, {
                                        metadata: { ...(selectedPolygon.metadata ?? {}), style: { ...((selectedPolygon.metadata?.style as object) ?? {}), opacity: (v as number) / 100 } },
                                    })
                                }
                            />
                        </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5, flex: 1, minWidth: 100, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {translate(`ina_maps.editor.hints.${hintKey}`)}
                    </Typography>
                </Stack>
            )}

            {/* Canvas */}
            <Box sx={{ position: 'absolute', zIndex: 1, inset: 0, overflow: 'hidden', bgcolor: 'transparent' }}>
                {layout ? (
                    <MapCanvas
                        ref={canvasRef}
                        layout={layout}
                        content={content}
                        allPaths={mergedPaths}
                        layoutNames={layoutNames}
                        categories={categories}
                        layers={preview ? { ...layers, paths: false, links: false, grid: false } : layers}
                        gridStep={gridStep}
                        unit={unit}
                        selection={selection}
                        conflicts={conflicts}
                        route={routeHere}
                        panOnDrag={preview || tool === 'select'}
                        cursor={tool === 'select' ? undefined : 'crosshair'}
                        onElementClick={onElementClick}
                        onBackgroundPointerDown={onBackgroundPointerDown}
                        onPointerMoveWorld={onPointerMoveWorld}
                        onPointerUpWorld={onPointerUpWorld}
                        onDoubleClickWorld={() => DRAWING_TOOLS.includes(tool) && draft.length && closeDraft()}
                        onViewChange={(v) => {
                            setScale(v.scale);
                            setFitScale((f) => f ?? v.scale);
                        }}
                        renderOverlay={renderOverlay}
                        controlsBottom={76}
                        scaleBarBottom={66}
                        height="100%"
                    />
                ) : (
                    <Stack spacing={2} sx={{ alignItems: "center", justifyContent: "center", height: '100%', bgcolor: 'transparent', color: 'text.primary' }}>
                        <Typography color="text.secondary">{translate('ina_maps.editor.layouts.empty')}</Typography>
                        <Button variant="contained" color="error" startIcon={<LayersOutlinedIcon />} onClick={() => setPanel('layouts')}>
                            {translate('ina_maps.editor.layouts.new')}
                        </Button>
                    </Stack>
                )}

                {layout && showSwitcher && layouts.length > 0 && (
                    <LayoutSwitcher layouts={layouts} currentId={layoutId} onSelect={switchLayout} onClose={() => setShowSwitcher(false)} />
                )}
            </Box>

            {/* Barra de estado */}
            <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', zIndex: 4, bottom: 8, left: 8, right: 8, height: 42, minHeight: 42, maxHeight: 42, boxSizing: 'border-box', display: 'flex', alignItems: 'center', px: 0.75, py: 0, bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: '0 4px 14px rgba(15,23,42,0.24)', backdropFilter: 'blur(12px)', flexWrap: 'nowrap', overflow: 'hidden', whiteSpace: 'nowrap', '& > *:not(.MuiDivider-root)': { flexShrink: 0, alignSelf: 'center' }, '& .MuiDivider-root': { alignSelf: 'stretch' }, '& .MuiTypography-root': { color: 'text.primary', fontSize: 11 }, '& .MuiButton-root': { color: 'text.primary' }, '& .MuiSelect-select': { color: 'text.primary' }, '& .Mui-disabled': { opacity: 0.65, color: 'text.secondary' } }}>
                <Stack direction="row" spacing={0.25} sx={{ height: 28, alignItems: 'center', alignSelf: 'center' }}>
                    <Tooltip title={translate('ina_maps.editor.statusbar.zoom')}>
                        <Box sx={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ZoomInMapIcon sx={{ display: 'block', verticalAlign: 'middle', fontSize: 16, color: 'text.secondary' }} />
                        </Box>
                    </Tooltip>
                    <Select
                        size="small"
                        sx={{ minWidth: 60, '& .MuiSelect-select': { px: 0.5 } }}
                        value={ZOOM_STEPS.includes(zoomPct) ? zoomPct : ''}
                        displayEmpty
                        renderValue={() => `${zoomPct}%`}
                        onChange={(e) => {
                            if (!layout || !fitScale) return;
                            const center: Point = cursor ?? [layout.width / 2, layout.height / 2];
                            canvasRef.current?.centerOn(center, (fitScale * Number(e.target.value)) / 100);
                        }}
                    >
                        {ZOOM_STEPS.map((z) => (
                            <MenuItem key={z} value={z}>
                                {z}%
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
                <Stack spacing={0} sx={{ height: '100%', flexShrink: 0, justifyContent: 'center', alignSelf: 'center', lineHeight: 1.1 }}>
                    <Typography variant="body2" sx={{ fontSize: 9, lineHeight: 1.2 }} title={`X: ${cursor ? round(cursor[0], 1) : '–'} ${unit}`}>
                        X {cursor ? round(cursor[0], 1) : '–'}{unit}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 9, lineHeight: 1.2 }} title={`Y: ${cursor ? round(cursor[1], 1) : '–'} ${unit}`}>
                        Y {cursor ? round(cursor[1], 1) : '–'}{unit}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.25} sx={{ height: 28, alignItems: 'center', alignSelf: 'center' }}>
                    <Tooltip title={translate('ina_maps.editor.statusbar.grid')}>
                        <Box sx={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GridOnIcon sx={{ display: 'block', verticalAlign: 'middle', fontSize: 16, color: 'text.secondary' }} />
                        </Box>
                    </Tooltip>
                    <Select size="small" sx={{ minWidth: 60, '& .MuiSelect-select': { px: 0.5 } }} value={gridStep} onChange={(e) => setGridStep(Number(e.target.value))}>
                        {GRID_STEPS.map((g) => (
                            <MenuItem key={g} value={g}>
                                {g} {unit}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
                <Stack direction="row" spacing={0.25} sx={{ height: 28, alignItems: 'center', alignSelf: 'center' }}>
                    <Tooltip title={translate('ina_maps.editor.statusbar.snap')}>
                        <Box sx={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MyLocationIcon sx={{ display: 'block', verticalAlign: 'middle', fontSize: 15, color: 'text.secondary' }} />
                        </Box>
                    </Tooltip>
                    <Chip
                        size="small"
                        clickable
                        onClick={() => setSnapOn(!snapOn)}
                        color={snapOn ? 'error' : 'default'}
                        variant="filled"
                        label={translate(`ina_maps.editor.statusbar.${snapOn ? 'on' : 'off'}`)}
                        sx={{
                            height: 22,
                            alignSelf: 'center',
                            fontWeight: 700,
                            color: snapOn ? '#FFFFFF' : 'text.primary',
                            bgcolor: snapOn ? 'error.main' : 'action.selected',
                            '&:hover': { bgcolor: snapOn ? 'error.dark' : 'action.hover' },
                        }}
                    />
                </Stack>
                <Divider orientation="vertical" flexItem />
                <Tooltip title={connectivity
                    ? connectivity.ok
                        ? translate('ina_maps.editor.statusbar.connectivity_ok')
                        : translate('ina_maps.editor.statusbar.connectivity_issues', { count: connectivity.unreachable_locations.length + connectivity.isolated_path_ids.length })
                    : translate('ina_maps.editor.statusbar.connectivity_unknown')}>
                    <IconButton size="small" aria-label={translate('ina_maps.editor.actions.check_connectivity')} onClick={checkConnectivity} disabled={checking} sx={{ width: 28, height: 28, alignSelf: 'center' }}>
                        {checking ? (
                            <CircularProgress size={14} />
                        ) : (
                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                                <AccountTreeIcon sx={{ fontSize: 17 }} />
                                <Box sx={{ position: 'absolute', width: 6, height: 6, right: -1, bottom: -1, borderRadius: '50%', border: '1px solid', borderColor: 'background.paper', bgcolor: connectivity ? (connectivity.ok ? 'success.main' : 'warning.main') : 'grey.500' }} />
                            </Box>
                        )}
                    </IconButton>
                </Tooltip>
                {routePreview && (
                    <IconButton size="small" onClick={() => setRoutePreview(null)} title={translate('ina_maps.editor.toolbar.cancel')}>
                        <RestartAltIcon fontSize="small" />
                    </IconButton>
                )}
                <Tooltip title={translate('ina_maps.editor.actions.test_route')}>
                    <span style={{ display: 'flex', alignItems: 'center' }}><IconButton size="small" aria-label={translate('ina_maps.editor.actions.test_route')} onClick={() => setRouteDialog(true)} disabled={!layouts.length} sx={{ width: 28, height: 28, alignSelf: 'center' }}><PlayArrowIcon fontSize="small" /></IconButton></span>
                </Tooltip>
            </Stack>

            {/* Propiedades: drawer derecho persistente (el canvas sigue usable) */}
            <Drawer
                anchor="right"
                variant="persistent"
                open={propertiesOpen}
                slotProps={{ paper: { sx: { ...DRAWER_PAPER, width: { xs: '100vw', sm: 320, lg: 330 }, p: 2, overflowY: 'auto', bgcolor: 'background.paper', color: 'text.primary', borderLeft: '1px solid', borderColor: 'divider', boxShadow: '-12px 0 32px rgba(15,23,42,0.32)', zIndex: 1250 } } }}
            >
                {propertiesOpen && selection && selectedItem && renderProperties()}
            </Drawer>

            <LayoutsDrawer
                open={panel === 'layouts'}
                onClose={() => setPanel('editor')}
                inamapId={inamap.id}
                layouts={layouts}
                unit={unit}
                api={api}
                currentId={layoutId}
                onSelect={switchLayout}
                onChanged={(selectId) => reloadInamap(selectId).then(() => layoutId && selectId === layoutId && loadGeometry(layoutId))}
            />

            {(panel === 'info' || panel === 'settings') && (
                <SettingsDrawer
                    open
                    section={panel}
                    onClose={() => setPanel('editor')}
                    inamap={inamap}
                    layouts={layouts}
                    api={api}
                    onSaved={(saved) => setInamap((current) => ({ ...current!, ...saved, layouts: current?.layouts }))}
                />
            )}

            <LinkTypeDialog
                open={Boolean(pendingVertical)}
                onCancel={() => {
                    setPendingVertical(null);
                    setLinkStart(null);
                }}
                onConfirm={(type) => {
                    const pending = pendingVertical!;
                    setPendingVertical(null);
                    createLink(pending.from, pending.to, type);
                }}
            />

            <RouteTestDialog open={routeDialog} onClose={() => setRouteDialog(false)} inamapId={inamap.id} layouts={layouts} api={api} onRoute={setRoutePreview} />
        </Box>
    );

    function renderProperties() {
        const close = () => setSelection(null);
        const common = { unit, onClose: close, beginChange };

        if (selection!.type === 'link') {
            const link = selectedItem as PathLink;
            return (
                <PropertiesPanel
                    kind="link"
                    item={link}
                    {...common}
                    onChange={(patch) => {
                        setLinks((list) => list.map((l) => (l.id === link.id ? { ...l, ...patch } : l)));
                        api.updateLink(link.id, { ...link, ...patch }).catch((e) => notify(apiErrorMessage(e), { type: 'error' }));
                    }}
                    onDelete={() => {
                        if (!window.confirm(translate('ina_maps.editor.messages.confirm_delete'))) return;
                        api.deleteLink(link.id)
                            .then(reloadLinks)
                            .then(close)
                            .catch((e) => notify(apiErrorMessage(e), { type: 'error' }));
                    }}
                />
            );
        }

        const collection = collectionOf(selection!.type)!;
        const onDelete = () => removeItem(collection, selection!.id);

        if (selection!.type === 'location') {
            const location = selectedItem as EditorDoc['locations'][number];
            return (
                <PropertiesPanel
                    kind="location"
                    item={location}
                    categories={categories}
                    structures={doc.structures}
                    {...common}
                    onChange={(patch) => patchItem('locations', location.id, patch)}
                    onDelete={onDelete}
                    onDownloadQr={isTmpId(location.id) ? undefined : () => downloadQr(location.id, location.code || location.label)}
                />
            );
        }

        if (selection!.type === 'path') {
            const path = selectedItem as Path;
            return <PropertiesPanel kind="path" item={path} {...common} onChange={(patch) => patchItem('paths', path.id, patch)} onDelete={onDelete} />;
        }

        const shape = selectedItem as Polygonal;
        return (
            <PropertiesPanel
                kind={selection!.type as 'zone' | 'structure'}
                item={shape}
                {...common}
                onChange={(patch) => patchItem(collection, shape.id, patch)}
                onDelete={onDelete}
            />
        );
    }
};

export default InamapEditor;
