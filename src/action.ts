import { cancel, intro, isCancel, outro, select, tasks, text } from '@clack/prompts'
import {
  checkVersion,
  type CliOptions,
  ConfirmResult,
  copyDirAsync,
  editFile,
  emptyDir,
  execAsync,
  getGitConfig,
  isEmpty,
  isGitRepo,
  isValidPackageName,
  PkgManager,
  toValidPackageName,
  toValidProjectName,
} from '@peiyanlu/cli-utils'
import { cyan, gray } from 'ansis'
import { existsSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { scheduler } from 'node:timers/promises'
import { Context } from './context.js'
import { MESSAGES } from './messages.js'
import { ElectronAppPlugin, ReactAppPlugin } from './plugins/app.js'
import { TemplatePlugin } from './plugins/base.js'
import { LibCliPlugin, LibMonorepoPlugin, LibPlugin, LibPluginPlugin } from './plugins/lib.js'
import { __dirname } from './utils.js'


export interface PromptsResult {
  targetDir: string;
  packageName: string;
  description: string;
  pkgManager: PkgManager;
  template: Tpl;
  useCI: boolean;
  useVitest: boolean;
  repo: string;
}

export type RealContext = Context<PromptsResult>

export enum Tpl {
  Lib = 'lib',
  Cli = 'lib-cli',
  Plugin = 'lib-plugin',
  Monorepo = 'lib-monorepo',
  Electron = 'app-electron',
  React = 'app-react',
}


export const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel(MESSAGES.OPERATION_ABORTED)
    process.exit(0)
  }
}

export const createDefaultConfig = (): PromptsResult => ({
  targetDir: '',
  packageName: '',
  description: '',
  pkgManager: PkgManager.NPM,
  template: Tpl.Lib,
  useCI: false,
  useVitest: false,
  repo: '',
})

const handleDirConflict = async (targetDir: string, options: CliOptions): Promise<void> => {
  const isExists = existsSync(targetDir)
  const ignore = [ '.git', '.idea', '.vscode' ]
  if (isExists && !await isEmpty(targetDir, ignore)) {
    const overwrite = options.overwrite
      ? ConfirmResult.YES
      : await select({
        message: MESSAGES.DIRECTORY_CONFLICT_QUESTION(targetDir),
        options: [
          {
            label: 'Cancel',
            value: ConfirmResult.NO,
            hint: 'cancel and exit',
          },
          {
            label: 'Remove',
            value: ConfirmResult.YES,
            hint: 'remove files and continue',
          },
          {
            label: 'Ignore',
            value: ConfirmResult.IGNORE,
            hint: 'ignore files and continue',
          },
        ],
      })
    assertPrompt(overwrite)
    switch (overwrite) {
      case ConfirmResult.YES:
        await emptyDir(targetDir, ignore)
        break
      case ConfirmResult.NO:
        outro(MESSAGES.OPERATION_ABORTED)
        process.exit(0)
    }
  }
}

