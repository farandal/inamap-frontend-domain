import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { InamapViewer, viewerStringsEn, viewerStringsEs } from 'ina-viewer';
import Start from './Start';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:25200/api';
/**
 * Español por defecto, sin importar el idioma del dispositivo: los quioscos y
 * celulares de los visitantes suelen venir en inglés de fábrica. Otro idioma se
 * pide explícitamente con `?lang=en` (o `?lang=es`).
 */
const locale = new URLSearchParams(window.location.search).get('lang')?.toLowerCase().startsWith('en') ? 'en' : 'es';
const strings = locale === 'en' ? viewerStringsEn : viewerStringsEs;

/**
 * /inamap/:id — el token de sesión (si lo hay) llega en el fragmento #t=.
 * /embed/:id — el mismo visor para un iframe: el panel parte cerrado.
 */
function ViewerRoute({ embedded = false }: { embedded?: boolean }) {
    const { id } = useParams();
    const [search] = useSearchParams();
    if (!id) return <Navigate to="/" replace />;
    return (
        <InamapViewer
            apiUrl={API_URL}
            inamapId={id}
            focusLocationId={search.get('location')}
            toRef={search.get('to')}
            fromRef={search.get('from')}
            accessibleRoute={search.get('accessible') === '1'}
            strings={strings}
            locale={locale}
            embedded={embedded}
        />
    );
}

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/inamap/:id" element={<ViewerRoute />} />
                <Route path="/embed/:id" element={<ViewerRoute embedded />} />
                <Route path="*" element={<Start />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
);
