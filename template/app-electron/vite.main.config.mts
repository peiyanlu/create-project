import { defineConfig } from 'vite'
import pkg from './package.json'


declare global {
  const APP_NAME: string
  const APP_VERSION: string
}

export default defineConfig({
  publicDir: 'resources',
  define: {
    APP_NAME: JSON.stringify(pkg.productName),
    APP_VERSION: JSON.stringify(`v${ pkg.version }`),
  },
  build: {
    license: true,
    copyPublicDir: true,
  },
  plugins: [
  
  ],
})
