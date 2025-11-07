import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        strictPort: true,
        allowedHosts: true as const,
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'Kinderhaus St. Wolfgang',
            short_name: 'Elternportal',
            description: 'Elternportal für das Kinderhaus St. Wolfgang',
            theme_color: '#0891b2',
            background_color: '#f3f4f6',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'logo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});