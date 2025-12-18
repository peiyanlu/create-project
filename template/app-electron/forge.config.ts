import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { ElectronegativityPlugin } from '@electron-forge/plugin-electronegativity'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { isLinux } from '@peiyanlu/electron-ipc'
import { join } from 'path'
import pkg from './package.json'


const iconResDir = 'resources/icons'

const joinPath = (...paths: string[]) => join(__dirname, iconResDir, ...paths)

const executableName = isLinux ? pkg.productName.toLowerCase() : undefined


export default {
  packagerConfig: {
    asar: true,
    icon: joinPath('icon'),
    executableName,
    extraResource: [
      iconResDir,
    ],
    ignore: (file: string) => {
      if (!file) return false
      return ![ '/.vite', '/node_modules' ].some(prefix => file.startsWith(prefix))
    },
  },
  makers: [
    // Windows
    new MakerSquirrel({}),
    // new MakerMSIX({}),
    // 全平台都可用
    new MakerZIP({}),
    // Mac 标准格式
    new MakerDMG({}),
    // Linux redhat，centos，Fedora
    new MakerRpm({
      options: {
        icon: joinPath('icon.png'),
      },
    }),
    // Linux debian，ubuntu
    new MakerDeb({
      options: {
        icon: joinPath('icon.png'),
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    new ElectronegativityPlugin({
      isSarif: true,
    }),
    new AutoUnpackNativesPlugin({}),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: [ 'all' ],
      config: {
        repository: {
          owner: '__USER__',
          name: '__REPO__',
        },
        draft: false,
        prerelease: false,
        generateReleaseNotes: true,
      },
    },
  ],
} satisfies ForgeConfig
