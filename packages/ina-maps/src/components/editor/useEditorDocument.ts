import { useCallback, useRef, useState } from 'react';
import { EditorDoc, EMPTY_DOC } from './types';

const LIMIT = 100;

/**
 * Documento del layout con historial deshacer/rehacer.
 *
 * - `update(fn)` registra un paso en el historial (acciones discretas).
 * - `beginChange()` + `updateSilently(fn)` para gestos continuos (arrastrar
 *   un vértice, escribir en un campo): un solo paso por gesto.
 */
export function useEditorDocument() {
    const [doc, setDoc] = useState<EditorDoc>(EMPTY_DOC);
    const [savedDoc, setSavedDoc] = useState<EditorDoc>(EMPTY_DOC);
    const past = useRef<EditorDoc[]>([]);
    const future = useRef<EditorDoc[]>([]);
    const docRef = useRef(doc);
    docRef.current = doc;
    const [, force] = useState(0);

    const remember = useCallback(() => {
        past.current.push(docRef.current);
        if (past.current.length > LIMIT) past.current.shift();
        future.current = [];
        force((n) => n + 1);
    }, []);

    const update = useCallback(
        (fn: (d: EditorDoc) => EditorDoc) => {
            remember();
            setDoc((d) => fn(d));
        },
        [remember],
    );

    const updateSilently = useCallback((fn: (d: EditorDoc) => EditorDoc) => setDoc((d) => fn(d)), []);

    const undo = useCallback(() => {
        const prev = past.current.pop();
        if (!prev) return;
        future.current.push(docRef.current);
        setDoc(prev);
        force((n) => n + 1);
    }, []);

    const redo = useCallback(() => {
        const next = future.current.pop();
        if (!next) return;
        past.current.push(docRef.current);
        setDoc(next);
        force((n) => n + 1);
    }, []);

    const reset = useCallback((next: EditorDoc) => {
        past.current = [];
        future.current = [];
        setDoc(next);
        setSavedDoc(next);
        force((n) => n + 1);
    }, []);

    return {
        doc,
        update,
        updateSilently,
        beginChange: remember,
        undo,
        redo,
        reset,
        canUndo: past.current.length > 0,
        canRedo: future.current.length > 0,
        dirty: doc !== savedDoc,
    };
}
