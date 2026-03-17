import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './frontend/routes',
      generatedRouteTree: './frontend/routeTree.gen.ts',
    }),
    react(),
    cloudflare(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@frontend': path.resolve(__dirname, './frontend'),
      '@backend': path.resolve(__dirname, './backend'),
    },
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-tanstack': [
                '@tanstack/react-router',
                '@tanstack/react-query',
                '@tanstack/react-form',
              ],
              'vendor-ui': [
                'radix-ui',
                'lucide-react',
                'next-themes',
                'sonner',
              ],
            },
          },
        },
      },
    },
  },
})
