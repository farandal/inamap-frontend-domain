import type { Point } from './types';

/**
 * Geometría plana del cliente. La validación autoritativa es la del servidor
 * (PolygonService); esto da retroalimentación inmediata en el editor.
 */

export const distance = (a: Point, b: Point): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function signedArea(polygon: Point[]): number {
    let sum = 0;
    for (let i = 0; i < polygon.length; i++) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % polygon.length];
        sum += x1 * y2 - x2 * y1;
    }
    return sum / 2;
}

export const area = (polygon: Point[]): number => Math.abs(signedArea(polygon));

export function perimeter(polygon: Point[]): number {
    let total = 0;
    for (let i = 0; i < polygon.length; i++) {
        total += distance(polygon[i], polygon[(i + 1) % polygon.length]);
    }
    return total;
}

export function polylineLength(points: Point[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
    return total;
}

export function centroid(polygon: Point[]): Point {
    const a = signedArea(polygon);
    if (Math.abs(a) < 1e-9) {
        const n = Math.max(polygon.length, 1);
        return [polygon.reduce((s, p) => s + p[0], 0) / n, polygon.reduce((s, p) => s + p[1], 0) / n];
    }
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < polygon.length; i++) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % polygon.length];
        const cross = x1 * y2 - x2 * y1;
        cx += (x1 + x2) * cross;
        cy += (y1 + y2) * cross;
    }
    return [cx / (6 * a), cy / (6 * a)];
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
    const [px, py] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi) inside = !inside;
    }
    return inside;
}

/** Proyección de p sobre el segmento a-b: [punto, t ∈ [0,1], distancia]. */
export function projectOnSegment(p: Point, a: Point, b: Point): [Point, number, number] {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const q: Point = [a[0] + t * dx, a[1] + t * dy];
    return [q, t, distance(p, q)];
}

const orientation = (a: Point, b: Point, c: Point): number => {
    const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1;
};

/** Cruce en un punto interior de ambos segmentos (sin contar contacto). */
export const segmentsCrossProperly = (p1: Point, p2: Point, q1: Point, q2: Point): boolean =>
    orientation(q1, q2, p1) * orientation(q1, q2, p2) < 0 && orientation(p1, p2, q1) * orientation(p1, p2, q2) < 0;

/** Polígono válido: ≥ 3 vértices, área no nula, sin autointersecciones. */
export function isSimplePolygon(polygon: Point[]): boolean {
    const n = polygon.length;
    if (n < 3 || area(polygon) < 1e-9) return false;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (j === i + 1 || (i === 0 && j === n - 1)) continue;
            if (segmentsCrossProperly(polygon[i], polygon[(i + 1) % n], polygon[j], polygon[(j + 1) % n])) return false;
        }
    }
    return true;
}

/**
 * ¿Se solapan los interiores? Compartir borde o vértice no cuenta (misma
 * regla que el backend para zonas).
 */
export function polygonsOverlap(a: Point[], b: Point[]): boolean {
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            if (segmentsCrossProperly(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
        }
    }
    const strictlyInside = (p: Point, poly: Point[]) => pointInPolygon(p, poly) && distanceToBoundary(p, poly) > 1e-7;
    const probes = (poly: Point[]): Point[] => [
        ...poly,
        ...poly.map((p, i) => {
            const q = poly[(i + 1) % poly.length];
            return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as Point;
        }),
        centroid(poly),
    ];
    return probes(a).some((p) => strictlyInside(p, b)) || probes(b).some((p) => strictlyInside(p, a));
}

export function distanceToBoundary(p: Point, polygon: Point[]): number {
    let min = Infinity;
    for (let i = 0; i < polygon.length; i++) {
        min = Math.min(min, projectOnSegment(p, polygon[i], polygon[(i + 1) % polygon.length])[2]);
    }
    return min;
}

/** Ajusta un punto a la grilla (paso en la unidad del inamap). */
export const snapToGrid = (p: Point, step: number): Point =>
    step > 0 ? [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step] : p;

export const round = (value: number, decimals = 2): number => {
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
};

export const roundPoint = (p: Point, decimals = 3): Point => [round(p[0], decimals), round(p[1], decimals)];

/** Formatea segundos como "4 min" / "45 s". */
export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export const formatDistance = (value: number, unit = 'm'): string =>
    value >= 1000 && unit === 'm' ? `${round(value / 1000, 2)} km` : `${Math.round(value)} ${unit}`;
