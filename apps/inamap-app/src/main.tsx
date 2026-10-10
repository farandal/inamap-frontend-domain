import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { InamapViewer, viewerStringsEn, viewerStringsEs } from 'ina-viewer';
import Start from './Start';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:25200/api';
const locale = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
const strings = locale === 'en' ? viewerStringsEn : viewerStringsEs;

/** /inamap/:id — el token de sesión (si lo hay) llega en el fragmento #t=. */
function ViewerRoute() {
    const { id } = useParams();
    const [search] = useSearchParams();
    if (!id) return <Navigate to="/" replace />;
    return <InamapViewer apiUrl={API_URL} inamapId={id} focusLocationId={search.get('location')} strings={strings} locale={locale} />;
}

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/inamap/:id" element={<ViewerRoute />} />
                <Route path="/embed/:id" element={<ViewerRoute />} />
                <Route path="*" element={<Start />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
);
