import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: '/easyunitex/',

  build: {
    outDir: 'dist',

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'chartjs';
            if (id.includes('mathjs')) return 'mathjs';
            if (id.includes('framer-motion')) return 'framer';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
