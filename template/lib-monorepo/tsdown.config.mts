import { defineConfig, type UserConfig } from 'tsdown'


const nodeConfig = {
  platform: 'node',
  nodeProtocol: true,
  shims: true,
} satisfies UserConfig

const config: UserConfig[] = defineConfig([
  {
    entry: 'src/index.ts',
    format: [ 'esm' ],
    outDir: 'dist',
    platform: 'neutral',
    dts: true,
    workspace: true,
    publint: true,
  },
] satisfies UserConfig[])

export default config
