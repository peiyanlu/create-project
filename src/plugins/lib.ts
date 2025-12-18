import { confirm } from '@clack/prompts'
import { checkVersion, editJsonFile, PkgManager } from '@peiyanlu/cli-utils'
import { assertPrompt, RealContext, Tpl } from '../action.js'
import { MESSAGES } from '../messages.js'
import { BasePlugin } from './base.js'


export class LibPlugin extends BasePlugin {
  name = Tpl.Lib
  
  async extendPrompts(ctx: RealContext) {
    await super.extendPrompts(ctx)
    
    ctx.config.useVitest = await confirm({
      message: MESSAGES.VITEST_USE_QUESTION,
    }) as boolean
    assertPrompt(ctx.config.useVitest)
  }
  
  async afterCopy(ctx: RealContext): Promise<void> {
    const { useCI, pkgManager, useVitest } = ctx.config
    
    const isPnpm = pkgManager === PkgManager.PNPM
    
    if (!useCI) {
      ctx.removeDevDeps([
        'release-it',
        'release-it-pnpm',
        '@release-it/conventional-changelog',
      ])
    }
    if (useCI) {
      ctx.setScripts({ 'release': 'release-it' })
      
      if (!isPnpm) {
        ctx.removeDevDeps([ 'release-it-pnpm' ])
        
        await editJsonFile('.release-it.json', json => {
          delete json.plugins['release-it-pnpm']
        })
      }
    }
    
    if (!useVitest) {
      ctx.removeDevDeps([
        'vitest',
        '@vitest/coverage-v8',
      ])
    }
    if (useVitest) {
      ctx.setScripts({
        'test': 'vitest run',
        'test:e2e': 'vitest run -c vitest.config.e2e.mts',
        'test:cov': 'vitest run --coverage',
      })
    }
    
    await super.afterCopy(ctx)
  }
}

export class LibPluginPlugin extends LibPlugin {
  name = Tpl.Plugin
}

export class LibCliPlugin extends LibPlugin {
  name = Tpl.Cli
  
  async afterCopy(ctx: RealContext): Promise<void> {
    const { packageName } = ctx.config
    
    ctx.enqueueCommand([
      `npm pkg set bin.${ packageName }="index.js"`,
    ])
    
    await super.afterCopy(ctx)
  }
}

export class LibMonorepoPlugin extends LibPlugin {
  name = Tpl.Monorepo
  
  public requiresPnpm(): boolean {
    return true
  }
  
  async afterCopy(ctx: RealContext): Promise<void> {
    const { useCI } = ctx.config
    
    if (!useCI) {
      ctx.removeDevDeps([ '@changesets/cli' ])
    }
    if (useCI) {
      ctx.setScripts({
        'cs:init': 'changeset init',
        'cs:add': 'changeset add',
        'cs:version': 'changeset version',
        'cs:publish': 'changeset publish',
      })
    }
    
    const pnpmVersion = await checkVersion('pnpm')
    if (pnpmVersion) {
      ctx.enqueueCommand([
        `npm pkg set packageManager="pnpm@${ pnpmVersion }"`,
      ])
    }
    
    await super.afterCopy(ctx)
  }
  
  getDoneMessage(prefix: string): string {
    let msg = '\n'
    msg += `${ prefix } pnpm cs:init`
    return msg
  }
}
