import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// La app se distribuye como un único HTML autocontenido.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4096,
  },
})
