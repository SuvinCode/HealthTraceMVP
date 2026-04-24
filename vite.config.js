import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
  ],
  server: {
    open: true, // Automatically opens the browser
    host: 'localhost', // Ensures the server runs on localhost
    port: 3000, // Default port
  },
});