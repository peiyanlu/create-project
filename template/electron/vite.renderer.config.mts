import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import pkg from './package.json'


// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    license: true,
  },
  plugins: [
    createHtmlPlugin({
      inject: {
        data: {
          name: `${ pkg.productName }`,
          version: `v${ pkg.version }`,
        },
      },
    }),
  ],
})
