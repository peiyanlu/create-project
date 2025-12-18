import { defineConfig } from 'vitest/config'


export default defineConfig({
  test: {
    include: [ '**/tests/**/*.{test,spec}.{ts,mts}' ],
    coverage: {
      provider: 'v8',
    },
    deps: {
      // we specify 'packages' so Vitest doesn't inline the files
      moduleDirectories: [ 'node_modules', 'packages' ],
    },
  },
})
