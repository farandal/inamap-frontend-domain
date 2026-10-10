import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Portada mínima: los visitantes normalmente llegan por un enlace o un QR. */
export default function Start() {
    const navigate = useNavigate();
    const [value, setValue] = useState('');
    const id = value.trim().split('/inamap/').pop()?.split(/[?#]/)[0] ?? '';

    return (
        <main style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
                <svg width="64" height="64" viewBox="0 0 16 16" aria-hidden>
                    <path d="M8 0.8C5.1 0.8 2.8 3.1 2.8 5.9 2.8 9.9 8 15.2 8 15.2s5.2-5.3 5.2-9.3C13.2 3.1 10.9 0.8 8 0.8z" fill="#E1251B" />
                    <circle cx="8" cy="5.9" r="2" fill="#fff" />
                </svg>
                <h1 style={{ fontSize: 32, margin: '12px 0 4px', letterSpacing: 2 }}>
                    INA<span style={{ color: '#E1251B' }}>MAP</span>
                </h1>
                <p style={{ color: '#cbd5e1' }}>Escanee el código QR del recinto o pegue aquí el enlace del mapa.</p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (id) navigate(`/inamap/${id}`);
                    }}
                    style={{ display: 'flex', gap: 8, marginTop: 16 }}
                >
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enlace o identificador del mapa"
                        style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: 'none', fontSize: 15 }}
                    />
                    <button type="submit" style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: '#E1251B', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                        Abrir
                    </button>
                </form>
            </div>
        </main>
    );
}
