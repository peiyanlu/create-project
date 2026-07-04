import { confirm, text } from '@clack/prompts'
import {
  checkVersion,
  type CopyOptions,
  editFile,
  editJsonFile,
  gitConfigGet,
  isScopedPackageName,
  isTestFile,
  PkgManager,
} from '@peiyanlu/cli-utils'
import { assertPrompt, RealContext, Tpl } from '../action.js'
import { render } from '../handlebars.js'
import { MESSAGES } from '../messages.js'


export const collapseBlankLines = (str: string, opts: { threshold?: number; preserve?: number } = {}): string => {
  const { threshold = 3, preserve = 3 } = opts
  const eol = str.includes('\r\n') ? '\r\n' : '\n'
  
  return str.replace(
    new RegExp(`(?:\\r?\\n){${ threshold },}`, 'g'),
    eol.repeat(preserve),
  )
}


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
    
    const name = isScopedPackageName(packageName)
      ? packageName.split('/')[1]
      : packageName
    
    const defRepo = `__OWNER__/${ name }`
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
    const testActions = [ 'test.yaml' ]
    
    return {
      rename: {
        _gitignore: '.gitignore',
        _npmrc: '.npmrc',
        'README.md.txt': 'README.md',
        // CI
        _github: '.github',
      },
      
      skips: [
        // CI
        (name: string) => !useCI && ciFiles.includes(name),
        (name: string) => (useCI && !useVitest) && testActions.includes(name),
        
        // Vitest
        (name: string) => !useVitest && isTestFile(name),
        
        // pnpm
        (name: string) => !isPnpm && pnpmFiles.includes(name),
      ],
    }
  }
  
  async beforeCopy(ctx: RealContext) {}
  
  async afterCopy(ctx: RealContext) {
    const { repo, packageName, description, pkgManager, useVitest, useCI } = ctx.config
    const [ name, email ] = await Promise.all([ 'user.name', 'user.email' ].map(k => gitConfigGet(k)))
    
    const isYarn = pkgManager === PkgManager.YARN
    const isNpm = pkgManager === PkgManager.NPM
    const isPnpm = pkgManager === PkgManager.PNPM
    
    await editJsonFile('./package.json', async (pkg) => {
      pkg.name = packageName
      pkg.description = description
      pkg.author.name = name
      pkg.author.email = email
      
      if (repo) {
        pkg.repository = {
          type: 'git',
          url: `git+https://github.com/${ repo }.git`,
        }
        pkg.bugs = { url: `https://github.com/${ repo }/issues` }
        pkg.homepage = `https://github.com/${ repo }#readme`
      }
      
      const pkgV = await checkVersion(pkgManager)
      pkg.packageManager = `${ pkgManager }@${ pkgV }`
    })
    
    await editFile('./README.md', content => {
      return collapseBlankLines(render(content, {
        PACKAGE_NAME: packageName,
        DESCRIPTION: description,
        INSTALL: isYarn ? PkgManager.YARN : `${ pkgManager } install`,
        RUN: isYarn ? PkgManager.YARN : `${ pkgManager } run`,
        ADD: `${ pkgManager } ${ isNpm ? 'install' : 'add' }`,
        REPO: repo,
        useCITest: useCI && useVitest,
      }))
    })
    
    await editFile('./LICENSE', content => {
      return content
        .replace(/\$YEAR/g, String(new Date().getFullYear()))
        .replace(/\$OWNER/g, name ?? 'OWNER')
    })
  }
  
  async afterAll(ctx: RealContext): Promise<void> {
    await ctx.applyChanges()
  }
  
  getDoneMessage(prefix: string): string {
    return ''
  }
}
