import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /*
         * Split the heavy third-party libraries into their own chunks so a
         * change to application code does not invalidate all of them, and so
         * the lazily loaded views can pull them in independently.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) {
            return undefined
          }
          if (id.includes('motion') || id.includes('framer')) {
            return 'motion'
          }
          if (id.includes('@dnd-kit')) {
            return 'dnd-kit'
          }
          if (id.includes('@radix-ui')) {
            return 'radix'
          }
          return undefined
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
  },
})
