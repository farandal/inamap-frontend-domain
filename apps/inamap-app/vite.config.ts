import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// En desarrollo, ina-viewer se resuelve a su código fuente (sin compilar el paquete).
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        resolve: {
            alias: mode === 'production' ? [] : [{ find: /^ina-viewer$/, replacement: path.resolve(__dirname, '../../packages/ina-viewer/src/index.ts') }],
        },
        server: { port: Number(env.VITE_DEV_PORT || 5180), host: '0.0.0.0' },
        preview: { port: Number(env.VITE_DEV_PORT || 5180) },
    };
});
