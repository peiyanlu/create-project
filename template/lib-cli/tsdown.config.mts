import { defineConfig, type UserConfig } from 'tsdown'


const nodeConfig = {
  platform: 'node',
  nodeProtocol: true,
  shims: true,
} satisfies UserConfig

const config: UserConfig[] = defineConfig([
  {
    entry: 'src/cli.ts',
    format: [ 'esm' ],
    outDir: 'dist',
    ...nodeConfig,
  },
  {
    entry: 'src/index.ts',
    format: [ 'esm' ],
    outDir: 'dist',
    ...nodeConfig,
    dts: true,
    publint: true,
  },
] satisfies UserConfig[])

export default config
