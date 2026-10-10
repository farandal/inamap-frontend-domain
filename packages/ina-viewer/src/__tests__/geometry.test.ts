import { describe, expect, it } from 'vitest';
import { area, centroid, isSimplePolygon, perimeter, polygonsOverlap, snapToGrid } from '../geometry';
import { readTokenFromHash } from '../api/publicClient';
import type { Point } from '../types';

const square = (x: number, y: number, s: number): Point[] => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];

describe('geometry', () => {
    it('computes area, perimeter and centroid', () => {
        expect(area(square(0, 0, 10))).toBe(100);
        expect(perimeter(square(0, 0, 10))).toBe(40);
        expect(centroid(square(0, 0, 10))).toEqual([5, 5]);
    });

    it('detects overlaps like the backend (shared edges are allowed)', () => {
        expect(polygonsOverlap(square(0, 0, 10), square(5, 5, 10))).toBe(true);
        expect(polygonsOverlap(square(0, 0, 10), square(10, 0, 10))).toBe(false);
        expect(polygonsOverlap(square(0, 0, 10), square(2, 2, 3))).toBe(true);
        expect(polygonsOverlap(square(0, 0, 10), square(0, 0, 10))).toBe(true);
        expect(polygonsOverlap([[0, 4], [10, 4], [10, 6], [0, 6]], [[4, 0], [6, 0], [6, 10], [4, 10]])).toBe(true);
    });

    it('rejects self-intersecting polygons', () => {
        expect(isSimplePolygon([[0, 0], [10, 10], [10, 0], [0, 10]])).toBe(false);
        expect(isSimplePolygon(square(0, 0, 4))).toBe(true);
    });

    it('snaps to the grid', () => {
        expect(snapToGrid([1.26, 3.74], 0.5)).toEqual([1.5, 3.5]);
    });

    it('reads the session token from the URL fragment', () => {
        expect(readTokenFromHash('#t=abc-123')).toBe('abc-123');
        expect(readTokenFromHash('#x=1&t=zz')).toBe('zz');
        expect(readTokenFromHash('')).toBeNull();
    });
});
