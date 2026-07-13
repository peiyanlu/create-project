import { join, resolve } from 'path'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import pkg from './package.json' with { type: 'json' }
import { createSvgIconsPlugin } from './vite.plugin.icon.mjs'


// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    APP_NAME: JSON.stringify(pkg.productName),
    APP_VERSION: JSON.stringify(`v${ pkg.version }`),
  },
  build: {
    license: true,
  },
  plugins: [
    createSvgIconsPlugin({
      iconDirs: [ join(process.cwd(), 'svg-icons') ],
      symbolId: 'symbol-[dir]-[name]',
      domId: 'svg-icons-dom',
    }),
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
