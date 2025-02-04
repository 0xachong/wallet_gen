import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    worker: {
        format: 'es',
        plugins: []
    },
    server: {
        host: true,
        port: 3001,
        strictPort: true,
        open: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    }
}); 