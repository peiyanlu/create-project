import { confirm, text } from '@clack/prompts'
import { CopyOptions, editJsonFile, isTestFile, PkgManager } from '@peiyanlu/cli-utils'
import { assertPrompt, RealContext, Tpl } from '../action.js'
import { MESSAGES } from '../messages.js'


export interface TemplatePlugin {
  name: Tpl
  
  requiresPnpm(): boolean
  
  extendPrompts(ctx: RealContext): Promise<void>
  
  getCopyOptions(ctx: RealContext): CopyOptions
  
  beforeCopy(ctx: RealContext): Promise<void>
  
  afterCopy(ctx: RealContext): Promise<void>
  
  afterAll(ctx: RealContext): Promise<void>
  
  getDoneMessage(prefix: string): string
}

export class BasePlugin implements TemplatePlugin {
  name = 'base' as Tpl
  
  requiresPnpm(): boolean { return false }
  
  async extendPrompts(ctx: RealContext) {
    const { packageName } = ctx.config
    
    ctx.config.useCI = await confirm({
      message: MESSAGES.PROJECT_CI_QUESTION,
    }) as boolean
    assertPrompt(ctx.config.useCI)
    
    const defRepo = `__USER__/${ packageName }`
    ctx.config.repo = await text({
      message: MESSAGES.PROJECT_REPO_QUESTION,
      initialValue: defRepo,
      placeholder: defRepo,
      validate(str) {
        const regex = /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/
        if (!str || !regex.test(str)) {
          return 'Invalid (user/repo)'
        }
      },
    }) as string
    assertPrompt(ctx.config.repo)
  }
  
  getCopyOptions(ctx: RealContext): CopyOptions {
    const { useCI, useVitest, pkgManager } = ctx.config
    const pnpmFiles: string[] = [
      'pnpm-workspace.yaml',
    ]
    const ciFiles: string[] = [
      '_github',
      'release.config.ts',
      'renovate.json',
    ]
    const isPnpm = pkgManager === PkgManager.PNPM
    
    return {
      rename: {
        _gitignore: '.gitignore',
        _npmrc: '.npmrc',
        // CI
        _github: '.github',
      },
      
      skips: [
        // CI
        (name: string) => !useCI && ciFiles.includes(name),
        
        // Vitest
        (name: string) => !useVitest && isTestFile(name),
        
        // pnpm
        (name: string) => !isPnpm && pnpmFiles.includes(name),
      ],
    }
  }
  
  async beforeCopy(ctx: RealContext) {}
  
  async afterCopy(ctx: RealContext) {
    const { repo } = ctx.config
    
    if (repo) {
      await editJsonFile('./package.json', (pkg) => {
        pkg.repository = {
          type: 'git',
          url: `https://github.com/${ repo }.git`,
        }
        pkg.bugs = { url: `https://github.com/${ repo }/issues` }
        pkg.homepage = `https://github.com/${ repo }#readme`
      })
    }
  }
  
  async afterAll(ctx: RealContext): Promise<void> {
    await ctx.applyChanges()
  }
  
  getDoneMessage(prefix: string): string {
    return ''
  }
}
