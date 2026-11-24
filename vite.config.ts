import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { BRAND, brandInitial } from './src/config/brand.ts'

/** Los colores siguen viviendo solo en tokens.css; aquí solo se leen. */
const tokens = readFileSync(new URL('./src/styles/tokens.css', import.meta.url), 'utf8')
const primaryOf = (theme: 'light' | 'dark'): string => {
  const block = theme === 'light'
    ? tokens.slice(0, tokens.indexOf('.dark'))
    : tokens.slice(tokens.indexOf('.dark'))
  const value = /--primary:\s*(#[0-9a-fA-F]{3,8})/.exec(block)?.[1]
  if (!value) throw new Error(`Falta --primary en tokens.css para el tema ${theme}`)
  return value
}

/** Inyecta la marca en el HTML sin duplicar el nombre en index.html. */
const brandHtml = (): Plugin => ({
  name: 'brand-html',
  transformIndexHtml: (html) => {
    const escape = (value: string): string => value
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;')
    const values: Record<string, string> = {
      '__BRAND_NAME__': escape(BRAND.name),
      '__BRAND_SHORT_NAME__': escape(BRAND.shortName),
      '__BRAND_TAGLINE__': escape(BRAND.tagline),
      '__BRAND_DESCRIPTION__': escape(`${BRAND.name}: ${BRAND.tagline} Explora el catálogo, haz tu pedido y recibe o retira en tienda.`),
      '__BRAND_THEME_KEY__': BRAND.themeKey,
      '__BRAND_INITIAL__': escape(brandInitial()),
      '__BRAND_THEME_LIGHT__': primaryOf('light'),
      '__BRAND_THEME_DARK__': primaryOf('dark'),
    }
    return Object.entries(values).reduce(
      (source, [placeholder, value]) => source.replaceAll(placeholder, value), html,
    )
  },
})

// La app se distribuye como un único HTML autocontenido.
// https://vite.dev/config/
export default defineConfig({
  plugins: [brandHtml(), react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4096,
  },
})
