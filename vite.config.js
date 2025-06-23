import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Set base URL for GitHub Pages (root domain)
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@pinecone-database/pinecone']
  }
})