const pluginRegistry: Record<Tpl, () => TemplatePlugin> = {
  [Tpl.Lib]: () => new LibPlugin(),
  [Tpl.Cli]: () => new LibCliPlugin(),
  [Tpl.Plugin]: () => new LibPluginPlugin(),
  [Tpl.Monorepo]: () => new LibMonorepoPlugin(),
  [Tpl.React]: () => new ReactAppPlugin(),
  [Tpl.Electron]: () => new ElectronAppPlugin(),
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: CliOptions): Promise<void> {
    intro(cyan('create-project'))
    
    const ctx = new Context(createDefaultConfig())
    const config = await this.handlePrompts(cmdArgs, options, ctx)
    const { targetDir, pkgManager, template, packageName, description, useVitest } = config
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    const cwd: string = process.cwd()
    const source = resolve(__dirname, '..', 'template', template)
    const target = resolve(cwd, targetDir)
    
    const plugin = pluginRegistry[template]()
    
    await tasks([
      {
        title: MESSAGES.PROJECT_INFORMATION_START,
        task: async () => {
          await plugin.beforeCopy(ctx)
          
          await copyDirAsync(source, target, plugin.getCopyOptions(ctx))
          await scheduler.yield()
          
          // -----------------------------------------------------
          process.chdir(targetDir)
          await scheduler.yield()
          
          const [ name, email ] = await Promise.all([ 'user.name', 'user.email' ].map(k => getGitConfig(k)))
          
          // -----------------------------------------------------
          await editFile('./README.md', content => {
            const isYarn = pkgManager === PkgManager.YARN
            return content
              .replace(/\$PACKAGE_NAME/g, packageName)
              .replace(/\$DESCRIPTION/g, description)
              .replace(/\$INSTALL/g, isYarn ? PkgManager.YARN : `${ pkgManager } install`)
              .replace(/\$RUN/g, isYarn ? PkgManager.YARN : `${ pkgManager } run`)
              .replace(/\$START([\s\S]*?)\$END/g, (_, $1) => useVitest ? $1 : '')
              .replace(/(\r?\n){3,}/g, '\r\n'.repeat(2))
          })
          await editFile('./LICENSE', content => {
            return content
              .replace(/^\$YEAR$/g, new Date().getFullYear().toString())
              .replace(/^\$OWNER$/g, name ?? 'OWNER')
          })
          
          await plugin.afterCopy(ctx)
          await plugin.afterAll(ctx)
          
          // -----------------------------------------------------
          const cmdArr = [
            `npm pkg set name="${ packageName }" description="${ description }"`,
            `npm pkg set author.name="${ name }" author.email="${ email }"`,
          ]
          
          const isRepo = await isGitRepo()
          if (!isRepo) {
            cmdArr.push(...[
              'git init',
              'git branch -M master',
            ])
          }
          for (const cmd of cmdArr) {
            await execAsync(cmd)
            await scheduler.yield()
          }
          
          return MESSAGES.PROJECT_INFORMATION_END
        },
      },
    ])
    
    let doneMessage = '🎉  Done. Now run:\n'
    const cdProjectName = relative(cwd, target)
    const prefix = `\n  ${ gray('$') }`
    if (target !== cwd) {
      const dir = cdProjectName.includes(' ') ? `"${ cdProjectName }"` : cdProjectName
      doneMessage += `${ prefix } ${ cyan('cd') } ${ dir }\n`
    }
    switch (pkgManager) {
      case PkgManager.YARN:
        doneMessage += `${ prefix } yarn`
        doneMessage += `${ prefix } yarn dev`
        break
      default:
        doneMessage += `${ prefix } ${ pkgManager } install`
        doneMessage += `${ prefix } ${ pkgManager } run dev`
        break
    }
    
    doneMessage += plugin.getDoneMessage(prefix)
    
    outro(doneMessage)
    
    process.exit(0)
  }
  
  public async handlePrompts(
    cmdArgs: string | undefined,
    options: CliOptions,
    ctx: RealContext,
  ): Promise<PromptsResult> {
    // 1. Get project name and target dir
    const prjName = cmdArgs ? toValidProjectName(cmdArgs) : undefined
    const projectName = prjName
      ? prjName
      : await text({
        message: MESSAGES.PROJECT_NAME_QUESTION,
        placeholder: 'Anonymous',
        defaultValue: 'untitled',
      }) as string
    assertPrompt(projectName)
    ctx.config.targetDir = toValidProjectName(projectName)
    
    
    // 2. Handle directory if exist and not empty
    await handleDirConflict(ctx.config.targetDir, options)
    
    
    // 3. Get package name
    const pkgName = basename(resolve(ctx.config.targetDir))
    ctx.config.packageName = isValidPackageName(pkgName)
      ? pkgName
      : await text({
        message: MESSAGES.PACKAGE_NAME_QUESTION,
        initialValue: toValidPackageName(pkgName),
        placeholder: toValidPackageName(pkgName),
        validate(val) {
          if (!val || !isValidPackageName(val)) {
            return 'Invalid'
          }
        },
      }) as string
    assertPrompt(ctx.config.packageName)
    
    
    // 4. Get project description
    ctx.config.description = await text({
      message: MESSAGES.PACKAGE_DESCRIPTION_QUESTION,
      placeholder: 'Anonymous',
      defaultValue: 'My project description.',
    }) as string
    assertPrompt(ctx.config.description)
    
    
    // 5. Choose a template
    const argTemplate = options.template as Tpl
    ctx.config.template = Object.values(Tpl).includes(argTemplate)
      ? argTemplate
      : await select({
        message: MESSAGES.PROJECT_TEMPLATE_QUESTION,
        options: [
          {
            label: 'Library',
            value: Tpl.Lib,
            hint: 'Publishable npm library with TypeScript, ESM & CJS support',
          },
          {
            label: 'CLI',
            value: Tpl.Cli,
            hint: 'Command-line tool for scaffolding and automation',
          },
          {
            label: 'Monorepo',
            value: Tpl.Monorepo,
            hint: 'Multi-package repository using pnpm workspace',
          },
          {
            label: 'Plugin',
            value: Tpl.Plugin,
            hint: 'Plugin for Anonymous',
          },
          {
            label: 'Electron',
            value: Tpl.Electron,
            hint: 'Desktop application using Electron, Vite, and TypeScript',
          },
          {
            label: 'React',
            value: Tpl.React,
            hint: 'React web project powered by Vite and TypeScript',
          },
        ],
      }) as Tpl
    assertPrompt(ctx.config.template)
    
    
    const plugin = pluginRegistry[ctx.config.template]()
    const requiresPnpm = plugin.requiresPnpm() ?? false
    
    
    // 6. Choose a package manager
    ctx.config.pkgManager = requiresPnpm
      ? PkgManager.PNPM
      : await select({
        message: MESSAGES.PACKAGE_MANAGER_QUESTION,
        options: (await Promise.all([
          PkgManager.PNPM,
          PkgManager.NPM,
          PkgManager.YARN,
        ].map(async k => {
          const version = await checkVersion(k)
          return { label: k, value: k, hint: version }
        }))).filter(k => k.hint),
      }) as PkgManager
    assertPrompt(ctx.config.pkgManager)
    
    
    await plugin.extendPrompts(ctx)
    
    return ctx.config
  }
}
