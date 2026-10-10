import React, { useEffect, useRef, useState } from 'react';
import type { PublicClient } from '../api/publicClient';
import type { SearchHit } from '../types';
import type { ViewerStrings } from '../i18n/viewerStrings';

/**
 * Autocompletado difuso contra GET api/inamap/search (zonas, estructuras y
 * ubicaciones de cualquier piso).
 */
export interface SearchBoxProps {
    client: PublicClient;
    inamapId: string;
    value: SearchHit | null;
    onChange: (hit: SearchHit | null) => void;
    label: string;
    marker: string;
    category?: string | null;
    layoutNames: Record<string, string>;
    strings: ViewerStrings;
}

const TYPE_COLOR: Record<string, string> = { zone: '#16a34a', structure: '#2563eb', location: '#E1251B' };

export function SearchBox({ client, inamapId, value, onChange, label, marker, category, layoutNames, strings }: SearchBoxProps) {
    const [query, setQuery] = useState(value?.label ?? '');
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const requestId = useRef(0);

    useEffect(() => setQuery(value?.label ?? ''), [value]);

    useEffect(() => {
        if (!open) return;
        const term = query.trim();
        if (term.length < 2 && !category) {
            setHits([]);
            return;
        }
        const id = ++requestId.current;
        setLoading(true);
        const timer = setTimeout(() => {
            client
                .search(inamapId, term, { category: category ?? undefined, limit: 12 })
                .then((result) => id === requestId.current && setHits(result))
                .catch(() => id === requestId.current && setHits([]))
                .finally(() => id === requestId.current && setLoading(false));
        }, 220);
        return () => clearTimeout(timer);
    }, [query, open, category, client, inamapId]);

    return (
        <div style={{ position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--viewer-input, #fff)', color: 'var(--viewer-text, #111827)', border: '1px solid var(--viewer-border, #d1d5db)', borderRadius: 10, padding: '8px 10px' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: marker, flexShrink: 0 }} aria-hidden />
                <span style={{ fontSize: 12, color: 'var(--viewer-muted, #6b7280)', width: 52, flexShrink: 0 }}>{label}</span>
                <input
                    value={query}
                    placeholder={strings.searchPlaceholder}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (value) onChange(null);
                    }}
                    style={{ border: 'none', outline: 'none', fontSize: 15, flex: 1, minWidth: 0, background: 'transparent', color: 'var(--viewer-text, #111827)' }}
                />
                {value && (
                    <button type="button" onClick={() => onChange(null)} aria-label={strings.clear} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
                        ×
                    </button>
                )}
            </label>
            {open && (query.trim().length >= 2 || category) && (
                <ul
                    role="listbox"
                    style={{
                        position: 'absolute',
                        zIndex: 20,
                        left: 0,
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        listStyle: 'none',
                        padding: 4,
                        background: 'var(--viewer-panel, #fff)',
                        color: 'var(--viewer-text, #111827)',
                        border: '1px solid var(--viewer-border, #d1d5db)',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                        maxHeight: 280,
                        overflowY: 'auto',
                    }}
                >
                    {loading && hits.length === 0 && <li style={{ padding: 10, color: 'var(--viewer-muted, #6b7280)', fontSize: 14 }}>{strings.loading}</li>}
                    {!loading && hits.length === 0 && <li style={{ padding: 10, color: 'var(--viewer-muted, #6b7280)', fontSize: 14 }}>{strings.noResults}</li>}
                    {hits.map((hit) => (
                        <li
                            key={`${hit.type}:${hit.id}`}
                            role="option"
                            aria-selected={value?.id === hit.id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(hit);
                                setOpen(false);
                            }}
                            style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--viewer-hover, #f3f4f6)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[hit.type] }} />
                            <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--viewer-text, #111827)' }}>{hit.label}</span>
                                <span style={{ fontSize: 12, color: 'var(--viewer-muted, #6b7280)' }}>
                                    {strings.types[hit.type]}
                                    {hit.code ? ` · ${hit.code}` : ''}
                                    {layoutNames[hit.layout_id] ? ` · ${layoutNames[hit.layout_id]}` : ''}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchBox;
