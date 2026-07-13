import { multiselect, text } from '@clack/prompts'
import {
  checkVersion,
  type CopyOptions,
  editFile,
  editJsonFile,
  gitConfigGet,
  PkgManager,
  stringifyArgs,
} from '@peiyanlu/cli-utils'
import { assertPrompt, type RealContext, Tpl } from '../action.js'
import { render } from '../handlebars.js'
import { MESSAGES } from '../messages.js'
import { getInstallCommand, getRunCommand } from '../utils.js'


export const collapseBlankLines = (str: string, opts: { threshold?: number; preserve?: number } = {}): string => {
  const { threshold = 3, preserve = 3 } = opts
  const eol = str.includes('\r\n') ? '\r\n' : '\n'
  
  return str.replace(
    new RegExp(`(?:\\r?\\n){${ threshold },}`, 'g'),
    eol.repeat(preserve),
  )
}

export const parsePackageName = (validName: string): { scope?: string; name: string; } => {
  if (validName.startsWith('@')) {
    const slash = validName.indexOf('/')
    return {
      scope: validName.slice(1, slash),
      name: validName.slice(slash + 1),
    }
  }
  
  return { name: validName }
}

export type CopyFilter = (name: string, isDir: boolean) => boolean

export interface TemplatePlugin {
  name: Tpl
  copyRename: Record<string, string>
  copyIgnore: CopyFilter[]
  
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
  copyRename: Record<string, string> = {}
  copyIgnore: CopyFilter[] = []
  
  requiresPnpm(): boolean { return false }
  
  async extendPrompts(ctx: RealContext) {
    const { packageName, template } = ctx.config
    
    const isReact = template === Tpl.React
    const isMono = template === Tpl.Monorepo
    
    ctx.config.automation = await multiselect({
      message: MESSAGES.PROJECT_AUTOMATION_QUESTION,
      options: [
        ...(!isReact ? [
          {
            label: 'GitHub Actions',
            value: 'github',
            hint: 'CI/CD workflows for build, test, and release',
          },
          ...(
            isMono
              ? [
                {
                  label: 'Changesets',
                  value: 'changesets',
                  hint: 'Versioning and changelog generation',
                },
              ]
              : [
                {
                  label: 'Release',
                  value: 'release',
                  hint: 'Automated versioning and publishing',
                },
              ]
          ),
        ] : []),
        {
          label: 'Renovate',
          value: 'renovate',
          hint: 'Automatically update dependencies',
        },
      ],
      initialValues: [],
      required: false,
    }) as string[]
    assertPrompt(ctx.config.automation)
    
    const { scope = '__OWNER__', name } = parsePackageName(packageName)
    const defRepo = `${ scope }/${ name }`
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
    const { pkgManager, automation } = ctx.config
    const pnpmFiles: string[] = [ 'pnpm-workspace.yaml' ]
    const renovate = [ 'renovate.json' ]
    
    const isPnpm = pkgManager === PkgManager.PNPM
    
    return {
      rename: {
        _gitignore: '.gitignore',
        _npmrc: '.npmrc',
        'README.md.hbs': 'README.md',
        ...this.copyRename,
      },
      
      skips: [
        // automation
        (name: string) => !automation.includes('renovate') && renovate.includes(name),
        
        // pnpm
        (name: string) => !isPnpm && pnpmFiles.includes(name),
        
        ...this.copyIgnore,
      ],
    }
  }
  
  async beforeCopy(ctx: RealContext) {}
  
  async afterCopy(ctx: RealContext) {
    const { repo, packageName, description, pkgManager, useVitest, automation } = ctx.config
    const [ name, email ] = await Promise.all([ 'user.name', 'user.email' ].map(k => gitConfigGet(k)))
    
    const useGitHub = automation.includes('github')
    
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
        INSTALL: stringifyArgs(getInstallCommand(pkgManager)),
        RUN: stringifyArgs(getRunCommand(pkgManager, '')),
        REPO: repo,
        useCITest: useGitHub && useVitest,
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
