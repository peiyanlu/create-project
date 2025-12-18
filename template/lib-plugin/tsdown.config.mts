import { defineConfig, type UserConfig } from 'tsdown'


const config: UserConfig[] = defineConfig([
  {
    entry: 'src/index.ts',
    format: 'cjs',
    outDir: 'dist/cjs',
  },
  {
    entry: 'src/index.ts',
    format: 'esm',
    outDir: 'dist/esm',
  },
] satisfies UserConfig[])

export default config
