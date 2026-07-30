import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Emits dist/.vite/manifest.json mapping source entries to hashed output files,
    // so scripts/inject-sw-assets.mjs can teach the service worker the real bundle paths.
    manifest: true,
  },
})
