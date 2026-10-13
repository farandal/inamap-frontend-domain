import { describe, expect, it } from 'vitest';
import { viewerStringsEn, viewerStringsEs } from '../i18n/viewerStrings';

const keys = (o: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe('viewer strings', () => {
    it('Spanish and English define exactly the same keys', () => {
        expect(keys(viewerStringsEn).sort()).toEqual(keys(viewerStringsEs).sort());
    });

    it('no string is left empty in either language', () => {
        for (const dictionary of [viewerStringsEs, viewerStringsEn]) {
            for (const key of keys(dictionary)) {
                const value = key.split('.').reduce<any>((o, k) => o[k], dictionary);
                expect(String(value).trim(), key).not.toBe('');
            }
        }
    });
});
