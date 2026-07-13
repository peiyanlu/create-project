import { confirm } from '@clack/prompts'
import { copyDirAsync, type CopyOptions, editFile, editJsonFile, eol, isTestFile } from '@peiyanlu/cli-utils'
import { writeFileSync } from 'node:fs'
import { assertPrompt, type RealContext, Tpl } from '../action.js'
import { MESSAGES } from '../messages.js'
import { BasePlugin, parsePackageName } from './base.js'
import { changesetsVersion, releaseVersion, vitestCovVersion, vitestVersion } from './deps.js'


export class LibPlugin extends BasePlugin {
  name = Tpl.Lib
  
  override async extendPrompts(ctx: RealContext) {
    await super.extendPrompts(ctx)
    
    ctx.config.useVitest = await confirm({
      message: MESSAGES.VITEST_USE_QUESTION,
    }) as boolean
    assertPrompt(ctx.config.useVitest)
  }
  
  override getCopyOptions(ctx: RealContext): CopyOptions {
    const { useVitest, automation } = ctx.config
    const github = [ '_github' ]
    const testActions = [ 'test.yaml' ]
    
    const useGitHub = automation.includes('github')
    
    this.copyRename = Object.assign(this.copyRename, {
      _github: '.github',
    })
    this.copyIgnore.push(...[
      // automation
      (name: string) => (useGitHub && !useVitest) && testActions.includes(name),
      (name: string) => !useGitHub && github.includes(name),
      
      // Vitest
      (name: string) => !useVitest && isTestFile(name),
    ])
    
    return super.getCopyOptions(ctx)
  }
  
  override async beforeCopy(ctx: RealContext) {
    const { target, tplLibDir } = ctx.config
    
    await copyDirAsync(tplLibDir, target, this.getCopyOptions(ctx))
    
    await super.beforeCopy(ctx)
  }
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    const { useVitest } = ctx.config
    
    this.applyRelease(ctx)
    this.applyVitest(ctx)
    
    await editFile('./.gitignore', content => {
      const extra = [ 'dist/' ]
      if (useVitest) extra.push('coverage/')
      
      return [ content, ...extra ].join('\n')
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
      ctx.setScripts({ 'release': 'release' })
      
      const content = [
        `import { defineConfig } from '@peiyanlu/release'`,
        `export default defineConfig({})`,
      ].join(eol(2))
      writeFileSync('./release.config.ts', content)
    }
  }
  
  applyVitest(ctx: RealContext) {
    const { useVitest } = ctx.config
    
    if (useVitest) {
      ctx.addDevDeps([
        [ 'vitest', vitestVersion ],
        [ '@vitest/coverage-v8', vitestCovVersion ],
      ])
      ctx.setScripts({
        'test': 'vitest run',
        'test:cov': 'vitest run --coverage',
      })
    }
  }
}


export class LibCliPlugin extends LibPlugin {
  name = Tpl.Cli
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    const { packageName } = ctx.config
    
    const { name } = parsePackageName(packageName)
    ctx.enqueueCommand([
      `npm pkg set bin."${ name }"="index.js"`,
    ])
    ctx.setBin({ [name]: 'index.js' })
    
    await editJsonFile('./renovate.json', json => {
      json.customManagers ??= []
      json.customManagers.push(...[
        {
          'customType': 'regex',
          'managerFilePatterns': [
            'src/.*\\.ts$',
          ],
          'matchStrings': [
            '//\\s*renovate:\\s+datasource=(?<datasource>\\S+)\\s+depName=(?<depName>\\S+)\\s+(?:export\\s+)?(?:var|let|const)\\s+\\S+\\s*=\\s*["\'](?<currentValue>[^"\']+)["\']',
          ],
        },
      ])
    })
    
    await super.afterCopy(ctx)
  }
}


export class LibMonorepoPlugin extends LibPlugin {
  name = Tpl.Monorepo
  
  override requiresPnpm(): boolean {
    return true
  }
  
  override getDoneMessage(prefix: string): string {
    let msg = '\n'
    msg += `${ prefix } pnpm cs:init`
    return msg
  }
  
  applyRelease(ctx: RealContext) {
    const { automation } = ctx.config
    const useRelease = automation.includes('changesets')
    
    if (useRelease) {
      ctx.addDevDeps([
        [ '@changesets/cli', changesetsVersion ],
      ])
      ctx.setScripts({
        'cs:init': 'changeset init',
        'cs:add': 'changeset add',
        'cs:version': 'changeset version',
        'cs:publish': 'changeset publish',
      })
    }
  }
}


export class LibPluginPlugin extends LibPlugin {
  name = Tpl.Plugin
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    await editJsonFile('./renovate.json', json => {
      json.packageRules ??= []
      json.packageRules.push(...[
        {
          'matchDepTypes': [ 'peerDependencies' ],
          'rangeStrategy': 'widen',
        },
        {
          'matchDepTypes': [ 'peerDependencies' ],
          'matchUpdateTypes': [ 'minor', 'patch' ],
          'enabled': false,
        },
      ])
    })
    
    await super.afterCopy(ctx)
  }
}
