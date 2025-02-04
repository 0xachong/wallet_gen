import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills()
    ],
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
    },
    define: {
        global: 'globalThis'
    }
}); 