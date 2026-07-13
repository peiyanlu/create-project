import { defineConfig, type UserConfig } from 'tsdown'


const config: UserConfig[] = defineConfig([
  {
    entry: 'src/index.ts',
    format: [ 'esm' ],
    outDir: 'dist',
    platform: 'neutral',
    dts: true,
  },
] satisfies UserConfig[])

export default config
