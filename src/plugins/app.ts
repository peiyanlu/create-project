import { eol } from '@peiyanlu/cli-utils'
import { copyDir, type CopyDirOptions, editFile, editJsonFile } from '@peiyanlu/node-utils'
import { randomUUID, type UUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { type RealContext, Tpl } from '../action.js'
import { render } from '../handlebars.js'
import { BasePlugin } from './base.js'
import { releaseVersion } from './deps.js'


export class AppPlugin extends BasePlugin {
  override async beforeCopy(ctx: RealContext) {
    const { target, tplAppDir } = ctx.config
    
    await copyDir(tplAppDir, target, this.getCopyOptions(ctx))
    
    await super.beforeCopy(ctx)
  }
}


export class ReactAppPlugin extends AppPlugin {
  name = Tpl.React
  
  override async extendPrompts(): Promise<void> {}
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    const { packageName } = ctx.config
    await editFile('./index.html', content => {
      return content.replace(
        /<title>.*?<\/title>/,
        `<title>${ packageName }</title>`,
      )
    })
    
    await editFile('./.gitignore', content => {
      const extra = [ 'dist/', 'dist-ssr/', '*.local' ]
      return [ content, ...extra ].join('\n')
    })
    
    await super.afterCopy(ctx)
  }
}


export class ElectronAppPlugin extends AppPlugin {
  name = Tpl.Electron
  
  override getCopyOptions(ctx: RealContext): CopyDirOptions {
    const { automation } = ctx.config
    const github = [ '_github' ]
    
    const useGitHub = automation.includes('github')
    
    this.copyRename = Object.assign(this.copyRename, {
      _github: '.github',
      'main.ts.hbs': 'main.ts',
      'forge.config.ts.hbs': 'forge.config.ts',
    })
    this.copyIgnore.push(...[
      // automation
      (name: string) => !useGitHub && github.includes(name),
    ])
    
    return super.getCopyOptions(ctx)
  }
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    const { repo, automation } = ctx.config
    
    const useGitHub = automation.includes('github')
    
    this.applyRelease(ctx)
    
    await editFile('./forge.config.ts', content => {
      const [ owner, name ] = repo.split('/')
      return render(content, {
        OWNER: owner,
        NAME: name,
        useGitHub: useGitHub,
      })
    })
    
    await editFile('./src/main.ts', content => {
      const [ guidDev, guidProd ] = Array.from({ length: 2 }, (): UUID => randomUUID())
      return render(content, {
        REPO: repo,
        GUID_DEV: guidDev,
        GUID_PROD: guidProd,
        useGitHub: useGitHub,
      })
    })
    
    await editFile('./.gitignore', content => {
      const extra = [ '.vite/', 'out/' ]
      return [ content, ...extra ].join('\n')
    })
    
    await editFile('./.npmrc', content => {
      const extra = '#electron_mirror=https://npmmirror.com/mirrors/electron/'
      return [ content, extra ].join('\n')
    })
    
    await editJsonFile<Record<string, any>>('./renovate.json', json => {
      json.packageRules ??= []
      const idx = json.packageRules.findIndex((k: any) => k.matchPackageNames)
      if (idx >= 0) {
        json.packageRules[idx].matchPackageNames.push('vite')
      } else {
        json.packageRules.push({
          'matchPackageNames': [ 'vite' ],
          'enabled': false,
        })
      }
    })
    
    await super.afterCopy(ctx)
  }
  
  applyRelease(ctx: RealContext) {
    const { automation } = ctx.config
    const useRelease = automation.includes('release')
    
    if (useRelease) {
      ctx.addDevDeps([
        [ '@peiyanlu/release', releaseVersion ],
      ])
      ctx.setScripts({ 'release': 'release --skip-npm' })
      
      const content = [
        `import { defineConfig } from '@peiyanlu/release'`,
        `export default defineConfig({})`,
      ].join(eol(2))
      writeFileSync('./release.config.ts', content)
    }
  }
}
